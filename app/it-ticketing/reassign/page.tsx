"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// --- 1. COMPONENT UTAMA (LOGIC & UI) ---
function ReassignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('id');

  const [ticket, setTicket] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPerson, setNewPerson] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter list berdasarkan apa yang user taip
  const filteredEmployees = allEmployees.filter(emp => 
    emp.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.userLoginID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (ticketId) {
      const fetchData = async () => {
        const { data: tkt } = await supabase.from('Ticket').select('*').eq('id', ticketId).single();
        const { data: emps } = await supabase.from('Employees').select('userLoginID, userName, userRole');

        if (tkt) setTicket(tkt);
        if (emps) setAllEmployees(emps);
        setLoading(false);
      };
      fetchData();
    }
  }, [ticketId]);

  const handleUpdate = async (type: '1st' | '2nd' | 'support') => {
    const staff = allEmployees.find(e => e.userLoginID === newPerson);
    if (!staff) return alert("Select a person first!");

    let updateData = {};
    if (type === '1st') {
      updateData = { FirstNameApproval: staff.userLoginID, fApprovalFullName: staff.userName };
    } else if (type === '2nd') {
      updateData = { SecondNameApproval: staff.userLoginID, sApprovalFullName: staff.userName };
    } else if (type === 'support') {
      updateData = { assignedTo: staff.userLoginID };
    }

    const { error } = await supabase.from('Ticket').update(updateData).eq('id', ticketId);

    if (!error) {
      alert(`Successfully reassigned to ${staff.userName}!`);
      router.push('/it-ticketing');
    } else {
      alert("Error: " + error.message);
    }
  };

  const isFirstApprLocked = ticket?.FirstApproval === true;
  const isSecondApprLocked = ticket?.SecondApproval === true;

  if (loading) return <div className="p-20 text-white font-black text-center">LOADING DATA...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <div className="max-w-xl mx-auto border border-zinc-900 bg-zinc-950/50 p-8 rounded-[2.5rem] shadow-2xl">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">⚙️ Admin Reassign</h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase mb-8">Ticket ID: <span className="text-red-600">#{ticketId?.slice(0,8)}</span></p>

        <div className="space-y-6">
          {/* Current Assignments Info */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-[11px] space-y-3">
            <p className="text-zinc-500 uppercase font-black border-b border-zinc-800 pb-2">Current Assignments:</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <p className="text-zinc-500 uppercase font-black italic">1st Appr (HOD):</p>
                <p className={isFirstApprLocked ? "text-green-500" : "text-red-500"}>
                  {ticket?.fApprovalFullName || ticket?.FirstNameApproval} {isFirstApprLocked && "(LOCKED)"}
                </p>
              </div>
              {ticket?.category === 'REQUEST' && (
                <div className="flex justify-between items-center">
                  <p className="text-zinc-500 uppercase font-black italic">2nd Appr (CEO):</p>
                  <p className={isSecondApprLocked ? "text-green-500" : "text-red-500"}>
                    {ticket?.sApprovalFullName || ticket?.SecondNameApproval} {isSecondApprLocked && "(LOCKED)"}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                <p className="text-zinc-500 uppercase font-black italic text-orange-500">IT Support:</p>
                <p className="text-white font-bold">{ticket?.assignedTo || 'UNASSIGNED'}</p>
              </div>
            </div>
          </div>

          {/* Searchable Input */}
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Search & Select New Staff</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Type name or login ID..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-black border-2 border-zinc-900 rounded-xl p-4 text-xs font-bold focus:border-red-600 outline-none transition-all"
              />
              {searchTerm && (
                <button onClick={() => {setSearchTerm(''); setNewPerson('');}} className="absolute right-4 top-4 text-zinc-500 hover:text-white">✕</button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl max-h-60 overflow-y-auto shadow-2xl">
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.userLoginID}
                    onClick={() => {
                      setNewPerson(emp.userLoginID);
                      setSearchTerm(emp.userName);
                      setIsDropdownOpen(false);
                    }}
                    className="p-3 hover:bg-red-600/10 hover:text-red-500 cursor-pointer border-b border-zinc-800/50 last:border-none"
                  >
                    <p className="text-xs font-black uppercase">{emp.userName}</p>
                    <p className="text-[9px] text-zinc-500 font-bold">{emp.userLoginID} • {emp.userRole}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            <button onClick={() => handleUpdate('support')} className="bg-orange-600 text-white py-4 rounded-xl text-[10px] font-black uppercase hover:bg-orange-700 transition-all">
              Reassign IT Support Staff
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={isFirstApprLocked} onClick={() => handleUpdate('1st')} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${isFirstApprLocked ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-black hover:bg-white'}`}>
                {isFirstApprLocked ? "1st Approved" : "Change 1st (HOD)"}
              </button>
              {ticket?.category === 'REQUEST' && (
                <button disabled={isSecondApprLocked} onClick={() => handleUpdate('2nd')} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${isSecondApprLocked ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-800 text-white'}`}>
                  {isSecondApprLocked ? "2nd Approved" : "Change 2nd (CEO)"}
                </button>
              )}
            </div>
          </div>

          <button onClick={() => router.back()} className="w-full py-4 text-[9px] font-black uppercase text-zinc-600 hover:text-white">
            ← Cancel and Back
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. WRAPPER DENGAN SUSPENSE (EXPORT DEFAULT) ---
export default function ReassignApprovalPage() {
  return (
    <Suspense fallback={<div className="p-20 text-white font-black text-center">LOADING PWA...</div>}>
      <ReassignContent />
    </Suspense>
  );
}