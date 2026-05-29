"use server";

import { db } from "@/lib/firebase/admin";
import { createHash } from "crypto";

// ─── LHDN MyInvois API ───────────────────────────────────────────────────────

const LHDN_API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.myinvois.hasil.gov.my"
    : "https://preprod-api.myinvois.hasil.gov.my";

// ─── OAuth2 token (client credentials) ──────────────────────────────────────

async function getLhdnToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${LHDN_API_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "InvoicingAPI",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LHDN auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ─── Sync: fetch recent documents from LHDN ─────────────────────────────────

export async function syncWithLHDN(userId: string): Promise<
  | { success: true; syncedCount: number; message: string }
  | { success: false; error: string }
> {
  try {
    // 1. Load credentials
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.lhdnCredentials?.clientId) {
      return {
        success: false,
        error: "LHDN credentials not found. Please link your account in Settings.",
      };
    }

    const { clientId, clientSecret } = userData.lhdnCredentials;

    // 2. Get OAuth2 token
    const token = await getLhdnToken(clientId, clientSecret);

    // 3. Fetch recent documents
    const docsRes = await fetch(
      `${LHDN_API_BASE}/api/v1.0/documents/recent?pageNo=1&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!docsRes.ok) {
      throw new Error(`Failed to fetch LHDN documents (${docsRes.status})`);
    }

    const docsData = await docsRes.json();
    // MyInvois returns: { result: [...], metadata: { ... } }
    const documents: any[] = docsData.result || [];

    if (documents.length === 0) {
      await db.collection("users").doc(userId).update({
        "lhdnCredentials.lastSynced": new Date(),
      });
      return { success: true, syncedCount: 0, message: "No new documents from LHDN." };
    }

    // 4. Write synced documents to Firestore
    const batch = db.batch();
    for (const doc of documents) {
      const docRef = db.collection("transactions").doc();
      batch.set(docRef, {
        userId,
        vendor: doc.supplierName || doc.issuerName || "LHDN Import",
        amount: parseFloat(doc.totalPayableAmount || doc.totalAmount || "0"),
        date: doc.dateTimeIssued ? new Date(doc.dateTimeIssued) : new Date(),
        type: "expense",
        category: "Other",
        description: `Synced from LHDN MyInvois (${doc.internalId || doc.uuid})`,
        compliance: {
          isVerified: doc.status === "Valid",
          eInvoiceRef: doc.longId || doc.uuid || null,
          syncedAt: new Date(),
        },
        createdAt: new Date(),
      });
    }
    await batch.commit();

    // 5. Update lastSynced
    await db.collection("users").doc(userId).update({
      "lhdnCredentials.lastSynced": new Date(),
    });

    return {
      success: true,
      syncedCount: documents.length,
      message: `Successfully synced ${documents.length} document(s) from LHDN MyInvois.`,
    };
  } catch (error: any) {
    console.error("LHDN Sync Error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Validate: submit a transaction to LHDN ─────────────────────────────────

export async function validateInvoice(
  transactionId: string,
  userId: string
): Promise<
  | { success: true; eInvoiceRef: string; status: string }
  | { success: false; error: string }
> {
  try {
    // Load credentials + transaction
    const [userDoc, txDoc] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("transactions").doc(transactionId).get(),
    ]);

    const userData = userDoc.data();
    const txData = txDoc.data();

    if (!userData?.lhdnCredentials?.clientId) {
      return { success: false, error: "LHDN credentials not linked. Go to Settings." };
    }
    if (!txData) {
      return { success: false, error: "Transaction not found." };
    }

    const { clientId, clientSecret } = userData.lhdnCredentials;
    const tin = userData.settings?.taxId || "";
    const brn = userData.settings?.businessRegNo || "";

    // Get token
    const token = await getLhdnToken(clientId, clientSecret);

    // Build minimal UBL 2.1 document
    const invoiceDate = txData.date?.toDate?.() ?? new Date();
    const ublDoc = buildUblDocument({
      invoiceNumber: transactionId.slice(0, 12).toUpperCase(),
      date: invoiceDate,
      supplierTin: tin,
      supplierBrn: brn,
      supplierName: txData.vendor,
      buyerName: userData.displayName || "Consumer",
      amount: txData.amount,
      category: txData.category,
      description: txData.description || txData.category,
    });

    const docJson = JSON.stringify(ublDoc);
    const docHash = createHash("sha256").update(docJson).digest("hex");
    const docBase64 = Buffer.from(docJson).toString("base64");

    // Submit to LHDN
    const submitRes = await fetch(`${LHDN_API_BASE}/api/v1.0/documentsubmissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documents: [
          {
            format: "JSON",
            document: docBase64,
            documentHash: docHash,
            codeNumber: transactionId.slice(0, 12).toUpperCase(),
          },
        ],
      }),
    });

    if (!submitRes.ok) {
      const body = await submitRes.text();
      throw new Error(`LHDN submission failed (${submitRes.status}): ${body}`);
    }

    const submitData = await submitRes.json();
    const accepted = submitData.acceptedDocuments?.[0];
    const eInvoiceRef = accepted?.longId || accepted?.uuid || `LHDN-${Date.now()}`;

    // Update local transaction
    await db.collection("transactions").doc(transactionId).update({
      "compliance.isVerified": true,
      "compliance.eInvoiceRef": eInvoiceRef,
      "compliance.validatedAt": new Date(),
    });

    return { success: true, eInvoiceRef, status: "Valid" };
  } catch (error: any) {
    console.error("validateInvoice error:", error);
    return { success: false, error: error.message };
  }
}

// ─── UBL 2.1 document builder (minimal LHDN-compliant structure) ─────────────

interface UblInput {
  invoiceNumber: string;
  date: Date;
  supplierTin: string;
  supplierBrn: string;
  supplierName: string;
  buyerName: string;
  amount: number;
  category: string;
  description: string;
}

function buildUblDocument(input: UblInput) {
  const taxExclusive = input.amount / 1.08;
  const taxAmount = input.amount - taxExclusive;

  return {
    _D: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    _A: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    _B: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    Invoice: [
      {
        ID: [{ _: input.invoiceNumber }],
        IssueDate: [{ _: input.date.toISOString().split("T")[0] }],
        IssueTime: [{ _: input.date.toISOString().split("T")[1].replace("Z", "") }],
        InvoiceTypeCode: [{ _: "01", listVersionID: "1.0" }],
        DocumentCurrencyCode: [{ _: "MYR" }],
        InvoicePeriod: [{ Description: [{ _: "Not Applicable" }] }],
        AccountingSupplierParty: [
          {
            Party: [
              {
                IndustryClassificationCode: [{ _: "46510", name: "Retail" }],
                PartyIdentification: [
                  { ID: [{ _: input.supplierTin, schemeID: "TIN" }] },
                  { ID: [{ _: input.supplierBrn, schemeID: "BRN" }] },
                ],
                PartyLegalEntity: [{ RegistrationName: [{ _: input.supplierName }] }],
                Contact: [{ Telephone: [{ _: "0000000000" }] }],
              },
            ],
          },
        ],
        AccountingCustomerParty: [
          {
            Party: [
              {
                PartyIdentification: [{ ID: [{ _: "EI00000000010", schemeID: "BRN" }] }],
                PartyLegalEntity: [{ RegistrationName: [{ _: input.buyerName }] }],
              },
            ],
          },
        ],
        Delivery: [{ DeliveryParty: [{ PartyLegalEntity: [{ RegistrationName: [{ _: input.buyerName }] }] }] }],
        PaymentMeans: [{ PaymentMeansCode: [{ _: "01" }] }],
        TaxTotal: [
          {
            TaxAmount: [{ _: parseFloat(taxAmount.toFixed(2)), currencyID: "MYR" }],
            TaxSubtotal: [
              {
                TaxableAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }],
                TaxAmount: [{ _: parseFloat(taxAmount.toFixed(2)), currencyID: "MYR" }],
                TaxCategory: [
                  {
                    ID: [{ _: "01" }],
                    TaxExemptionReason: [{ _: "" }],
                    TaxScheme: [{ ID: [{ _: "OTH", schemeID: "UN/ECE 5153", schemeAgencyID: "6" }] }],
                  },
                ],
              },
            ],
          },
        ],
        LegalMonetaryTotal: [
          {
            LineExtensionAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }],
            TaxExclusiveAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }],
            TaxInclusiveAmount: [{ _: parseFloat(input.amount.toFixed(2)), currencyID: "MYR" }],
            PayableAmount: [{ _: parseFloat(input.amount.toFixed(2)), currencyID: "MYR" }],
          },
        ],
        InvoiceLine: [
          {
            ID: [{ _: "1" }],
            InvoicedQuantity: [{ _: 1, unitCode: "C62" }],
            LineExtensionAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }],
            TaxTotal: [
              {
                TaxAmount: [{ _: parseFloat(taxAmount.toFixed(2)), currencyID: "MYR" }],
                TaxSubtotal: [
                  {
                    TaxableAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }],
                    TaxAmount: [{ _: parseFloat(taxAmount.toFixed(2)), currencyID: "MYR" }],
                    Percent: [{ _: 8.0 }],
                    TaxCategory: [
                      { ID: [{ _: "01" }], TaxScheme: [{ ID: [{ _: "OTH", schemeID: "UN/ECE 5153", schemeAgencyID: "6" }] }] },
                    ],
                  },
                ],
              },
            ],
            Item: [
              {
                Description: [{ _: input.description }],
                OriginCountry: [{ IdentificationCode: [{ _: "MYS" }] }],
                CommodityClassification: [{ ItemClassificationCode: [{ _: "022", listID: "CLASS" }] }],
              },
            ],
            Price: [{ PriceAmount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }] }],
            ItemPriceExtension: [{ Amount: [{ _: parseFloat(taxExclusive.toFixed(2)), currencyID: "MYR" }] }],
          },
        ],
      },
    ],
  };
}
