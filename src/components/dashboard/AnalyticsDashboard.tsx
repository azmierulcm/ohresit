"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Filter,
  Plus,
  Scan
} from "lucide-react";
import { useUI } from '@/lib/context/UIContext';

// Mock data for spending trends
const trendData = [
  { name: 'Mon', amount: 120 },
  { name: 'Tue', amount: 300 },
  { name: 'Wed', amount: 150 },
  { name: 'Thu', amount: 450 },
  { name: 'Fri', amount: 200 },
  { name: 'Sat', amount: 600 },
  { name: 'Sun', amount: 350 },
];

// Mock data for category breakdown
const categoryData = [
  { name: 'Food', value: 450, color: '#10b981' }, // Emerald
  { name: 'Transport', value: 300, color: '#0ea5e9' }, // Sky
  { name: 'Utilities', value: 200, color: '#f59e0b' }, // Amber
  { name: 'Shopping', value: 500, color: '#f43f5e' }, // Rose
];

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('Week');
  const { openEntryModal } = useUI();

  return (
    <div className="max-w-4xl mx-auto p-5 pb-24 space-y-8">
      {/* Header with Timeframe Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Insights</h1>
          <p className="text-zinc-500 text-sm mt-1">Analyzing your financial habits</p>
        </div>
        
        <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit">
          {['Week', 'Month'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                timeframe === t 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 md:hidden mb-4">
        <Button onClick={openEntryModal} variant="outline" className="flex-1 rounded-full border-zinc-200 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Income
        </Button>
        <Button onClick={openEntryModal} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md">
          <Scan className="mr-2 h-4 w-4" /> Scan Receipt
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 rounded-[2.5rem] border-none bg-zinc-900 text-white shadow-xl shadow-zinc-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Spend</p>
              <h2 className="text-4xl font-bold mt-2">RM 2,170.00</h2>
            </div>
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex items-center text-rose-400 text-sm font-bold">
              <ArrowUpRight className="h-4 w-4 mr-0.5" /> 12%
            </span>
            <span className="text-zinc-500 text-xs">vs previous {timeframe.toLowerCase()}</span>
          </div>
        </Card>

        <Card className="p-6 rounded-[2.5rem] border-zinc-100 shadow-sm bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Daily Average</p>
              <h2 className="text-4xl font-bold mt-2 text-zinc-900">RM 310.00</h2>
            </div>
            <div className="bg-zinc-100 p-2 rounded-xl">
              <Calendar className="h-5 w-5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex items-center text-emerald-500 text-sm font-bold">
              <ArrowDownRight className="h-4 w-4 mr-0.5" /> 4%
            </span>
            <span className="text-zinc-400 text-xs">efficiency improved</span>
          </div>
        </Card>
      </div>

      {/* Main Spending Trend Chart */}
      <Card className="p-6 rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="font-bold text-zinc-900">Spending Trend</h3>
          <Filter className="h-4 w-4 text-zinc-300" />
        </div>
        
        <div className="h-[250px] w-full -ml-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#a1a1aa', fontWeight: 600}}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Secondary Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
          <h3 className="font-bold text-zinc-900 mb-6 text-center lg:text-left">Category Split</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-xl">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6">
             <TrendingUp className="h-10 w-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Top Saving Opportunity</h3>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            You spent <strong>RM 500</strong> on Shopping this week. Switching to generic brands could save you up to <strong>RM 120</strong> next month.
          </p>
          <button onClick={openEntryModal} className="mt-8 w-full py-4 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-2xl font-bold text-zinc-900 text-sm">
             Set Budget Goal
          </button>
        </Card>
      </div>
    </div>
  );
}
