"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

function AssetReportContent() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('id');
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false); // State untuk loading button

  // 1. Fetch Asset Data
  useEffect(() => {
    if (assetId) {
      const fetchAsset = async () => {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', assetId)
          .single();
        
        if (!error) setAsset(data);
        setLoading(false);
      };
      fetchAsset();
    }
  }, [assetId]);

  // 2. Handle Audit Function (Update Database)
  const handleAudit = async (id: string) => {
    setIsAuditing(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('assets')
      .update({ last_audit: now })
      .eq('id', id);

    if (error) {
      alert("Audit Failed: " + error.message);
    } else {
      // Update local state supaya UI berubah tanpa refresh
      setAsset({ ...asset, last_audit: now });
      alert("Asset Verified Successfully!");
    }
    setIsAuditing(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.5em]">Scanning System...</div>;
  if (!asset) return <div className="min-h-screen bg-black text-white p-10 font-black uppercase">Asset Data Corrupted / Not Found.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Identity Card */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={150} />
          </div>
          
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">Hardware Identity</span>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mt-2 mb-4 text-white">
            {asset.it_tagging}
          </h1>
          
          <div className="flex flex-wrap gap-3">
            <span className="bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {asset.category}
            </span>
            <span className={`border px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              asset.status === 'In Use' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-500'
            }`}>
              {asset.status}
            </span>
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Core Specifications</p>
            <div className="space-y-4">
              <DataRow label="Model" value={asset.model} />
              <DataRow label="Serial" value={asset.serial_number} isMono />
              <DataRow label="Processor" value={asset.processor || 'N/A'} />
              <DataRow label="RAM / Storage" value={`${asset.ram} / ${asset.storage}`} />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Deployment Info</p>
            <div className="space-y-4">
              <DataRow label="Current User" value={asset.userName || 'UNASSIGNED'} />
              <DataRow label="Location" value={`${asset.plant} - ${asset.location}`} />
              <DataRow label="Last Audit" value={asset.last_audit ? new Date(asset.last_audit).toLocaleString() : 'NEVER'} />
            </div>
          </div>
        </div>

        {/* Action Center for Technician */}
        <div className="bg-red-600 p-8 rounded-[2.5rem] shadow-2xl shadow-red-900/20 text-white">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Technician Control</h3>
          <p className="text-red-100 text-xs mt-1 mb-6 opacity-80 uppercase font-bold tracking-widest">Authorized Access Only</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-black py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-zinc-900 transition-all">
              Create Support Ticket
            </button>
            <button 
              onClick={() => handleAudit(asset.id)}
              disabled={isAuditing}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95 ${
                isAuditing ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isAuditing ? 'Updating System...' : 'Verify Asset Now (Audit)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper Component (Same as before)
function DataRow({ label, value, isMono = false }: { label: string, value: string, isMono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-zinc-800 pb-2">
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-bold uppercase ${isMono ? 'font-mono text-zinc-400' : 'text-zinc-200'}`}>{value}</span>
    </div>
  );
}

export default function AssetReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-black uppercase italic animate-pulse">Initializing Actmax Report...</div>}>
      <AssetReportContent />
    </Suspense>
  );
}