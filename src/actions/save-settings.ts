"use server";

import { db } from "@/lib/firebase/admin";

export interface UserSettingsInput {
  currency?: string;
  taxId?: string;
  businessRegNo?: string;
}

export interface LhdnCredentialsInput {
  clientId: string;
  clientSecret: string;
  taxId: string;
  businessRegNo: string;
}

// Save profile + tax settings
export async function saveUserSettingsAction(
  userId: string,
  settings: UserSettingsInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const updates: Record<string, any> = {};
    if (settings.currency !== undefined) updates["settings.currency"] = settings.currency;
    if (settings.taxId !== undefined) updates["settings.taxId"] = settings.taxId;
    if (settings.businessRegNo !== undefined) updates["settings.businessRegNo"] = settings.businessRegNo;

    await db.collection("users").doc(userId).update(updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Save LHDN credentials + TIN/BRN together
export async function saveLhdnCredentialsAction(
  userId: string,
  creds: LhdnCredentialsInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.collection("users").doc(userId).update({
      "settings.taxId": creds.taxId,
      "settings.businessRegNo": creds.businessRegNo,
      lhdnCredentials: {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        isLinked: true,
        linkedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Remove LHDN credentials (unlink)
export async function unlinkLhdnAction(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.collection("users").doc(userId).update({
      lhdnCredentials: null,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
