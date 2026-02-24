"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PurchasingPage() {
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState('STAFF'); 
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setDisplayName(savedName);
    if (savedRole) setRole(savedRole);
  }, []);

  // Data contoh permohonan barang
  const purchaseRequests = [
    { id: 'PR-2026-001', item: 'Dell Latitude 5420', qty: 2, total: 'RM 9,600', status: 'WAITING HOD', dept: 'ICT' },
    { id: 'PR-2026-002', item: 'Office Chairs (Ergonomic)', qty: 5, total: 'RM 2,500', status: 'WAITING FINANCE', dept: 'HR' },
    { id: 'PR-2026-003', item: 'Server Rack 42U', qty: 1, total: 'RM 4,200', status: 'COMPLETED', dept: 'ICT' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6">
      
      {/* Navbar Branding */}
      <nav className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
            ← ACTMAX HUB
          </button>
          <div className="h-6 w-[1px] bg-zinc-800 mx-2"></div>
          <Image src="/Actmax_Logo.png" alt="Logo" width={110} height={30} className="object-contain" />
        </div>

        <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800">
          <div className="text-right">
            <p className="text-[9px] text-green-500 font-black uppercase leading-none mb-1">Procurement Portal</p>
            <p className="text-xs font-bold text-zinc-200 uppercase">{displayName}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-black text-xs shadow-lg shadow-green-900/40">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Hero Stats: Budget Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Monthly Budget</p>
          <h2 className="text-2xl font-black">RM 50,000</h2>
          <div className="w-full bg-zinc-800 h-1.5 mt-3 rounded-full overflow-hidden">
             <div className="bg-green-600 h-full w-[65%]"></div>
          </div>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total PR Pending</p>
          <h2 className="text-2xl font-black text-yellow-500">08</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">PO Issued</p>
          <h2 className="text-2xl font-black">12</h2>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Active Vendors</p>
          <h2 className="text-2xl font-black text-blue-500">24</h2>
        </div>
      </div>

      {/* Purchasing Main Section */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Purchasing & Supply</h1>
            <p className="text-zinc-500 text-xs mt-1">Manage corporate requisitions and vendor procurement.</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-green-900/20">
            + Create New PR
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar: Vendor Quick Access */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-900">
              <h3 className="text-xs font-black uppercase text-zinc-500 mb-4 tracking-widest">Master Vendors</h3>
              <div className="space-y-3">
                {['Dell Malaysia', 'Office Depot', 'Maxis Business'].map(v => (
                  <div key={v} className="p-3 bg-black rounded-xl border border-zinc-800 text-[10px] font-bold hover:border-green-600 cursor-pointer transition-all uppercase">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Table: Requisition List */}
          <div className="lg:col-span-3 bg-zinc-900/30 rounded-[2.5rem] border border-zinc-900 p-2 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
                  <th className="p-6">Request Detail</th>
                  <th className="p-6">Department</th>
                  <th className="p-6">Total Amount</th>
                  <th className="p-6 text-center">Status</th>
                  {(role === 'ADMIN' || role === 'HOD') && <th className="p-6 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {purchaseRequests.map(pr => (
                  <tr key={pr.id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="p-6">
                      <div className="text-green-500 font-mono text-[10px] font-bold mb-1">{pr.id}</div>
                      <div className="text-sm font-bold">{pr.item}</div>
                      <div className="text-[10px] text-zinc-500 italic">Qty: {pr.qty} units</div>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-black bg-zinc-800 px-2 py-1 rounded text-zinc-400">{pr.dept}</span>
                    </td>
                    <td className="p-6 text-sm font-black text-zinc-200">{pr.total}</td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter ${
                        pr.status === 'COMPLETED' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                        pr.status === 'WAITING FINANCE' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : 
                        'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    {(role === 'ADMIN' || role === 'HOD') && (
                      <td className="p-6 text-right">
                        <button className="bg-zinc-100 text-black hover:bg-green-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all">
                          PROCESS
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