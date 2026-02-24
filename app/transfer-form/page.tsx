"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AssetTransferForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    assetTag: '',
    assetName: '',
    fromDept: '',
    toDept: '',
    fromUser: '',
    toUser: '',
    transferDate: '',
    reason: 'RELOCATION',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer Data:", formData);
    alert("Transfer Request Sent for Verification!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-12 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-600 text-[10px] font-black px-2 py-0.5 rounded">MOVEMENT</span>
              <span className="text-zinc-600 text-[10px] font-black tracking-widest uppercase italic font-mono">Form_Type: TRF-02</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Asset Transfer</h1>
            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Inter-departmental & Personnel Relocation</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 border border-zinc-800 rounded-full text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
          >
            Abort Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: ASSET INFO */}
            <div className="lg:col-span-1 space-y-6 bg-zinc-900/10 p-8 rounded-[2.5rem] border border-zinc-900 shadow-inner">
               <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 01. Asset Item
               </h3>
               
               <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Asset Tag</label>
                    <input 
                      type="text" 
                      placeholder="ACT-TAG-XXXX"
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono font-bold text-emerald-500 focus:border-emerald-600 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Asset Description</label>
                    <textarea 
                      readOnly
                      placeholder="Auto-filled from database..."
                      className="w-full bg-zinc-900/50 border border-zinc-900 rounded-xl p-4 text-[11px] font-bold text-zinc-500 outline-none resize-none"
                    ></textarea>
                  </div>
               </div>
            </div>

            {/* COLUMN 2 & 3: TRANSFER LOGIC */}
            <div className="lg:col-span-2 space-y-6 bg-zinc-900/10 p-8 rounded-[2.5rem] border border-zinc-900 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <span className="text-8xl font-black italic">TRANSFER</span>
               </div>

               <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 02. Custody Movement
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* SOURCE */}
                  <div className="space-y-4 p-6 bg-black/40 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase border-b border-zinc-800 pb-2 mb-4 italic">Current Custodian (From)</p>
                    <div>
                      <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Department</label>
                      <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold focus:border-emerald-600 outline-none" placeholder="e.g. IT Department" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Staff Name</label>
                      <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold focus:border-emerald-600 outline-none" placeholder="e.g. Ahmad Suhaimi" />
                    </div>
                  </div>

                  {/* DESTINATION */}
                  <div className="space-y-4 p-6 bg-emerald-950/5 rounded-2xl border border-emerald-900/20">
                    <p className="text-[10px] font-black text-emerald-600 uppercase border-b border-emerald-900/30 pb-2 mb-4 italic">New Custodian (To)</p>
                    <div>
                      <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Department</label>
                      <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold focus:border-emerald-600 outline-none" placeholder="e.g. Sales & Marketing" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Staff Name</label>
                      <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold focus:border-emerald-600 outline-none" placeholder="e.g. Sarah J." />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Effective Date</label>
                    <input type="date" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-black uppercase outline-none focus:border-emerald-600" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Reason for Transfer</label>
                    <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs font-black uppercase outline-none focus:border-emerald-600">
                      <option>NEW PERSONNEL ASSIGNMENT</option>
                      <option>DEPARTMENTAL RELOCATION</option>
                      <option>TEMPORARY LOAN</option>
                      <option>OFFICE SHIFTING</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 gap-6">
             <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center text-xl">🤝</div>
                <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Dual-Verification System</p>
                   <p className="text-[9px] text-zinc-500 font-bold max-w-[250px] leading-relaxed uppercase">Submission will notify both Sending and Receiving HODs for electronic sign-off.</p>
                </div>
             </div>
             
             <button 
              type="submit"
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
             >
               Execute Transfer Protocol
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}