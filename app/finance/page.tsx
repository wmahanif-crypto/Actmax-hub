"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function FinancePage() {
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState('STAFF'); 
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setDisplayName(savedName);
    if (savedRole) setRole(savedRole);
  }, []);

  // Data contoh transaksi kewangan
  const transactions = [
    { id: 'CLM-9901', user: 'Ahmad Safwan', type: 'MILEAGE', amount: 'RM 450.00', status: 'PENDING HOD', date: '04 Jan 2026' },
    { id: 'INV-5520', user: 'Dell Malaysia', type: 'INVOICE', amount: 'RM 12,400.00', status: 'PAID', date: '02 Jan 2026' },
    { id: 'CLM-9905', user: 'Siti Nurhaliza', type: 'MEDICAL', amount: 'RM 120.00', status: 'PROCESSING', date: '05 Jan 2026' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6">
      
      {/* Navbar - Finance Branding (Yellow/Gold) */}
      <nav className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
            ← ACTMAX HUB
          </button>
          <div className="h-6 w-[1px] bg-zinc-800 mx-2"></div>
          <Image src="/Actmax_Logo.png" alt="Logo" width={110} height={30} className="object-contain" />
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/80 px-4 py-2 rounded-2xl border border-zinc-800 shadow-xl shadow-yellow-900/5">
          <div className="text-right">
            <p className="text-[9px] text-yellow-500 font-black uppercase leading-none mb-1">Financial Portal</p>
            <p className="text-xs font-bold text-zinc-200 uppercase">{displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center font-black text-sm text-black shadow-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Finance Executive Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 relative overflow-hidden group">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Total Claims Pending</p>
          <h2 className="text-3xl font-black">RM 4,250.00</h2>
          <div className="absolute -right-2 -bottom-2 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">💰</div>
        </div>
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Accounts Payable</p>
          <h2 className="text-3xl font-black text-red-500">RM 18,900</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 border-l-yellow-600 border-l-4">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Net Cash Flow</p>
          <h2 className="text-3xl font-black text-green-500">+ RM 125K</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Audit Status</p>
          <h2 className="text-xl font-black text-zinc-400">COMPLIANT ✔️</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        
        {/* Left Sidebar: Submission Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
            <h3 className="text-xl font-black mb-6 italic tracking-tight">New Submission</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Claim Category</label>
                <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm font-bold mt-1 outline-none focus:border-yellow-600 transition-all">
                  <option>Mileage & Transport</option>
                  <option>Outstation & Hotel</option>
                  <option>Entertainment / Client</option>
                  <option>Medical & Welfare</option>
                </select>
              </div>
              <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-yellow-900/20">
                Submit For Approval ↗
              </button>
            </div>
          </div>
        </div>

        {/* Right Content: Transaction History */}
        <div className="lg:col-span-8 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-900 p-4 shadow-2xl">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-yellow-500">Finance Ledger</h2>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 uppercase">Export PDF</button>
               <button className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 uppercase">Filters</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-zinc-800">
                  <th className="p-6">Trans. ID</th>
                  <th className="p-6">Employee/Vendor</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6 text-center">Status</th>
                  {role === 'ADMIN' && <th className="p-6 text-right italic">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-all group">
                    <td className="p-6">
                      <div className="text-yellow-600 font-mono text-xs font-bold leading-none">{t.id}</div>
                      <div className="text-[9px] text-zinc-500 mt-1">{t.date}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold">{t.user}</div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.type}</div>
                    </td>
                    <td className="p-6 text-sm font-black tracking-tight">{t.amount}</td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${
                        t.status === 'PAID' ? 'border-green-600/30 text-green-500 bg-green-600/5' : 
                        t.status === 'PROCESSING' ? 'border-blue-600/30 text-blue-400 bg-blue-400/5' : 
                        'border-yellow-600/30 text-yellow-600 bg-yellow-600/5 animate-pulse'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    {role === 'ADMIN' && (
                      <td className="p-6 text-right">
                        <button className="text-[10px] font-black text-zinc-500 hover:text-white border border-zinc-800 px-3 py-1 rounded-lg transition-all group-hover:border-yellow-600">
                          PAY NOW
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}