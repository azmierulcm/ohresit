"use client";

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Transaction } from '@/types';
import { useAuth } from '@/lib/context/AuthContext';
import { startOfWeek, startOfMonth, subWeeks, subMonths } from 'date-fns';

export function useTransactions(limitCount = 50) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
      setLoading(false);
    });

    return unsub;
  }, [user, limitCount]);

  return { transactions, loading };
}

// Derived analytics helpers
export function computeStats(transactions: Transaction[], timeframe: 'Week' | 'Month') {
  const now = new Date();
  const currentStart = timeframe === 'Week' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const prevStart = timeframe === 'Week' ? subWeeks(currentStart, 1) : subMonths(currentStart, 1);

  const toDate = (val: any): Date => {
    if (val instanceof Timestamp) return val.toDate();
    if (val?.seconds) return new Date(val.seconds * 1000);
    return new Date(val);
  };

  const current = transactions.filter((t) => {
    const d = toDate(t.date);
    return d >= currentStart && t.type === 'expense';
  });

  const previous = transactions.filter((t) => {
    const d = toDate(t.date);
    return d >= prevStart && d < currentStart && t.type === 'expense';
  });

  const totalSpend = current.reduce((s, t) => s + t.amount, 0);
  const prevSpend = previous.reduce((s, t) => s + t.amount, 0);
  const days = timeframe === 'Week' ? 7 : 30;
  const dailyAvg = totalSpend / days;
  const pctChange = prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend) * 100 : 0;

  // Trend data — group by day label
  const trendMap: Record<string, number> = {};
  current.forEach((t) => {
    const label = timeframe === 'Week'
      ? toDate(t.date).toLocaleDateString('en-MY', { weekday: 'short' })
      : toDate(t.date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
    trendMap[label] = (trendMap[label] || 0) + t.amount;
  });
  const trendData = Object.entries(trendMap).map(([name, amount]) => ({ name, amount }));

  // Category breakdown
  const catMap: Record<string, number> = {};
  current.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];
  const categoryData = Object.entries(catMap).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length],
  }));

  // Balance: income - expense (all time)
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return { totalSpend, prevSpend, dailyAvg, pctChange, trendData, categoryData, balance };
}
