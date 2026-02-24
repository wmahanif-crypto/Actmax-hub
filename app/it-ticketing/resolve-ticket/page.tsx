"use client";
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// 1. COMPONENT UTAMA (CONTENT)
function ResolveTicketContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('id');

  // Data States
  const [ticket, setTicket] = useState<any>(null);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // UI States
  const [actionType, setActionType] = useState<"ISSUE" | "SWAP" | "UPGRADE" | "FIX" | "NO_ASSET" | "">("");
  const [actionTaken, setActionTaken] = useState("");
  const [loading, setLoading] = useState(true);

  // Search States
  const [userSearch, setUserSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [snSearch, setSnSearch] = useState(""); 
  const [swapSnSearch, setSwapSnSearch] = useState(""); 

  // Selection States
  const [issuedAssets, setIssuedAssets] = useState<any[]>([]); 
  const [primaryAsset, setPrimaryAsset] = useState<any>(null);
  const [swapAsset, setSwapAsset] = useState<any>(null);
  const [tempTagging, setTempTagging] = useState<{[key: string]: string}>({});
  const [upgradePart, setUpgradePart] = useState<any>(null);
  const [upgradeType, setUpgradeType] = useState<"RAM" | "STORAGE" | "">("");
  const [upgradeValue, setUpgradeValue] = useState("");

  useEffect(() => {
    if (ticketId) fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    const [ticketRes, assetRes, empRes] = await Promise.all([
      supabase.from('Ticket').select('*').eq('id', ticketId).single(),
      supabase.from('assets').select('*'),
      supabase.from('Employees').select('*')
    ]);
    setTicket(ticketRes.data);
    setAllAssets(assetRes.data || []);
    setEmployees(empRes.data || []);
    setLoading(false);
  };

  // --- Logic Helpers (Kena dalam component) ---
  const filteredEmployees = employees.filter(emp => emp.userName?.toLowerCase().includes(userSearch.toLowerCase()));
  
  const availableSpare = allAssets.filter(a => 
    a.status === "Spare" && 
    a.serial_number?.toLowerCase().includes(assetSearch.toLowerCase()) &&
    !issuedAssets.some(issued => issued.id === a.id)
  );

  const filteredInUse = allAssets.filter(a => 
    a.status === "In Use" && a.serial_number?.toLowerCase().includes(snSearch.toLowerCase())
  );

  const filteredSpareForSwap = allAssets.filter(a => 
    a.status === "Spare" && a.serial_number?.toLowerCase().includes(swapSnSearch.toLowerCase())
  );

  const availablePeripherals = allAssets.filter(a => 
    a.category === "Peripheral" && 
    a.status === "Spare" && 
    a.serial_number?.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const addAssetToBundle = (asset: any) => {
    setIssuedAssets([...issuedAssets, asset]);
    setTempTagging(prev => ({ ...prev, [asset.id]: asset.it_tagging || "" }));
    setAssetSearch("");
  };

  const handleTagChange = (id: string, value: string) => {
    setTempTagging(prev => ({ ...prev, [id]: value }));
  };

  const removeAssetFromBundle = (id: string) => {
    setIssuedAssets(issuedAssets.filter(a => a.id !== id));
  };

  const getRemainingTime = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    if (diff < 0) return "OVERDUE";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  };

  const handleResolve = async () => {
    if (!actionType || !actionTaken) return alert("Please fill in Action Type and Technical Log.");
    
    try {
      const now = new Date().toISOString();
      const deadline = new Date(ticket.dueDate);
      const finalStatus = new Date() <= deadline ? 'COMPLETED' : 'OVERDUE_DONE';

      if (actionType === "ISSUE") {
        if (issuedAssets.length === 0 || !selectedEmployee) return alert("Please select User and at least one Asset.");
        for (const asset of issuedAssets) {
          await supabase.from('assets').update({
            status: 'In Use',
            userName: selectedEmployee.userName,
            plant: selectedEmployee.plant,
            location: selectedEmployee.location,
            it_tagging: tempTagging[asset.id] || asset.it_tagging,
            updated_at: now
          }).eq('id', asset.id);
        }
      }

      if (actionType === "SWAP") {
        if (!primaryAsset || !swapAsset) return alert("Swap requires Faulty and Spare assets.");
        await supabase.from('assets').update({ status: 'Faulty', userName: 'FAULTY_BY_SYSTEM', updated_at: now }).eq('id', primaryAsset.id);
        await supabase.from('assets').update({ 
          status: 'In Use', 
          userName: primaryAsset.userName, 
          plant: primaryAsset.plant,       
          location: primaryAsset.location, 
          it_tagging: tempTagging[swapAsset.id] || swapAsset.it_tagging,
          updated_at: now 
        }).eq('id', swapAsset.id);
      }

      if ((actionType === "UPGRADE" || actionType === "FIX") && primaryAsset) {
        const updatePayload: any = { updated_at: now };
        if (actionType === "UPGRADE") {
          if (upgradeType === "RAM") updatePayload.ram = upgradeValue;
          if (upgradeType === "STORAGE") updatePayload.storage = upgradeValue;
        }
        await supabase.from('assets').update(updatePayload).eq('id', primaryAsset.id);
        if (upgradePart) {
          await supabase.from('assets').update({
            status: 'In Use',
            userName: primaryAsset.userName,
            location: `Installed in ${primaryAsset.serial_number}`,
            updated_at: now
          }).eq('id', upgradePart.id);
        }
      }

      let assetLog = actionType === "ISSUE" ? `Issued: ${issuedAssets.map(a => a.serial_number).join(', ')}` 
                   : actionType === "SWAP" ? `Swapped: ${primaryAsset.serial_number} -> ${swapAsset.serial_number}`
                   : `Asset: ${primaryAsset?.serial_number || 'N/A'}`;

      await supabase.from('Ticket').update({
        status: finalStatus,
        actionTaken: `[${actionType}] ${assetLog}. Log: ${actionTaken}`,
        completedAt: now,
      }).eq('id', ticketId);

      alert(`Task Resolved: ${finalStatus}`);
      router.push('/it-ticketing');
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-black text-red-600 italic">SYSTEM_INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 p-8 text-xs">
       {/* ... RENDER UI KAU YANG PANJANG TU KAT SINI ... */}
       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* KOD UI KAU SAMA MACAM SEBELUM NI */}
            {/* LEFT: TICKET INFO */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl sticky top-8">
                <h3 className="text-white font-black uppercase mb-4 tracking-widest border-l-2 border-red-600 pl-3 italic">Ticket Intelligence</h3>
                <p className="text-zinc-500 font-bold uppercase text-[9px]">Subject</p>
                <p className="text-white font-bold mb-4">{ticket?.subject}</p>
                <p className="text-zinc-500 font-bold uppercase text-[9px]">User Description</p>
                <p className="text-zinc-400 italic mb-4 p-3 bg-black/40 rounded-lg">"{ticket?.description}"</p>
                <div className="border-t border-zinc-800 pt-4">
                    <p className="text-zinc-500 font-bold uppercase text-[9px]">Requestor</p>
                    <p className="text-white font-black uppercase text-sm">{ticket?.userName}</p>
                    <p className="text-zinc-500 font-bold uppercase text-[9px]">Deadline / SLA</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`font-black text-sm ${new Date(ticket?.dueDate) < new Date() ? 'text-red-600' : 'text-green-500'}`}>
                        {new Date(ticket?.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="bg-white/5 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 border border-zinc-800">
                        {ticket?.dueDate ? getRemainingTime(ticket.dueDate) : 'No Deadline'}
                      </span>
                    </div>
                </div>
              </div>
            </div>

{/* RIGHT: RESOLUTION WORKFLOW */}
<div className="lg:col-span-8 space-y-6">
  <div className="grid grid-cols-5 gap-2">
    {["ISSUE", "SWAP", "UPGRADE", "FIX", "NO_ASSET"].map((type) => (
      <button key={type} onClick={() => setActionType(type as any)} className={`py-4 rounded-xl text-[10px] font-black border-2 transition-all ${actionType === type ? "border-red-600 bg-red-600/10 text-white shadow-[0_0_15px_rgba(220,38,38,0.2)]" : "border-zinc-900 bg-zinc-900 text-zinc-600 hover:border-zinc-700"}`}>
        {type}
      </button>
    ))}
  </div>

  <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-8 shadow-2xl">
    
    {/* --- 1. CASE: ISSUE (NEW ASSET TO USER) --- */}
    {actionType === "ISSUE" && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="space-y-3 relative">
          <label className="text-[10px] font-black text-zinc-500 uppercase">1. Assign To User</label>
          <input type="text" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-red-600" placeholder="Search employee name..." value={userSearch} onChange={(e) => {setUserSearch(e.target.value); setSelectedEmployee(null);}} />
          {userSearch && !selectedEmployee && (
            <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
              {filteredEmployees.map(emp => (
                <div key={emp.userLoginID} onClick={() => {setSelectedEmployee(emp); setUserSearch(emp.userName);}} className="p-3 hover:bg-red-600/20 cursor-pointer border-b border-zinc-800 text-[11px] text-zinc-300">{emp.userName} ({emp.userDept})</div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 relative">
          <label className="text-[10px] font-black text-zinc-500 uppercase">2. Select Assets (Spare Only)</label>
          <input type="text" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-red-600" placeholder="Search Serial Number..." value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} />
          {assetSearch && (
            <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto">
              {availableSpare.map(asset => (
                <div key={asset.id} onClick={() => addAssetToBundle(asset)} className="p-3 hover:bg-green-600/20 cursor-pointer border-b border-zinc-800 text-[11px] flex justify-between uppercase">
                  <span>{asset.serial_number}</span>
                  <span className="text-zinc-500 font-bold">{asset.model}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List of assets to be issued */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issuedAssets.map(asset => (
            <div key={asset.id} className="bg-black p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-black text-[10px]">{asset.serial_number}</p>
                  <p className="text-zinc-600 text-[9px] uppercase">{asset.model}</p>
                </div>
                <button onClick={() => removeAssetFromBundle(asset.id)} className="text-red-600 font-bold hover:scale-110 transition-transform">REMOVE</button>
              </div>
              <input 
                type="text" 
                placeholder="Assign IT TAGGING (e.g: IT-2024-001)" 
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[10px] outline-none focus:border-red-600"
                value={tempTagging[asset.id] || ""}
                onChange={(e) => handleTagChange(asset.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* --- 2. CASE: SWAP (FAULTY TO SPARE) --- */}
    {actionType === "SWAP" && (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 relative">
            <label className="text-[10px] font-black text-zinc-500 uppercase italic">Step 1: Locate Faulty Asset (In Use)</label>
            <input type="text" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[11px] outline-none focus:border-red-600" placeholder="Search Serial Number..." value={snSearch} onChange={(e) => {setSnSearch(e.target.value); setPrimaryAsset(null);}} />
            {snSearch && !primaryAsset && (
              <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto">
                {filteredInUse.map(asset => (
                  <div key={asset.id} onClick={() => {setPrimaryAsset(asset); setSnSearch(asset.serial_number);}} className="p-3 hover:bg-red-600/20 cursor-pointer border-b border-zinc-800 text-[10px] uppercase">{asset.serial_number} ({asset.userName})</div>
                ))}
              </div>
            )}
            {primaryAsset && (
               <div className="bg-red-600/5 p-4 rounded-xl border border-red-600/20">
                  <p className="text-red-500 font-black">TARGET: {primaryAsset.serial_number}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">CURRENT USER: {primaryAsset.userName}</p>
               </div>
            )}
          </div>

          <div className="space-y-3 relative">
            <label className="text-[10px] font-black text-zinc-500 uppercase italic">Step 2: Assign New Spare</label>
            <input type="text" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white text-[11px] outline-none focus:border-red-600" placeholder="Search Spare S/N..." value={swapSnSearch} onChange={(e) => {setSwapSnSearch(e.target.value); setSwapAsset(null);}} />
            {swapSnSearch && !swapAsset && (
              <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto">
                {filteredSpareForSwap.map(asset => (
                  <div key={asset.id} onClick={() => {setSwapAsset(asset); setSwapSnSearch(asset.serial_number);}} className="p-3 hover:bg-green-600/20 cursor-pointer border-b border-zinc-800 text-[10px] uppercase">{asset.serial_number} (READY)</div>
                ))}
              </div>
            )}
            {swapAsset && (
               <div className="bg-green-600/5 p-4 rounded-xl border border-green-600/20">
                  <p className="text-green-500 font-black">REPLACEMENT: {swapAsset.serial_number}</p>
                  <input 
                    type="text" placeholder="Update IT Tagging..." 
                    className="w-full mt-2 bg-black border border-zinc-800 p-2 rounded-lg text-[9px]"
                    onChange={(e) => handleTagChange(swapAsset.id, e.target.value)}
                  />
               </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* --- 3. CASE: UPGRADE / FIX --- */}
{(actionType === "UPGRADE" || actionType === "FIX") && (
  <div className="space-y-6 animate-in fade-in duration-300">
    
    {/* SEARCH MAIN ASSET (Barang yang nak dibaiki/upgrade) */}
    <div className="space-y-3 relative">
      <label className="text-[10px] font-black text-zinc-500 uppercase">
        Search Main Asset to {actionType}
      </label>
      <input 
        type="text" 
        className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-red-600" 
        placeholder="Type S/N or IT Tag of the laptop/PC..." 
        value={snSearch} 
        onChange={(e) => {setSnSearch(e.target.value); setPrimaryAsset(null);}} 
      />
      {snSearch && !primaryAsset && (
        <div className="absolute z-30 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
          {allAssets.filter(a => 
            (a.serial_number?.toLowerCase().includes(snSearch.toLowerCase()) || 
             a.it_tagging?.toLowerCase().includes(snSearch.toLowerCase()))
          ).map(asset => (
            <div key={asset.id} onClick={() => {setPrimaryAsset(asset); setSnSearch(asset.serial_number);}} className="p-3 hover:bg-blue-600/20 cursor-pointer border-b border-zinc-800 text-[10px] flex justify-between">
              <span>{asset.serial_number} <span className="text-zinc-600">[{asset.it_tagging || 'NO TAG'}]</span></span>
              <span className={`font-bold ${asset.status === 'In Use' ? 'text-green-500' : 'text-yellow-500'}`}>{asset.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* OPTIONAL: REPLACEMENT PART (Hanya muncul jika FIX atau UPGRADE) */}
    {primaryAsset && (
      <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Replacement Part / Component <span className="text-zinc-600 italic">(Optional)</span>
          </label>
          {upgradePart && (
            <button onClick={() => setUpgradePart(null)} className="text-[9px] text-red-500 font-bold hover:underline">REMOVE PART</button>
          )}
        </div>

        {!upgradePart ? (
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-[11px] outline-none focus:border-blue-500" 
              placeholder="Search Spare Part S/N (e.g. Battery, RAM, Keyboard)..." 
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
            />
            {assetSearch && (
              <div className="absolute z-30 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-32 overflow-y-auto shadow-xl">
                {availableSpare.map(part => (
                  <div key={part.id} onClick={() => {setUpgradePart(part); setAssetSearch("");}} className="p-3 hover:bg-blue-600/20 cursor-pointer border-b border-zinc-700 text-[10px] uppercase">
                    {part.serial_number} - {part.model} ({part.category})
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-blue-600/10 border border-blue-600/30 p-3 rounded-xl">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-lg text-white">⚙️</div>
            <div>
              <p className="text-[11px] font-black text-white">{upgradePart.serial_number}</p>
              <p className="text-[9px] text-blue-400 uppercase">Part Category: {upgradePart.category}</p>
            </div>
          </div>
        )}
      </div>
    )}

    {/* UPGRADE SPECIFIC INPUTS */}
{actionType === "UPGRADE" && primaryAsset && (
      <div className="space-y-4 animate-in slide-in-from-top-2">
        {/* INFO SPEC SEMASA */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Current RAM</p>
                <p className="text-white font-black text-sm">{primaryAsset.ram || "N/A"}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Current Storage</p>
                <p className="text-white font-black text-sm">{primaryAsset.storage || "N/A"}</p>
            </div>
        </div>
        <div>
          <label className="text-[9px] font-bold text-zinc-600 mb-2 block uppercase">Upgrade Type</label>
          <select className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-red-600" value={upgradeType} onChange={(e) => setUpgradeType(e.target.value as any)}>
            <option value="">Select Option</option>
            <option value="RAM">RAM</option>
            <option value="STORAGE">STORAGE</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-zinc-600 mb-2 block uppercase">New Spec Value</label>
          <input type="text" placeholder="e.g: 16GB / 1TB SSD" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-red-600" value={upgradeValue} onChange={(e) => setUpgradeValue(e.target.value)} />
        </div>

      </div>
    )}
  </div>
)}

    {/* --- TECHNICAL LOG (Sentiasa ada di bawah) --- */}
    <div className="space-y-3">
      <label className="text-[10px] font-black text-red-600 uppercase tracking-widest italic flex items-center gap-2">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
        Technical Troubleshooting Log
      </label>
      <textarea 
        className="w-full bg-black border border-zinc-800 p-6 rounded-3xl text-white outline-none focus:border-red-600 transition-all min-h-[150px] font-mono text-[11px]" 
        placeholder="Detailed explanation of the solution..." 
        value={actionTaken} 
        onChange={(e) => setActionTaken(e.target.value)}
      />
    </div>

    {/* ACTIONS */}
    <div className="flex gap-4 pt-4 border-t border-zinc-800">
      <button type="button" onClick={() => router.back()} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-black py-6 rounded-2xl uppercase tracking-[0.2em] transition-all border border-zinc-800">Cancel</button>
      <button onClick={handleResolve} className="flex-[2] bg-white hover:bg-red-600 text-black hover:text-white font-black py-6 rounded-2xl uppercase tracking-[0.4em] transition-all shadow-xl">Execute Resolution & Sync</button>
    </div>
  </div>
</div>
       </div>
    </div>
  );
}

// 2. WRAPPER (EXPORT DEFAULT)
export default function ResolveTicketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic">LOADING_RESOURCES...</div>}>
      <ResolveTicketContent />
    </Suspense>
  );
}