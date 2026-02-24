"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkPermitForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contractorName: '',
    permitType: 'COLD',
    location: '',
    workDescription: '',
    startDate: '',
    endDate: '',
    safetyOfficer: '',
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-yellow-600/30 pb-8">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-yellow-600 flex items-center justify-center rounded-2xl shadow-lg shadow-yellow-900/40">
               <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Work Permit</h1>
              <p className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Hazardous Operations Authorization</p>
            </div>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
          >
            Cancel Permit
          </button>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: CONTRACTOR & SCOPE */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/20 p-8 rounded-[2.5rem] border border-zinc-900">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6">01. Contractor & Work Scope</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Contractor / Vendor Name</label>
                  <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-bold focus:border-yellow-600 outline-none" placeholder="e.g. Total Engineering Sdn Bhd" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Permit Category</label>
                    <select className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-black text-yellow-500 outline-none focus:border-yellow-600">
                      <option>COLD WORK</option>
                      <option>HOT WORK (WELDING)</option>
                      <option>CONFINED SPACE</option>
                      <option>WORKING AT HEIGHT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Location / Area</label>
                    <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-bold outline-none focus:border-yellow-600" placeholder="e.g. Server Room B" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Detailed Job Description</label>
                  <textarea rows={4} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-bold outline-none focus:border-yellow-600 resize-none" placeholder="Explain the maintenance or installation steps..."></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: TIMELINE & SAFETY */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-900/20 p-8 rounded-[2.5rem] border border-zinc-900 h-full">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-6">02. Validation & Safety</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Start Execution (Date & Time)</label>
                    <input type="datetime-local" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-black outline-none focus:border-yellow-600" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">End Execution (Date & Time)</label>
                    <input type="datetime-local" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-black outline-none focus:border-yellow-600" />
                  </div>
                </div>

                <div className="p-6 bg-yellow-600/5 border border-yellow-600/20 rounded-2xl">
                  <p className="text-[9px] font-black text-yellow-600 uppercase mb-4 tracking-tighter italic">Required Safety Equipment (PPE):</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Helmet', 'Safety Vest', 'Gloves', 'Harness'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 accent-yellow-600" />
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2">Supervising Officer (IT/Admin)</label>
                  <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-xs font-bold outline-none focus:border-yellow-600" placeholder="Assign Staff Name" />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: DECLARATION */}
          <div className="lg:col-span-12">
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">🛡️</div>
                <p className="text-[9px] text-zinc-500 font-bold max-w-sm uppercase leading-relaxed">
                  By submitting, you confirm that all safety protocols have been briefed to the contractor and risks are mitigated.
                </p>
              </div>
              <button className="bg-yellow-600 hover:bg-yellow-500 text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-yellow-900/20 active:scale-95">
                Authorize Work Permit
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}