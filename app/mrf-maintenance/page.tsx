"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Type untuk kategori kerosakan fasiliti
interface MaintenanceMap {
  [key: string]: string[];
}

export default function NewMRFPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('Guest');
  const [location, setLocation] = useState(''); // Lokasi kerosakan (e.g., Pantri, Tandas)
  
  const [mainCategory, setMainCategory] = useState('');
  const [subIssue, setSubIssue] = useState('');
  const [description, setDescription] = useState('');
  const [hodApproval, setHodApproval] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Data Kerosakan Fasiliti
  const maintenanceOptions: MaintenanceMap = {
    "Electrical": ["Light Bulb Burnt", "Power Socket Broken", "Power Tripping", "Fan Not Working"],
    "Air-Conditioning": ["Not Cooling", "Water Leaking", "Noisy Unit", "Bad Smell"],
    "Plumbing": ["Pipe Leaking", "Toilet Clogged", "Tap Broken", "No Water Supply"],
    "Civil & Furniture": ["Door Lock Broken", "Ceiling Leak", "Wall Paint", "Broken Chair/Table"],
    "Housekeeping": ["Cleaning Request", "Pest Control", "Waste Disposal"]
  };

  const hodList = [
    { name: "Hanif Musdek", username: "hanif.musdek" },
    { name: "Raymond Kok", username: "raymond.kok" },
  ];

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) setDisplayName(savedName);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    alert("MRF Submitted! Maintenance team will be notified after HOD approval.");
    router.push('/mrf-maintenance');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <nav className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
          <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
            ← ACTMAX HUB
          </button>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic">Facility Management</span>
             <h1 className="text-xl font-black italic underline decoration-orange-600">MRF SYSTEM</h1>
          </div>
        </nav>

        <form onSubmit={handleSubmit} className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-orange-900/20 space-y-6 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase">New Maintenance Request</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Reported By: {displayName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Input (Sangat penting untuk MRF) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 italic">Exact Location (e.g. Level 2 Pantry / Male Toilet)</label>
              <input 
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where is the problem?"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:border-orange-600 outline-none transition-all"
              />
            </div>

            {/* Main Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Work Category</label>
              <select 
                required
                value={mainCategory}
                onChange={(e) => { setMainCategory(e.target.value); setSubIssue(''); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:border-orange-600 outline-none appearance-none"
              >
                <option value="">-- Select --</option>
                {Object.keys(maintenanceOptions).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sub Issue */}
            <div className={`space-y-2 ${!mainCategory && 'opacity-30'}`}>
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Specific Defect</label>
              <select 
                required
                disabled={!mainCategory}
                value={subIssue}
                onChange={(e) => setSubIssue(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm font-bold text-orange-500 focus:border-orange-600 outline-none appearance-none"
              >
                <option value="">-- Select --</option>
                {mainCategory && maintenanceOptions[mainCategory].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Detailed Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the defect in detail..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none min-h-[100px]"
            />
          </div>

          {/* Screenshot/Photo Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 italic underline">Photo of Defect (Recommended)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-orange-600 bg-zinc-950/50"
            >
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-lg shadow-xl shadow-orange-900/10" />
              ) : (
                <div className="text-center py-2">
                  <span className="text-xl mb-1 block">📸</span>
                  <p className="text-[9px] font-black text-zinc-600 uppercase">Click to attach photo</p>
                </div>
              )}
            </div>
          </div>

          {/* HOD Approval */}
          <div className="pt-6 border-t border-zinc-800 space-y-3">
            <label className="text-[10px] font-black uppercase text-orange-600 ml-1 tracking-widest">Acknowledge By HOD</label>
            <select 
              required
              value={hodApproval}
              onChange={(e) => setHodApproval(e.target.value)}
              className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl p-4 text-sm font-bold focus:border-orange-600 outline-none"
            >
              <option value="">-- Choose HOD --</option>
              {hodList.map(hod => (
                <option key={hod.username} value={hod.username}>{hod.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !hodApproval}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
              isLoading || !hodApproval 
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-900/20'
            }`}
          >
            {isLoading ? "Submitting MRF..." : "Submit Maintenance Request →"}
          </button>
        </form>
      </div>
    </div>
  );
}