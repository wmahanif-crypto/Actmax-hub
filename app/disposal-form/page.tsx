"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AssetDisposalForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    assetName: '',
    assetTag: '',
    category: 'HARDWARE',
    reason: 'DAMAGE',
    method: 'SCRAP',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Disposal Data:", formData);
    alert("Disposal Request Submitted for Approval!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Asset Disposal</h1>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Inventory Termination Form</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 border border-zinc-800 rounded-full text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
          >
            Cancel Process
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* SECTION 1: ASSET INFO */}
          <div className="space-y-6 bg-zinc-900/20 p-8 rounded-[2.5rem] border border-zinc-900">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-4 h-[1px] bg-zinc-800"></span> 01. Asset Identification
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Asset Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. DELL LATITUDE 5420"
                  className="w-full bg-black border-2 border-zinc-900 rounded-2xl p-4 text-xs font-bold focus:border-red-600 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, assetName: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Asset Tag / Serial No.</label>
                <input 
                  type="text" 
                  placeholder="ACT-IT-2024-001"
                  className="w-full bg-black border-2 border-zinc-900 rounded-2xl p-4 text-xs font-bold focus:border-red-600 outline-none transition-all font-mono text-red-500"
                  onChange={(e) => setFormData({...formData, assetTag: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Category</label>
                <select 
                  className="w-full bg-black border-2 border-zinc-900 rounded-2xl p-4 text-xs font-bold focus:border-red-600 outline-none appearance-none cursor-pointer"
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="HARDWARE">HARDWARE / PERIPHERALS</option>
                  <option value="FURNITURE">OFFICE FURNITURE</option>
                  <option value="NETWORK">NETWORK EQUIPMENTS</option>
                  <option value="VEHICLE">COMPANY VEHICLE</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: DISPOSAL REASON */}
          <div className="space-y-6 bg-zinc-900/20 p-8 rounded-[2.5rem] border border-zinc-900">
             <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-4 h-[1px] bg-zinc-800"></span> 02. Termination Logic
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Reason for Disposal</label>
                <select 
                  className="w-full bg-black border-2 border-zinc-900 rounded-2xl p-4 text-xs font-bold focus:border-red-600 outline-none"
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                >
                  <option value="DAMAGE">BEYOND ECONOMICAL REPAIR (BER)</option>
                  <option value="OBSOLETE">TECHNOLOGICAL OBSOLESCENCE</option>
                  <option value="LOST">MISSING / STOLEN</option>
                  <option value="EXPIRED">LEASE EXPIRED</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Proposed Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['SCRAP', 'SELL', 'DONATE', 'RECYCLE'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({...formData, method: m})}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.method === m ? 'bg-red-600 border-red-500 text-white' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 ml-1">Technical Condition Details</label>
                <textarea 
                  rows={3}
                  placeholder="Describe why this asset needs to be disposed..."
                  className="w-full bg-black border-2 border-zinc-900 rounded-2xl p-4 text-xs font-bold focus:border-red-600 outline-none transition-all resize-none"
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>

          {/* FULL WIDTH: EVIDENCE UPLOAD */}
          <div className="md:col-span-2 bg-zinc-900/10 border-2 border-dashed border-zinc-800 p-12 rounded-[3rem] text-center group hover:border-red-600/50 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-zinc-400">Upload Evidence / Photos</h4>
              <p className="text-zinc-600 text-[9px] font-bold uppercase mb-6 italic">Minimum 2 photos (Front & Serial Number)</p>
              <input type="file" multiple className="hidden" id="file-upload" />
              <label 
                htmlFor="file-upload"
                className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-white/5"
              >
                Browse Files
              </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="md:col-span-2 pt-8 flex items-center justify-between border-t border-zinc-900 mt-4">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 animate-pulse rounded-full"></div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic">Requires HOD & Finance Approval</p>
             </div>
             <button 
              type="submit"
              className="bg-red-600 text-white px-16 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-red-500 transition-all shadow-2xl shadow-red-900/40 active:scale-95"
             >
               Finalize & Submit Request
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}