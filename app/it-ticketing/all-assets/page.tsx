"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

export default function AllAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const [swapWithAsset, setSwapWithAsset] = useState<any>(null); // Asset baru dari Spare
  const [oldAssetStatus, setOldAssetStatus] = useState<'Spare' | 'Faulty'>('Faulty');
  const [newSpareTag, setNewSpareTag] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [displayName, setDisplayName] = useState('Guest');


const [spareSearch, setSpareSearch] = useState("");
const [filteredSpare, setFilteredSpare] = useState<any[]>([]);
const [isSpareFocused, setIsSpareFocused] = useState(false);

    useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');

    if (savedName && savedRole) {
      setDisplayName(savedName)
    } else {
      router.push('/login');
    }
  }, [router]);

  // Tambah state ini di dalam component AllAssetsPage
const [selectedAsset, setSelectedAsset] = useState<any>(null);
const [showIssueModal, setShowIssueModal] = useState(false);
const [showFixModal, setShowFixModal] = useState(false);

const [Employees, setEmployees] = useState<any[]>([]);

// State untuk All Spare Assets (untuk dropdown swap/fix)
const [allSpareAssets, setAllSpareAssets] = useState<any[]>([]);

// State untuk Form Issue
const [empSearch, setEmpSearch] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [itTagging, setItTagging] = useState("");
// issueData sekarang perlu merangkumi it_tagging
const [issueData, setIssueData] = useState({ userName: '', plant: '', location: '', it_tagging: '' });
const [isDeployGeneric, setIsDeployGeneric] = useState(false); // Untuk CCTV/Server dll

// State untuk Form Fix
const [fixPeripheral, setFixPeripheral] = useState<any>(null); // Asset peripheral spare

// State untuk carian peripheral dalam modal Fix
const [periSearch, setPeriSearch] = useState("");

const [showReturnModal, setShowReturnModal] = useState(false);
const [returnReason, setReturnReason] = useState('');

// Filter untuk cari Peripheral yang statusnya Spare sahaja
const filteredPeripherals = assets.filter(a => 
  a.category === "Peripheral" && 
  a.status === "Spare" && 
  a.serial_number?.toLowerCase().includes(periSearch.toLowerCase())
);

const exportToExcel = async () => {
  setLoading(true); // Tunjuk loading jap sebab data banyak
  
  try {
    // 1. Tarik SEMUA data dari table 'assets' tanpa limit range
    const { data: allAssets, error } = await supabase
      .from('assets')
      .select('*')
      .order('it_tagging', { ascending: true });

    if (error) throw error;

    if (allAssets) {
      // 2. Formatkan data untuk Excel
      const dataToExport = allAssets.map(asset => ({
        "IT Tagging": asset.it_tagging || "N/A",
        "Serial Number": asset.serial_number,
        "Category": asset.category,
        "Model": asset.model,
        "Current User": asset.userName || "UNASSIGNED",
        "Plant": asset.plant,
        "Location": asset.location,
        "Status": asset.status,
        "RAM": asset.ram,
        "Storage": asset.storage,
        "Warranty End": asset.warranty_end,
        "Last Audit": asset.last_audit ? new Date(asset.last_audit).toLocaleString() : "NEVER",
        "Created At": new Date(asset.created_at).toLocaleDateString()
      }));

      // 3. Proses Excel
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Master Inventory");

      // 4. Download
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Actmax_Full_Inventory_${date}.xlsx`);
    }
  } catch (error: any) {
    alert("Export failed: " + error.message);
  } finally {
    setLoading(false);
  }
};

function DetailItem({ label, value, isMono = false, isHighlight = false }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{label}</p>
      <p className={`text-[11px] uppercase ${isMono ? 'font-mono' : 'font-bold'} ${isHighlight ? 'text-red-500' : 'text-zinc-200'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

// Fungsi Warranty Status (Sama seperti dashboard kau)
const getWarrantyStatus = (date: string) => {
  if (!date) return { label: "NO DATA", color: "text-zinc-500" };
  const isExpired = new Date(date) < new Date();
  return isExpired 
    ? { label: "EXPIRED", color: "text-red-500" } 
    : { label: "ACTIVE", color: "text-green-500" };
};

const handleAudit = async (assetId: string) => {
  const now = new Date().toISOString();
  setLoading(true);

  try {
    // 1. Update timestamp audit dalam database
    const { error: updateError } = await supabase
      .from('assets')
      .update({ last_audit: now })
      .eq('id', assetId);

    if (updateError) throw updateError;

    // 2. Sediakan Log Data untuk activity_logs
    const logData = {
      item_ID: assetId,
      userName: displayName, 
      action: 'AUDIT_ASSET',
      itemName: `${selectedAsset?.category} - ${selectedAsset?.model}`,
      old_value: selectedAsset?.last_audit || 'NEVER', // Tarikh audit lama
      new_value: now,                                  // Tarikh audit baru
      details: `Physical audit performed. Asset tagged as verified at ${now}. Tag: ${selectedAsset?.it_tagging}`,
      created_at: now
    };

    // 3. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

    // 4. Update state secara lokal supaya UI terus update
    setSelectedAsset((prev: any) => ({ ...prev, last_audit: now }));
    
    // Update dalam list utama (sync state)
    setAssets((prev: any[]) => prev.map(a => a.id === assetId ? { ...a, last_audit: now } : a));

    alert("Audit Timestamp Updated & Logged!");

  } catch (error: any) {
    console.error("Audit Error:", error.message || error);
    alert("Error updating audit: " + (error.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
};
const handleReturnSubmit = async () => {
  if (!selectedAsset) return;

  try {
    setLoading(true);

    // 1. Update status asset dalam database
    const { error } = await supabase
      .from('assets')
      .update({
        userName: null,            // Kosongkan owner
        plant: 'N/A',              // Reset plant ke N/A
        location: 'Store / Spare', // Reset location ke Store
        status: oldAssetStatus,    // 'Spare' atau 'Faulty'
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedAsset.id);

    if (error) throw error;

    // 2. Sediakan Log Data untuk table activity_logs
    const logData = {
      item_ID: selectedAsset.id,
      userName: displayName, // Nama IT Staff yang buat action ni
      action: 'RETURN_ASSET', 
      itemName: `${selectedAsset.category} - ${selectedAsset.model}`,
      old_value: selectedAsset.userName, // Rekod siapa user terakhir sebelum dipulangkan
      new_value: oldAssetStatus,         // 'Spare' atau 'Faulty'
      details: `Asset returned by ${selectedAsset.userName}. Reason: ${returnReason}. Tag: ${selectedAsset.it_tagging}`,
      created_at: new Date().toISOString()
    };

    // 3. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

    // 4. UI Feedback & Reset
    alert(`Asset ${selectedAsset.it_tagging} has been successfully returned as ${oldAssetStatus}.`);
    setShowReturnModal(false);
    setReturnReason('');
    
    // Refresh data list
    fetchAssets(currentPage, search);

  } catch (error: any) {
    console.error("Error executing return:", error.message);
    alert("Failed to return asset: " + error.message);
  } finally {
    setLoading(false);
  }
};
const handleSwapSubmit = async () => {
  if (!swapWithAsset) return alert("Please select a replacement asset from Spare.");
  const now = new Date().toISOString();

  const finalTag = newSpareTag || swapWithAsset.it_tagging;

  const { error: err1 } = await supabase.from('assets').update({
    status: oldAssetStatus, 
    userName: null,
    updated_at: now
  }).eq('id', selectedAsset.id);


  const { error: err2 } = await supabase.from('assets').update({
    status: 'In Use',
    userName: selectedAsset.userName,
    it_tagging: finalTag, 
    plant: selectedAsset.plant,
    location: selectedAsset.location,
    updated_at: now
  }).eq('id', swapWithAsset.id);

  if (!err1 && !err2) {
    const logData = {
      item_ID: selectedAsset.id,
      userName: displayName,
      action: 'SWAP_ASSET',
      itemName: `SWAP: ${selectedAsset.serial_number} ↔ ${swapWithAsset.serial_number}`,
      old_value: selectedAsset.status,
      new_value: `Swapped with ${swapWithAsset.id} (tag: ${finalTag})`,
      details: `User ${selectedAsset.userName} swapped ${selectedAsset.it_tagging} with ${finalTag}. Old asset marked as ${oldAssetStatus}.`,
      created_at: now
    };

    const { error: logError } = await supabase.from('activity_logs').insert([logData]);
    if (logError) console.error("Failed to save activity log:", logError.message);

    alert("Swap Completed Successfully!");
    setShowSwapModal(false);
    setSwapWithAsset(null);
    setNewSpareTag(""); 
    setSpareSearch(""); 
    fetchAssets();
  } else {
    alert("Swap Failed. Check Database.");
  }
};

const handleFixSubmit = async () => {
  const now = new Date().toISOString();
  setLoading(true);

  try {
    // 1. Update status asset utama (dari Faulty ke Spare)
    const { error: mainError } = await supabase
      .from('assets')
      .update({ 
        status: 'Spare', 
        userName: null, 
        updated_at: now 
      })
      .eq('id', selectedAsset.id);

    if (mainError) throw mainError;

    // 2. Jika ada part (peripheral) yang diganti, update status part tu
    if (fixPeripheral) {
      await supabase
        .from('assets')
        .update({ 
          status: 'In Use', 
          location: `Installed in ${selectedAsset.it_tagging || selectedAsset.serial_number}`,
          updated_at: now 
        })
        .eq('id', fixPeripheral.id);
    }

    // 3. Sediakan Log Data (Seragam dengan activity_logs)
    const logData = {
      item_ID: selectedAsset.id,
      userName: displayName, 
      action: 'FIX_ASSET',
      itemName: `${selectedAsset.category} - ${selectedAsset.model}`,
      old_value: 'Faulty', // Status asal sebelum dibaiki
      new_value: 'Spare',  // Status baru selepas dibaiki
      details: `Asset repaired. ${
        fixPeripheral 
          ? `Replacement Part: ${fixPeripheral.category} (${fixPeripheral.serial_number}) installed.` 
          : 'General maintenance performed.'
      } S/N: ${selectedAsset.serial_number}`,
      created_at: now
    };

    // 4. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

    // 5. UI Feedback & Reset
    alert("Device Fixed & Returned to Spare!");
    setShowFixModal(false);
    setFixPeripheral(null);
    setPeriSearch("");
    fetchAssets();

} catch (error: any) { // Gunakan : any untuk bypass linting
    console.error("Database Error:", error.message || error);
    alert("Failed: " + (error.message || "Unknown error"));
  } finally {
    setLoading(false); // Sentiasa stop loading tak kira success atau fail
  }
};

const handleIssueSubmit = async () => {
  if (!issueData.plant || !issueData.location) return alert("Plant and Location are required.");

  // 1. Update Asset Status dalam Table Assets
  const { error } = await supabase.from('assets').update({
    status: 'In Use',
    userName: issueData.userName,
    plant: issueData.plant,
    location: issueData.location,
    it_tagging: issueData.it_tagging,
    updated_at: new Date().toISOString()
  }).eq('id', selectedAsset.id);

  if (!error) {
    // 2. Sediakan Log Data (Duduk DALAM blok success)
    const logData = {
      item_ID: selectedAsset.id,
      userName: displayName, // Ambil dari state auth tadi
      action: 'ISSUE_ASSET', 
      itemName: `${selectedAsset.category} - ${selectedAsset.model}`,
      old_value: selectedAsset.status,
      new_value: 'In Use',
      details: `Asset issued to ${issueData.userName}. Tag: ${issueData.it_tagging}, S/N: ${selectedAsset.serial_number}`,
      created_at: new Date().toISOString()
    };

    // 3. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

    // 4. Feedback & Reset UI
    alert(`Assets ${selectedAsset.serial_number} is now IN USE`);
    setShowIssueModal(false);
    setEmpSearch(""); 
    fetchAssets(); // Refresh list display
  } else {
    alert("Error: " + error.message);
  }
};

useEffect(() => {
  const initData = async () => {
    setLoading(true);
    // Guna Promise.all supaya kedua-dua data siap baru loading false
    await Promise.all([
      fetchAssets(),
      fetchEmployees()
    ]);
    setLoading(false);
  };
  initData();
}, []); // Pastikan hanya SATU useEffect untuk mount

// 3. Function untuk tarik data Employees
const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('Employees') // Pastikan nama table ni betul (case-sensitive)
    .select('*');
  if (data) setEmployees(data);
  if (error) console.error("Employees fetch error:", error);
};

// 3b. Function untuk tarik SEMUA spare assets (tidak pagination)
const fetchAllSpareAssets = async () => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'Spare')
    .order('category', { ascending: true });
  if (data) setAllSpareAssets(data);
  if (error) console.error("Spare assets fetch error:", error);
};

const fetchAssets = async (page = 1, searchQuery = "") => {
  setLoading(true);
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' }) // count: exact untuk tahu total records
    .order('updated_at', { ascending: false })
    .range(from, to);

  // Jika ada carian, tambah filter OR
  if (searchQuery) {
    query = query.or(`serial_number.ilike.%${searchQuery}%,userName.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (data) setAssets(data);
  setLoading(false);
};

// Pastikan input search kau trigger fetchAssets bila ditaip (Debounce disyorkan)
useEffect(() => {
  const timer = setTimeout(() => {
    setCurrentPage(1); // Reset ke page 1 bila search
    fetchAssets(1, search);
  }, 500); // Tunggu 500ms lepas user berhenti taip

  return () => clearTimeout(timer);
}, [search]);

  const filtered = assets.filter(a => 
    a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.userName?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase()) ||
    a.model?.toLowerCase().includes(search.toLowerCase())
  );

// Letakkan ini sebelum 'return'
const filteredEmployees = Employees.filter(emp => 
  emp.userName?.toLowerCase().includes(empSearch.toLowerCase()) ||
  emp.userID?.toLowerCase().includes(empSearch.toLowerCase()) ||
  emp.staffID?.toLowerCase().includes(searchTerm)
);
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md pt-2 pb-6"></div>
{/* Header & Search */}
<div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-900 pb-6">
  <div className="flex items-center gap-4 w-full md:w-auto">
    {/* Butang Kembali ke Dashboard */}
    <button 
      onClick={() => router.push('/it-ticketing')} // Ganti path ni kalau folder kau beza
      className="group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Return</span>
    </button>

    <h1 className="text-white font-black uppercase tracking-tighter text-2xl italic">Inventory_Master</h1>

{/* BUTANG EXCEL BARU */}
    <button 
      onClick={exportToExcel}
      className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600 border border-green-600/20 px-4 py-2.5 rounded-xl transition-all group"
    >
      <svg className="w-4 h-4 text-green-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest text-green-500 group-hover:text-white">Export Excel</span>
    </button>
    
  </div>

  <input 
    type="text" 
    placeholder="Search Serial, User, or Model..." 
    className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl w-full md:w-96 text-xs outline-none focus:border-red-600 transition-all shadow-inner"
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setCurrentPage(1);
      fetchAssets(1, e.target.value);
    }}
  />
</div>

        {/* Assets Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-black text-zinc-500 uppercase font-black">
              <tr>
                <th className="p-4">Serial Number</th>
                <th className="p-4">Model / Category</th>
                <th className="p-4">Current User</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filtered.map(assets => (
                <tr 
      key={assets.id} 
      // TAMBAH LINE DI BAWAH NI
      onDoubleClick={() => {
        setSelectedAsset(assets);
        setShowDetailsModal(true);
      }}
      className="hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
      title="Double click to view full details"
    >
                  <td className="p-4 font-mono text-white">{assets.serial_number}</td>
                  <td className="p-4 uppercase">{assets.model} <br/><span className="text-[8px] text-zinc-600">{assets.category}</span></td>
                  <td className="p-4 font-bold text-zinc-300">{assets.userName || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                      assets.status === 'Spare' ? 'bg-green-500/10 text-green-500' : 
                      assets.status === 'Faulty' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {assets.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {/* Logik Button Berdasarkan Status */}
{assets.status === 'Spare' && (
<button 
onClick={() => {
    setSelectedAsset(assets); // asset singular dari map
    setIssueData({
      userName: assets.userName || '',
      plant: assets.plant || '',
      location: assets.location || '',
      it_tagging: assets.it_tagging || '' // Tarik tagging asal dari DB
    });
    setEmpSearch(assets.userName || ""); 
    setIsDeployGeneric(assets.userName === 'SYSTEM_GENERIC'); // Auto-tick kalau memang generic
    setShowIssueModal(true);
  }}
  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px]"
>
  Issue Asset
</button>
  )}

{assets.status === 'In Use' && (
  <button 
    onClick={async () => {
      setSelectedAsset(assets); // Ini asset LAMA (yang user tengah guna)
      await fetchAllSpareAssets(); // Fetch spare assets sebelum buka modal
      setShowSwapModal(true); 
    }}
    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px]"
  >
    Swap Asset
  </button>
)}

{assets.status === 'In Use' && (
  <button 
    onClick={() => {
      setSelectedAsset(assets); // Asset yang nak dipulangkan
      setOldAssetStatus('Spare'); // Defaultkan kepada Spare bila pulangkan
      setShowReturnModal(true);   // Buka modal Return, bukan Swap
    }}
    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px]"
  >
    Return Asset
  </button>
)}

{assets.status === 'Faulty' && (
  <button 
    onClick={() => {
      setSelectedAsset(assets);
      setShowFixModal(true); // Guna setShowFixModal, bukan showFixModal
    }}
    className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px]"
  >
    Fix Device
  </button>
)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center italic text-zinc-600 uppercase">No records found.</div>}
        </div>
      </div>

{showIssueModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
      <div className="flex justify-between items-start text-white italic">
        <h2 className="font-black uppercase border-l-4 border-green-600 pl-3">Issue Asset: {selectedAsset?.serial_number}</h2>
        <span className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase">{selectedAsset?.model}</span>
      </div>
      
{/* 1. Checkbox Generic */}
<div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-zinc-800">
  <input 
    type="checkbox" 
    checked={isDeployGeneric} 
    onChange={(e) => {
      setIsDeployGeneric(e.target.checked);
      if (e.target.checked) {
        setIssueData(prev => ({ 
          ...prev, 
          userName: 'SYSTEM_GENERIC' 
        }));
      } else {
        setIssueData(prev => ({ ...prev, userName: '' }));
        setEmpSearch('');
      }
    }}
    className="accent-green-600 h-4 w-4"
  />
  <label className="text-[10px] font-bold uppercase text-zinc-400">Generic Deploy (CCTV / Printer / AP)</label>
</div>

{!isDeployGeneric && (
  <div className="relative space-y-1">
    <label className="text-[9px] font-black text-zinc-500 uppercase italic">Search Employee</label>
    <input 
      type="text" 
      placeholder="Type Name or Staff ID..." 
      className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white text-xs outline-none focus:border-green-600 transition-all"
      value={empSearch}
      onFocus={() => setIsFocused(true)} // Bila klik, set focus true
      onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay sikit supaya sempat klik dropdown
      onChange={(e) => {
        setEmpSearch(e.target.value);
        // Kalau user padam semua, reset userName dalam issueData
        if (e.target.value === "") setIssueData(prev => ({ ...prev, userName: "" }));
      }} 
    />

    {/* Dropdown keluar jika input ada isi DAN (tengah focus ATAU nama tak sama lagi) */}
    {isFocused && empSearch && (
      <div className="absolute z-30 w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto shadow-2xl custom-scrollbar">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp, index) => (
            <div 
              key={emp.id || `emp-${index}`} 
              onClick={() => {
                setIssueData((prev) => ({ 
                  ...prev, 
                  userName: emp.userName, 
                  plant: emp.plant || '', 
                  location: emp.location || '' 
                }));
                setEmpSearch(emp.userName);
                setIsFocused(false); // Tutup dropdown lepas pilih
              }}
              className="p-3 hover:bg-green-600/10 cursor-pointer border-b border-zinc-900 text-[10px] flex flex-col group transition-colors"
            >
              <span className="text-white font-bold group-hover:text-green-400">{emp.userName}</span>
              <span className="text-zinc-500 text-[8px] uppercase">{emp.userDept} | {emp.userID || emp.staffID}</span>
            </div>
          ))
        ) : (
          <div className="p-3 text-[10px] text-zinc-600 italic text-center uppercase tracking-widest">No match found</div>
        )}
      </div>
    )}
  </div>
)}

      {/* 3. Auto-fill / Editable Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-500 uppercase italic">Plant</label>
          <input type="text" value={issueData.plant} placeholder="Plant" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white text-[11px] outline-none focus:border-green-600" onChange={(e)=>setIssueData({...issueData, plant: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-zinc-500 uppercase italic">Location</label>
          <input type="text" value={issueData.location} placeholder="Location" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white text-[11px] outline-none focus:border-green-600" onChange={(e)=>setIssueData({...issueData, location: e.target.value})} />
        </div>
      </div>

{/* 4. IT Tagging Field */}
<div className="space-y-1">
  <label className="text-[9px] font-black text-red-600 uppercase italic tracking-widest">Update IT Tagging</label>
  <input 
    type="text" 
    value={issueData.it_tagging || ''} // Guna value dari state
    placeholder="Enter IT-TAG-XXXX" 
    className="w-full bg-zinc-950 border border-red-900/30 p-3 rounded-xl text-red-500 font-mono text-[11px] outline-none focus:border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.05)]" 
    onChange={(e) => setIssueData(prev => ({ ...prev, it_tagging: e.target.value }))} 
  />
  <p className="text-[8px] text-zinc-600 italic">*Leave as is to maintain current tagging</p>
</div>

      <div className="flex gap-3 pt-4">
        <button onClick={() => setShowIssueModal(false)} className="flex-1 bg-zinc-800 text-zinc-500 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] transition-all">Cancel</button>
        <button 
          onClick={handleIssueSubmit}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-green-900/20 active:scale-95 transition-all"
        >
          Execute Deployment
        </button>
      </div>
    </div>
  </div>
)}

{showFixModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-[10px]">
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
      <h2 className="text-white font-black uppercase italic border-l-4 border-orange-600 pl-3">Repair: {selectedAsset?.serial_number}</h2>
      
      <div className="space-y-2">
        <p className="text-zinc-500 uppercase font-black tracking-widest">Replace with Peripheral Spare? (Optional)</p>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search S/N RAM/SSD Spare..." 
            className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-orange-600 transition-all font-mono"
            value={periSearch}
            onChange={(e) => {setPeriSearch(e.target.value); setFixPeripheral(null);}}
          />
          
          {/* Dropdown Result Peripheral */}
          {periSearch && !fixPeripheral && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl max-h-32 overflow-y-auto">
              {filteredPeripherals.map((p, index) => (
                <div 
                  key={p.id || `peripheral-${index}`} 
                  onClick={() => {setFixPeripheral(p); setPeriSearch(p.serial_number);}}
                  className="p-3 hover:bg-orange-600/10 cursor-pointer border-b border-zinc-900 flex justify-between items-center"
                >
                  <span className="text-white font-mono">{p.serial_number}</span>
                  <span className="text-zinc-600 uppercase text-[8px] font-bold">{p.model}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Part terpilih */}
      {fixPeripheral && (
        <div className="bg-orange-600/5 border border-orange-600/20 p-3 rounded-xl">
          <p className="text-orange-500 font-bold uppercase italic text-[9px]">Selected Replacement:</p>
          <p className="text-white font-mono">{fixPeripheral.serial_number} ({fixPeripheral.model})</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={() => {setShowFixModal(false); setFixPeripheral(null);}} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 rounded-xl font-black uppercase transition-all">Cancel</button>
        <button 
          onClick={handleFixSubmit}
          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black uppercase transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]"
        >
          Complete Fix
        </button>
      </div>
    </div>
  </div>
)}

{/* Pagination Controls */}
<div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-zinc-900 mt-4">
  <div className="text-[10px] uppercase font-bold text-zinc-600">
    Showing Page <span className="text-white">{currentPage}</span>
  </div>
  
  <div className="flex gap-2">
    <button 
      onClick={() => {
        const prevPage = Math.max(currentPage - 1, 1);
        setCurrentPage(prevPage);
        fetchAssets(prevPage);
      }}
      disabled={currentPage === 1}
      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase transition-all"
    >
      Previous
    </button>
    
    <button 
      onClick={() => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchAssets(nextPage);
      }}
      disabled={assets.length < ITEMS_PER_PAGE}
      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase transition-all"
    >
      Next
    </button>
  </div>
</div>

      {showDetailsModal && selectedAsset && (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      
      {/* Header Section */}
      <div className="p-8 border-b border-zinc-900 flex justify-between items-start sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
        <div>
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Asset Specification</span>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mt-1">
            {selectedAsset.it_tagging || "NO TAGGING"}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
              selectedAsset.status === 'In Use' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
            }`}>
              {selectedAsset.status}
            </span>
            <span className="text-zinc-600 text-[10px] font-mono">ID: {selectedAsset.id.slice(0,8)}...</span>
          </div>
        </div>
        <button onClick={() => setShowDetailsModal(false)} className="bg-zinc-900 p-3 rounded-2xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

            {/* QR CODE SECTION - Tambah dalam p-8 space-y-8 */}
<div className="flex flex-col md:flex-row gap-8 items-center bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2rem]">
  <div className="bg-white p-3 rounded-2xl shadow-lg shadow-white/5">
    <QRCodeSVG 
      value={`${window.location.origin}/it-ticketing/asset-report?id=${selectedAsset.id}`}
      size={120}
      level={"H"}
      includeMargin={false}
      imageSettings={{
        src: "/Actmax_Logo1.png",
        x: undefined,
        y: undefined,
        height: 24,
        width: 24,
        excavate: true,
      }}
    />
  </div>
  
  <div className="flex-1 text-center md:text-left">
    <h4 className="text-white font-black uppercase italic tracking-tight text-lg">Digital Identity Key</h4>
    <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xs">
      Scan this QR code to instantly access the live status, maintenance history, and technical specifications of this asset.
    </p>
    <button 
      onClick={() => window.print()} 
      className="mt-3 text-[9px] font-black text-red-600 uppercase tracking-widest hover:text-red-500 transition-all"
    >
      Print Identity Label
    </button>

<button 
  onClick={() => {
    // Guna encodeURIComponent supaya nama yang ada space tak error kat URL
    const safeUserName = encodeURIComponent(selectedAsset.userName || "");
    window.open(`/it-ticketing/all-assets/user-report?user=${safeUserName}`, '_blank');
  }} 
  className="mt-3 flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-all"
>
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0h6" />
  </svg>
  Generate Official User Report
</button>

  </div>
</div>

{/* 1. TEMPLATE KHAS UNTUK PRINT (Hidden on Screen) */}
<div className="hidden-print-template">
  <div className="print-label-container">
    <div className="print-header font-black tracking-tighter">ACTMAX IT ASSET</div>
    
    <div className="print-qr">
      <QRCodeSVG 
        value={`${window.location.origin}/it-ticketing/asset-report?id=${selectedAsset.id}`}
        size={125} 
        level={"H"}
        includeMargin={false}
        imageSettings={{
          src: "/Actmax_Logo1.png",
          height: 25,
          width: 25,
          excavate: true, 
        }}
      />
    </div>

    <div className="print-footer">
      <div className="tag-id">{selectedAsset.it_tagging || "NO-TAG"}</div>
      <div className="serial-no">S/N: {selectedAsset.serial_number || "N/A"}</div>
    </div>
  </div>
</div>

{/* 2. CSS UNTUK PRINT */}
<style jsx global>{`
  .hidden-print-template { display: none; }

  @media print {
    /* Sembunyikan semua UI Dashboard/Modal */
    body * { visibility: hidden; }
    
    /* Tunjukkan template stiker sahaja */
    .hidden-print-template, .hidden-print-template * { 
      visibility: visible; 
    }
    
    .hidden-print-template {
      display: flex !important;
      position: fixed;
      left: 0;
      top: 0;
      width: 2in;
      height: 2in;
      justify-content: center;
      align-items: center;
      background: white;
    }

    .print-label-container {
      width: 2in;
      height: 2in;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      color: black !important;
    }

    .print-header {
      font-size: 11pt;
      font-weight: 900;
      text-transform: uppercase;
      border-bottom: 2px solid black;
      width: 100%;
      padding-bottom: 3px;
    }

    .print-qr { 
      padding: 8px;
      background: white;
    }

    .tag-id {
      font-size: 12pt;
      font-weight: 900;
      font-style: italic;
      line-height: 1;
      margin-bottom: 2px;
    }

    .print-footer { 
      width: 100%; 
      border-top: 1px solid #eee;
      padding-top: 4px;
    }

    .serial-no {
      font-size: 7pt;
      font-family: monospace;
      color: #333;
      text-transform: uppercase;
    }

    /* Paksa printer guna saiz 2x2 inci */
    @page {
      size: 2in 2in;
      margin: 0;
    }
  }
`}</style>

      <div className="p-8 space-y-8">
        {/* Grid 1: Core Hardware */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <DetailItem label="Category" value={selectedAsset.category} />
          <DetailItem label="Model" value={selectedAsset.model} />
          <DetailItem label="Serial Number" value={selectedAsset.serial_number} isMono />
          <DetailItem label="RAM" value={selectedAsset.ram} />
          <DetailItem label="Storage" value={selectedAsset.storage} />
          <DetailItem label="Plant" value={selectedAsset.plant} />
          <DetailItem label="Location" value={selectedAsset.location} />
          <DetailItem label="Current User" value={selectedAsset.userName || 'UNASSIGNED'} isHighlight />
        </div>

        {/* Section: Warranty & Audit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Warranty Information</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-zinc-400">Ends on: {selectedAsset.warranty_end || 'N/A'}</p>
                <p className={`text-xl font-black italic ${getWarrantyStatus(selectedAsset.warranty_end).color}`}>
                  {getWarrantyStatus(selectedAsset.warranty_end).label}
                </p>
              </div>
              <svg className={`w-8 h-8 ${getWarrantyStatus(selectedAsset.warranty_end).color} opacity-20`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 14.5l-3.5-3.5 1.41-1.41L11 13.67l4.59-4.59L17 10.5 11 16.5z"/></svg>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Integrity</p>
            <div>
              <p className="text-[9px] text-zinc-500 uppercase">Last Verification / Audit:</p>
              <p className="text-white font-mono text-xs mt-1">
                {selectedAsset.last_audit ? new Date(selectedAsset.last_audit).toLocaleString() : 'NEVER AUDITED'}
              </p>
            </div>
            <button 
              onClick={() => handleAudit(selectedAsset.id)}
              className="w-full bg-white text-black text-[10px] font-black uppercase py-2.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
            >
              Verify Asset Now (Audit)
            </button>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-6 border-t border-zinc-900 flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
          <p>Created: {new Date(selectedAsset.created_at).toLocaleDateString()}</p>
          <p>System Ver: 1.0.1 created by WMAH</p>
        </div>
      </div>
    </div>
  </div>
)}

{showSwapModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-[10px]">
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6">
      <h2 className="text-white font-black uppercase italic border-l-4 border-yellow-500 pl-3">Swap Asset: {selectedAsset?.it_tagging}</h2>
      
      <div className="space-y-4">
        {/* Pilih Asset Baru dari Spare */}
        <div>
          <label className="text-zinc-500 uppercase font-black mb-2 block">Select Replacement (From Spare)</label>
{/* Pilih Asset Baru dari Spare (Search Mode) */}
<div className="relative">
  <label className="text-zinc-500 uppercase font-black mb-2 block text-[9px] tracking-widest">
    Search Replacement Asset (S/N or Tag)
  </label>
  
  <input 
    type="text"
    placeholder="Type S/N or IT Tag..."
    value={spareSearch}
    onFocus={() => setIsSpareFocused(true)}
    onBlur={() => setTimeout(() => setIsSpareFocused(false), 200)} // Delay jap untuk click event
onChange={(e) => {
  const term = e.target.value;
  setSpareSearch(term);
  
  const results = allSpareAssets.filter(a => {
    // 1. Pastikan category sama
    const isSameCategory = a.category === selectedAsset?.category;
    
    // 2. Safety check: tukar null jadi string kosong "" sebelum toLowerCase
    const sn = (a.serial_number || "").toLowerCase();
    const tag = (a.it_tagging || "").toLowerCase();
    const search = term.toLowerCase();

    return isSameCategory && (sn.includes(search) || tag.includes(search));
  });

  setFilteredSpare(results);
}}
    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-yellow-500 transition-all font-mono text-xs"
  />

  {/* Dropdown Suggestions */}
  {isSpareFocused && spareSearch && (
    <div className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl max-h-48 overflow-y-auto shadow-2xl custom-scrollbar overflow-hidden">
      {filteredSpare.length > 0 ? (
        filteredSpare.map((spare) => (
          <div 
            key={spare.id}
            onClick={() => {
              setSwapWithAsset(spare);
              setNewSpareTag(spare.it_tagging);
              setSpareSearch(`${spare.it_tagging} - ${spare.serial_number}`);
              setIsSpareFocused(false);
            }}
            className="p-4 hover:bg-yellow-600/10 cursor-pointer border-b border-zinc-900 last:border-0 group transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-bold text-xs group-hover:text-yellow-500">{spare.it_tagging}</p>
                <p className="text-[9px] text-zinc-500 font-mono">{spare.model} | S/N: {spare.serial_number}</p>
              </div>
              <span className="text-[8px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-black uppercase">Spare</span>
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-zinc-600 italic text-center">No matching spare found...</div>
      )}
    </div>
  )}
</div>

{swapWithAsset && (
  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
    {/* Selected Info Card */}
    <div className="p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-2xl flex items-center gap-3">
      <div className="bg-yellow-600 p-2 rounded-xl shadow-lg shadow-yellow-900/40">
        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-[9px] text-yellow-600 font-black uppercase tracking-widest">Target Spare Asset</p>
        <p className="text-white text-xs font-bold font-mono">{swapWithAsset.serial_number}</p>
      </div>
    </div>

    {/* INPUT UNTUK EDIT IT-TAGGING */}
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
        Edit IT-Tagging (Optional)
      </label>
      <input 
        type="text"
        value={newSpareTag}
        onChange={(e) => setNewSpareTag(e.target.value.toUpperCase())}
        placeholder="Enter new IT-Tagging..."
        className="w-full bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl text-yellow-500 font-black tracking-widest outline-none focus:border-yellow-600 shadow-inner text-xs"
      />
      <p className="text-[8px] text-zinc-600 italic px-1">Original: {swapWithAsset.it_tagging}</p>
    </div>
  </div>
)}

        </div>

        {/* Status Asset Lama */}
        <div>
          <label className="text-zinc-500 uppercase font-black mb-2 block">Current Asset ({selectedAsset?.serial_number}) Condition:</label>
          <div className="flex gap-4">
            <button 
              onClick={() => setOldAssetStatus('Faulty')}
              className={`flex-1 py-3 rounded-xl font-black uppercase border ${oldAssetStatus === 'Faulty' ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-800 text-zinc-500'}`}
            >
              Faulty (Breakdwown)
            </button>
            <button 
              onClick={() => setOldAssetStatus('Spare')}
              className={`flex-1 py-3 rounded-xl font-black uppercase border ${oldAssetStatus === 'Spare' ? 'bg-green-600 border-green-600 text-white' : 'border-zinc-800 text-zinc-500'}`}
            >
              Good (Spare)
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button onClick={() => setShowSwapModal(false)} className="flex-1 bg-zinc-800 text-zinc-500 py-4 rounded-2xl font-black uppercase">Cancel</button>
        <button onClick={handleSwapSubmit} className="flex-1 bg-yellow-600 text-white py-4 rounded-2xl font-black uppercase shadow-lg shadow-yellow-900/20">Execute Swap</button>
      </div>
    </div>
  </div>
)}

{showReturnModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-[10px]">
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
      <div className="flex justify-between items-start">
        <h2 className="text-white font-black uppercase italic border-l-4 border-red-500 pl-3">Return Asset: {selectedAsset?.it_tagging}</h2>
        <span className="bg-red-600/10 text-red-500 text-[8px] px-2 py-1 rounded font-black tracking-widest uppercase">Process Return</span>
      </div>
      
      <div className="space-y-6">
        {/* Sebab Pemulangan */}
        <div>
          <label className="text-zinc-500 uppercase font-black mb-2 block text-[9px] tracking-widest">Reason for Return</label>
          <textarea 
            placeholder="Contoh: Staff Resigned / Device Faulty - Blue Screen..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-red-500 transition-all font-mono text-xs h-24 resize-none"
          />
        </div>

        {/* Status Destinasi (Spare atau Faulty) */}
        <div>
          <label className="text-zinc-500 uppercase font-black mb-2 block text-[9px] tracking-widest">New Asset Status</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setOldAssetStatus('Spare')}
              className={`py-4 rounded-2xl font-black uppercase border transition-all ${oldAssetStatus === 'Spare' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-900/20' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
            >
              Ready (Spare)
            </button>
            <button 
              onClick={() => setOldAssetStatus('Faulty')}
              className={`py-4 rounded-2xl font-black uppercase border transition-all ${oldAssetStatus === 'Faulty' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
            >
              Faulty (Damage)
            </button>
          </div>
        </div>

        {/* Link ke Report (Macam kau nak) */}
        <button 
          onClick={() => {
            const safeName = encodeURIComponent(selectedAsset?.userName || "");
            const safeReason = encodeURIComponent(returnReason || "");
            window.open(`/it-ticketing/all-assets/return-report?user=${safeName}&reason=${safeReason}`, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 text-blue-500 font-black uppercase tracking-widest hover:text-blue-400 transition-all text-[9px] border border-blue-500/20 py-3 rounded-xl bg-blue-500/5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 012-2H5a2 2 0 012 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Preview Asset Returned Form (ACA-IT-F-003)
        </button>
      </div>

      <div className="flex gap-3 pt-4">
        <button onClick={() => setShowReturnModal(false)} className="flex-1 bg-zinc-800 text-zinc-500 py-4 rounded-2xl font-black uppercase hover:bg-zinc-700 transition-colors">Cancel</button>
        <button onClick={handleReturnSubmit} className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-zinc-200 transition-all">Complete Return</button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
}