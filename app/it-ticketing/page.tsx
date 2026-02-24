"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Simple toast notification
const toast = {
  error: (msg: string) => console.error(msg),
  success: (msg: string) => console.log(msg)
};

export default function ITTicketingPage() {
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState('ADMIN'); // STAFF, HOD, SUPPORT, ADMIN
  const router = useRouter();
// --- AI CHAT STATES ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am Actmax AI Support. How can I assist you with IT issues today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [techList, setTechList] = useState<any[]>([]);
  const [searchTicket, setSearchTicket] = useState(""); // Khusus untuk Ticket
  const [searchAsset, setSearchAsset] = useState(""); // Khusus untuk Asset

  const [masterAssets, setMasterAssets] = useState<any[]>([]);
  const [assetFetchError, setAssetFetchError] = useState<string | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

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

const [origin, setOrigin] = useState('');
useEffect(() => {
  if (typeof window !== 'undefined') setOrigin(window.location.origin);
}, []);


const [selectedSummaryCat, setSelectedSummaryCat] = useState<string | null>(null);

// Pecahkan string "ADMIN, SUPPORT" menjadi ["ADMIN", "SUPPORT"]
const currentRoles = (role || "").split(',').map(r => r.trim());
const isAdmin = currentRoles.includes('ADMIN');
const isSupport = currentRoles.includes('SUPPORT');
const isHOD = currentRoles.includes('HOD');

  // --- AI SEND MESSAGE FUNCTION ---
const sendMessage = async () => {
  if (!userInput.trim()) return;

  const currentMsg = userInput; // 1. Simpan mesej dalam variable sementara
  const newMsg = { role: 'user', text: currentMsg };
  
  setMessages(prev => [...prev, newMsg]);
  setUserInput(''); // 2. Baru kosongkan input box
  setIsTyping(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: currentMsg }), // 3. Hantar variable sementara tadi
    });

    const data = await res.json();
    
    // 4. Masukkan reply dari AI ke dalam state messages
    if (data.text) {
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    }
  } catch (err) {
    setMessages(prev => [...prev, { role: 'ai', text: 'I am offline right now. Try again later.' }]);
  } finally {
    setIsTyping(false);
  }
};

const handleAudit = async (assetId: string) => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('assets')
    .update({ last_audit: now })
    .eq('id', assetId);

  if (!error) {
    alert("Audit Timestamp Updated!");
    setSelectedAsset((prev: any) => ({ ...prev, last_audit: now }));
  }
};

const getWarrantyStatus = (date: string) => {
  if (!date) return { label: "NO DATA", color: "text-zinc-500" };
  const isExpired = new Date(date) < new Date();
  return isExpired 
    ? { label: "EXPIRED", color: "text-red-500" } 
    : { label: "ACTIVE", color: "text-green-500" };
};

const handleUpdateStatus = async (ticket: any, action: string) => {
  let nextStatus = '';
  const now = new Date().toISOString(); // Kita declare siap-siap masa sekarang
  
  const savedRole = localStorage.getItem('userRole') || "";
  const roles = savedRole.split(',').map(r => r.trim());

  if (action === 'REJECTED') {
    const reason = prompt("Reason for reject the ticket:");
    if (!reason) return;
    await supabase.from('Ticket').update({ status: 'REJECTED', rejectReason: reason }).eq('id', ticket.id);
    window.location.reload();
    return;
  }

  // Objek untuk simpan data yang bakal di-update
  let updatePayload: any = {};

  if (action === 'APPROVED') {
    // --- STEP 1: JIKA HOD APPROVE ---
    if (roles.includes('HOD') && ticket.status === 'PENDING_HOD') {
      updatePayload.FirstApproval = true;
      updatePayload.FirstApprovalAt = now; // <--- REKOD MASA HOD APPROVE
      
      if (ticket.category === 'REQUEST') {
        nextStatus = 'PENDING_CEO';
      } else {
        nextStatus = 'PENDING_ADMIN';
      }
    } 
    // --- STEP 2: JIKA CEO APPROVE ---
    else if (roles.includes('CEO') && ticket.status === 'PENDING_CEO') {
      updatePayload.SecondApproval = true;
      updatePayload.SecondApprovalAt = now; // <--- REKOD MASA CEO APPROVE
      nextStatus = 'PENDING_ADMIN';
    }
    else {
      console.error("No matching role/status for approval");
      return;
    }
  }

  
  // Masukkan status baru ke dalam payload
  updatePayload.status = nextStatus;

  // --- STEP 3: UPDATE DATABASE ---
  const { error } = await supabase
    .from('Ticket')
    .update(updatePayload) // Guna payload yang kita dah bina kat atas
    .eq('id', ticket.id);

  if (!error) {
    alert(`Ticket moved to: ${nextStatus}`);
    window.location.reload();
  } else {
    alert("Error: " + error.message);
  }
};
// --- AUTH LOGIC ---
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (!savedName || !savedRole) {
      router.push('/login');
      return;
    }
    setDisplayName(savedName);
    setRole(savedRole);
  }, [router]);

useEffect(() => {
  const fetchTechs = async () => {
    const { data, error } = await supabase
      .from('Employees') // Nama table kau
      .select('userLoginID, userName')
      .eq('userRole', 'SUPPORT'); // Filter hanya Role SUPPORT

    if (data) setTechList(data);
    if (error) console.error("Error fetching techs:", error);
  };

  fetchTechs();
}, []);

  // Data Ticket dengan info tambahan untuk Asset & Date
const [allTickets, setAllTickets] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [supportUsers, setSupportUsers] = useState<any[]>([]);

// Tambah dalam useEffect fetch data
useEffect(() => {
  const fetchSupportStaff = async () => {
    const { data } = await supabase
      .from('User') // Pastikan nama table user kau betul
      .select('userLoginID, userName')
      .eq('role', 'SUPPORT');
    if (data) setSupportUsers(data);
  };
  fetchSupportStaff();
}, []);

// Fungsi untuk Assign ke Support Staff
const handleAssignTicket = async (ticket: any, techId: string) => {
  if (!techId) return alert("Please select a Tech Staff!");

  // Tentukan hari ikut category dari object ticket
  let daysToAdd = 3;
  const category = ticket.category?.toUpperCase();

  if (category === 'INCIDENT') daysToAdd = 3;
  else if (category === 'SERVICE') daysToAdd = 7;
  else if (category === 'REQUEST') daysToAdd = 30;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToAdd);


  const { error } = await supabase
    .from('Ticket')
    .update({ status: 'IN PROGRESS', assignedTo: techId, assignedAt: new Date().toISOString(), dueDate: dueDate.toISOString() })
    .eq('id', ticket.id);

  if (error) return toast.error(error.message);
  
  // Optimistic update:
  setAllTickets(prev => prev.map(x => 
    x.id === ticket.id ? { ...x, status: 'IN PROGRESS', assignedTo: techId, assignedAt: new Date().toISOString(), dueDate: dueDate.toISOString() } : x
  ));
  toast.success(`Protocol Initiated. SLA: ${daysToAdd} days.`);
};


function StatCard({ label, value, sub, color = "text-white" }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">{sub}</span>
      </div>
    </div>
  );
}

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    const savedLoginID = localStorage.getItem('userLoginID');
    const savedRole = localStorage.getItem('userRole');

    // --- FETCH TICKETS ---
    let ticketQuery = supabase.from('Ticket').select('*');
    if (savedRole === 'HOD') {
      ticketQuery = ticketQuery.or(`userLoginID.eq.${savedLoginID},FirstNameApproval.eq.${savedLoginID}`);
    } else if (savedRole === 'STAFF') {
      ticketQuery = ticketQuery.eq('userLoginID', savedLoginID);
    }
    const { data: tickets, error: tError } = await ticketQuery.order('createdAt', { ascending: false });
    if (tickets) setAllTickets(tickets);

    // --- FETCH ASSETS (TAMBAH LINE NI!) ---
    const { data: assets, error: aError } = await supabase.from('assets').select('*');
    if (aError) {
      console.error("Asset Fetch Error:", aError.message);
      setAssetFetchError(aError.message);
    }
    if (assets) {
      console.log("Assets loaded:", assets); // Debug line
      setMasterAssets(assets);
    }

    setIsLoading(false);
  };

  fetchData();
}, []);


const activeAlerts = (() => {
  // A. Tapis Network & CCTV yang Offline/Broken
  const hardwareIssues = masterAssets
    .filter(a => 
      (a.category?.toLowerCase() === 'network' || a.category?.toLowerCase() === 'cctv') && 
      !['Healthy', 'Online', 'In Use', 'Spare'].includes(a.status)
    )
    .map(a => ({
      id: `hw-${a.it_tagging}`,
      title: a.it_tagging,
      desc: `${a.category} failure at ${a.location}`,
      type: a.category?.toUpperCase(),
      color: 'red',
      icon: a.category?.toLowerCase() === 'cctv' ? '📹' : '📡',
      tag: a.it_tagging
    }));

  // B. Tapis Software Expiring (< 30 hari)
  const softwareIssues = masterAssets
    .filter(a => {
      if (a.category?.toLowerCase() !== 'software' || !a.warranty_end) return false;
      const daysLeft = Math.ceil((new Date(a.warranty_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    })
    .map(a => ({
      id: `soft-${a.it_tagging}`,
      title: a.model,
      desc: `License expiring soon (${a.warranty_end})`,
      type: 'SOFTWARE',
      color: 'orange',
      icon: '🔑',
      tag: a.it_tagging
    }));

  // GABUNGKAN SEMUA & LIMIT 2 SAHAJA
  // Ini kunci dia: .slice(0, 2) akan buang yang ke-3 ke bawah
  return [...hardwareIssues, ...softwareIssues].slice(0, 2);
})();

// Data untuk Enterprise Inventory - Dinamik mengikut Master Data
const assetCategories = [
{ 
    label: 'Desktop', 
    icon: '🖥️', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'DESKTOP' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'DESKTOP' && a.status === 'Spare').length})`
  },
  { 
    label: 'Laptop', 
    icon: '💻', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'LAPTOP' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'LAPTOP' && a.status === 'Spare').length})` 
  },
  { 
    label: 'CCTV', 
    icon: '📹', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'CCTV' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'CCTV' && a.status === 'Spare').length})`
  },
  { 
    label: 'Printer', 
    icon: '🖨️', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'PRINTER' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'PRINTER' && a.status === 'Spare').length})`
  },
  { 
    label: 'Network', 
    icon: '🌐', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'NETWORK' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'NETWORK' && a.status === 'Spare').length})`
  },

  { 
    label: 'Peripheral', 
    icon: '🖱️', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'PERIPHERAL' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'PERIPHERAL' && a.status === 'Spare').length})` 
  },

  { 
    label: 'Furniture', 
    icon: '🪑', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'FURNITURE' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'FURNITURE' && a.status === 'Spare').length})`
  },
  { 
    label: 'Software', 
    icon: '🔑', 
    displayCount: `${masterAssets.filter(a => a.category?.toUpperCase() === 'SOFTWARE' && a.status === 'In Use').length} (${masterAssets.filter(a => a.category?.toUpperCase() === 'SOFTWARE' && a.status === 'Spare').length})`
  },
];
  
// --- FILTER UNTUK TICKET TABLE ---
const filteredTickets = (allTickets || []).filter(t => {
  const savedLoginID = localStorage.getItem('userLoginID');
  const roles = (role || "").split(',').map(r => r.trim());

  let isAuthorized = false;
  if (roles.includes('ADMIN')) {
    isAuthorized = true;
  } else {
    if (roles.includes('STAFF') && t.userLoginID === savedLoginID) isAuthorized = true;
    if (roles.includes('HOD') && t.FirstNameApproval === savedLoginID) isAuthorized = true;
    if (roles.includes('CEO') && t.SecondNameApproval === savedLoginID) isAuthorized = true;
    if (roles.includes('SUPPORT') && ['APPROVED', 'IN PROGRESS', 'RESOLVED'].includes(t.status)) isAuthorized = true;
  }

  if (!isAuthorized) return false;

  const query = searchTicket.toLowerCase(); // Guna searchTicket
  return (
    String(t.id).toLowerCase().includes(query) || 
    String(t.userName).toLowerCase().includes(query) ||
    String(t.status).toLowerCase().includes(query) ||
    String(t.subject).toLowerCase().includes(query)
  );
});

// --- FILTER UNTUK ASSET TABLE ---
const filteredAssets = (masterAssets || []).filter((assets) => {
  const s = searchAsset.toLowerCase(); // Guna searchAsset
  return (
    assets.it_tagging?.toLowerCase().includes(s) ||
    assets.serial_number?.toLowerCase().includes(s) ||
    assets.userName?.toLowerCase().includes(s) ||
    assets.location?.toLowerCase().includes(s) ||
    assets.plant?.toLowerCase().includes(s) ||
    assets.model?.toLowerCase().includes(s) ||
    assets.ip_address?.toLowerCase().includes(s) || 
    assets.category?.toLowerCase().includes(s) ||
    assets.status?.toLowerCase().includes(s) 
  );
});

{/* TABLE BODY MAPPING - ADJUSTED VERSION */}
{filteredAssets.length > 0 ? (
  filteredAssets.map((assets, i) => (
    <tr key={i} className="hover:bg-zinc-800/20 border-b border-zinc-900/50 group transition-colors">
      
      {/* 1. IDENTITY: Tag & Model */}
      <td className="p-5">
        <div className="text-red-500 font-black text-[11px] tracking-widest uppercase">
          {assets.it_tagging}
        </div>
        <div className="text-zinc-100 font-bold text-[10px] uppercase">
          {assets.model}
        </div>
        <div className="text-[9px] text-zinc-500 font-mono mt-1">
          {assets.ip_address || 'No IP'} — {assets.serial_number || 'No S/N'}
        </div>
      </td>

      {/* 2. CATEGORY: Label & Location */}
      <td className="p-5">
        <span className="bg-zinc-800 text-[9px] px-2 py-0.5 rounded font-black text-zinc-400 uppercase tracking-widest border border-zinc-700">
          {assets.category}
        </span>
        <div className="text-[9px] text-blue-500 font-bold uppercase mt-2 tracking-tighter">
          {assets.plant} / {assets.location}
        </div>
      </td>

{/* 3. HEALTH: Status Indicator */}
<td className="p-5 text-center">
  <div className="flex flex-col items-center gap-1">
    <span className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-500 ${
      ['Healthy', 'In Use', 'Online'].includes(assets.status)
        ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
        : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse'
    }`}></span>
    
    <p className={`text-[8px] font-black uppercase mt-1 tracking-widest ${
      ['Healthy', 'In Use', 'Online'].includes(assets.status)
        ? 'text-green-600/70'
        : 'text-red-600/70'
    }`}>
      {assets.status}
    </p>
  </div>
</td>

      {/* 4. LAST AUDIT: User & Date */}
      <td className="p-5">
        <div className="text-zinc-200 font-bold text-[10px] uppercase">
          {assets.userName || 'SPARE / UNASSIGNED'}
        </div>
        <div className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
          Last Check: {assets.last_audit ? new Date(assets.last_audit).toLocaleDateString('en-GB') : 'N/A'}
        </div>
      </td>

      {/* 5. ACTION: Details Button */}
      <td className="p-5 text-right">
        <button 
          className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-zinc-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all active:scale-95"
          onClick={() => alert(`Viewing details for ${assets.it_tagging}`)}
        >
          Details →
        </button>
      </td>

    </tr>
  ))
) : (
  <tr>
    <td colSpan={5} className="p-20 text-center text-zinc-600 italic uppercase tracking-[0.4em] text-[10px]">
      No assets found matching your search...
    </td>
  </tr>
)}

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6">
      
      {/* Navbar Section */}
      <nav className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-white transition-all text-sm font-bold">
            ← ACTMAX HUB
          </button>
          <div className="h-6 w-[1px] bg-zinc-800 mx-2"></div>
          <Image src="/Actmax_Logo.png" alt="Logo" width={110} height={30} className="object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-1">IT PORTAL • {role}</p>
            <p className="text-sm font-bold text-zinc-200 uppercase">{displayName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold shadow-lg shadow-blue-900/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

{/* Hero Quick Stats - Centered Design */}
<div className="flex flex-wrap justify-center gap-4 mb-10">
  
  {/* Card 1: My Tickets / Active Tickets */}
  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 min-w-[200px] text-center">
    <p className="text-zinc-500 text-[10px] font-black uppercase mb-2 tracking-widest">
      {role === 'STAFF' ? 'My Tickets' : 'Active Tickets'}
    </p>
    <h2 className="text-4xl font-black tracking-tighter">{filteredTickets.length}</h2>
  </div>

  {/* Card 2: Tickets Completed (Ticket Sendiri Sahaja) */}
  <div className="bg-zinc-900 p-6 rounded-3xl border border-green-600/20 min-w-[200px] text-center">
    <p className="text-green-500 text-[10px] font-black uppercase mb-2 tracking-widest">My Completed</p>
    <h2 className="text-4xl font-black text-green-500 tracking-tighter">
      {allTickets.filter(t => 
        t.userLoginID === localStorage.getItem('userLoginID') && // Filter ikut ID login kau
        ['COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status)
      ).length}
    </h2>
  </div>

  {/* Card 3: Tickets Rejected (Ticket Sendiri Sahaja) */}
  <div className="bg-zinc-900 p-6 rounded-3xl border border-red-600/20 min-w-[200px] text-center">
    <p className="text-red-500 text-[10px] font-black uppercase mb-2 tracking-widest">My Rejected</p>
    <h2 className="text-4xl font-black text-red-500 tracking-tighter">
      {allTickets.filter(t => 
        t.userLoginID === localStorage.getItem('userLoginID') && // Filter ikut ID login kau
        t.status === 'REJECTED'
      ).length}
    </h2>
  </div>
  
  {/* Card 4: Khusus untuk HOD Approval */}
{/* Card 4: Khusus untuk HOD Approval */}
{role.split(',').map(r => r.trim()).includes('HOD') && (
  <button 
    onClick={() => {
      // Kita set search ticket kepada status yang kita nak cari
      setSearchTicket("PENDING_HOD");
      
      // Optional: Scroll ke bahagian table ticket secara automatik
      document.getElementById('ticket-table-section')?.scrollIntoView({ behavior: 'smooth' });
    }}
    className="bg-zinc-900 p-6 rounded-3xl border border-yellow-600/20 min-w-[200px] text-center hover:bg-yellow-600/5 hover:border-yellow-600/50 transition-all active:scale-95 group"
  >
    <p className="text-yellow-500 text-[10px] font-black uppercase mb-2 tracking-widest group-hover:text-yellow-400">Need My Approval</p>
    <h2 className="text-4xl font-black text-yellow-600 tracking-tighter group-hover:scale-110 transition-transform">
      {allTickets.filter(t => 
        t.status === 'PENDING_HOD' && 
        t.FirstNameApproval === localStorage.getItem('userLoginID') && 
        t.FirstApproval === false
      ).length}
    </h2>
  </button>
)}

  {/* Card KHAS untuk CEO */}
  {role === 'CEO' && (
    <div className="bg-zinc-900 p-6 rounded-3xl border border-orange-600/20 min-w-[200px] text-center">
      <p className="text-orange-500 text-[10px] font-black uppercase mb-2 tracking-widest">CEO Pending Action</p>
      <h2 className="text-4xl font-black text-orange-600 tracking-tighter">
        {allTickets.filter(t => t.status === 'PENDING_CEO' && t.SecondNameApproval === localStorage.getItem('userLoginID')).length}
      </h2>
    </div>
  )}

  {/* Card 3: Muncul untuk Admin & Support */}
  {(role === 'SUPPORT' || role === 'ADMIN') && (
    <div className="bg-zinc-900 p-6 rounded-3xl border border-blue-600/20 min-w-[200px] text-center">
      <p className="text-blue-500 text-[10px] font-black uppercase mb-2 tracking-widest">Tasks Overdue</p>
      <h2 className="text-4xl font-black text-blue-500 tracking-tighter">02</h2>
    </div>
  )}
</div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">{role} PANEL</h1>
            <p className="text-zinc-500 text-xs mt-1">
              {role === 'SUPPORT' ? 'Manage your technical queue & SLAs.' : 'IT service request and technical desk.'}
            </p>
          </div>
          
          <div className="flex gap-3">

             <button
             onClick={() => router.push('/it-ticketing/new')} 
             className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-900/30">
               + New Ticket
             </button>

          </div>
        </div>

{/* SECTION INVENTORY - ENTERPRISE LEVEL */}
        {(isAdmin || isSupport) && (
          <div className="mt-12 space-y-8 animate-in fade-in duration-700">
            
{/* 1. PROACTIVE ALERT SYSTEM - INTEGRATED MONITORING */}
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
    </span>
    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
      Critical Monitoring ({activeAlerts.length})
    </h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {activeAlerts.length > 0 ? (
      activeAlerts.map((alert) => (
        <div key={alert.id} className={`bg-zinc-900/50 border ${alert.color === 'red' ? 'border-red-900/30' : 'border-orange-900/30'} p-4 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all`}>
          <div className="flex items-center gap-4">
            <div className={`text-xl ${alert.color === 'red' ? 'animate-pulse' : ''}`}>
              {alert.icon}
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase ${alert.color === 'red' ? 'text-red-400' : 'text-orange-400'}`}>
                {alert.title}
              </h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                {alert.desc}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setSearchAsset(alert.tag)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${
              alert.color === 'red' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'
            }`}
          >
            Locate
          </button>
        </div>
      ))
    ) : (
      <div className="col-span-2 p-10 bg-zinc-900/10 border border-zinc-900 rounded-3xl text-center border-dashed">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">
          🛡️ CCTV, Network & Software: All Systems Nominal
        </p>
      </div>
    )}
  </div>
</div>

{/* 2. ASSET QUICK LOOK (CATEGORY) */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
  {assetCategories.map((cat) => {
    // Pecahkan "113 (0)" kepada ["113", "(0)"]
    const parts = cat.displayCount.split(' ');
    const inUse = parts[0];
    const spare = parts[1];
    const isZero = spare === "(0)";

    return (
      <button 
    key={cat.label} 
    onClick={() => setSelectedSummaryCat(cat.label.toUpperCase())} // Klik untuk buka Analytics
    className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl hover:border-zinc-700 transition-all text-left group"
  >
        <span className="text-xl mb-2 block group-hover:scale-110 transition-transform">{cat.icon}</span>
        <p className="text-[9px] font-black text-zinc-500 uppercase">{cat.label}</p>
        
        <div className="flex items-baseline gap-1">
          {/* Nombor In Use - Kekal Putih */}
          <span className="text-lg font-black text-white">{inUse}</span>
          
          {/* Nombor Spare - Warna Hijau (atau Merah kalau 0) */}
          <span className={`text-[11px] font-bold ${isZero ? 'text-red-500/60' : 'text-green-500'}`}>
            {spare}
          </span>
        </div>
      </button>
    );
  })}
</div>
            
{/* 3. MASTER ASSET LIST */}
<div className="bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
<div className="p-6 border-b border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h3 className="text-sm font-black italic uppercase text-red-500">Master Asset Inventory</h3>
    <p className="text-[9px] text-zinc-500 font-bold uppercase">Tracking Serial, IP & License Keys</p>
    {assetFetchError && (
      <div className="text-[10px] text-red-400 font-bold mt-2">Error loading assets: {assetFetchError}</div>
    )}
  </div>
  
  <div className="flex gap-3">
    {/* Search Input */}
    <div className="relative">
      <input 
        type="text"
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Search Tag, S/N, User or IP..."
        value={searchAsset}
        onChange={(e) => setSearchAsset(e.target.value)}
        className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] w-64 focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
      />
      <span className="absolute right-3 top-2.5 opacity-30 text-[10px]">🔍</span>
    </div>

    {/* Add Asset Button */}
<button 
  onClick={() => router.push('/it-ticketing/add-asset')}
  className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
>
  + Add Asset
</button>
  </div>
</div>

  {/* PASTIKAN TABLE DIBALUT DIV OVERFLOW UNTUK KEMAS */}
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead className="bg-zinc-950/50">
        <tr className="text-zinc-600 text-[9px] font-black uppercase tracking-widest border-b border-zinc-900">
          <th className="p-4">Identity</th>
          <th className="p-4">Category</th>
          <th className="p-4 text-center">Health</th>
          <th className="p-4">Last Audit</th>
          <th className="p-4 text-right">Action</th>
        </tr>
      </thead>
<tbody className="divide-y divide-zinc-900/50 text-xs">
  {/* Kita potong (slice) data supaya ambil 5 yang pertama sahaja untuk dipaparkan */}
  {filteredAssets.length > 0 ? (
    filteredAssets.slice(0, 5).map((assets, i) => (
      <tr key={i} className="hover:bg-zinc-800/20 transition-all group">
        <td className="p-4 text-left">
          <div className="font-bold text-zinc-100 group-hover:text-red-500 transition-colors">
            {assets.model}
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            {assets.it_tagging} — <span className="text-blue-500/50">{assets.ip_address}</span>
          </div>
        </td>
        
        <td className="p-4 text-left">
          <span className="bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-400">
            {assets.category}
          </span>
          <div className="text-[8px] text-zinc-600 mt-1 uppercase font-black tracking-tighter">
             {assets.plant} / {assets.location}
          </div>
        </td>

<td className="p-4 text-center">
  <div className="flex flex-col items-center gap-1">
    {/* Dot Status */}
    <span className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${
      ['Healthy', 'In Use', 'Online'].includes(assets.status)
        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse'
    }`}></span>
    
    {/* Text Status */}
    <p className={`text-[7px] font-black uppercase mt-1 tracking-widest ${
      ['Healthy', 'In Use', 'Online'].includes(assets.status)
        ? 'text-green-500/70' 
        : 'text-red-500/70'
    }`}>
      {assets.status}
    </p>
  </div>
</td>

        <td className="p-4 text-zinc-500 text-[10px] font-bold uppercase text-left">
          <div className="text-zinc-300">{assets.userName || 'UNASSIGNED'}</div>
          <div className="text-[8px] opacity-50">{assets.last_audit ? new Date(assets.last_audit).toLocaleDateString('en-GB') : 'N/A'}</div>
        </td>

        <td className="p-4 text-right">
          <button 
  className="..."
  onClick={() => {
    setSelectedAsset(assets); // Guna 'assets' atau 'asset' ikut loop variable kau
    setShowDetailsModal(true);
  }}
>
  Details →
</button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={5} className="p-10 text-center text-zinc-500 italic uppercase tracking-widest text-[10px]">
        No assets found matching your search...
      </td>
    </tr>
  )}
</tbody>
</table>
  </div> {/* Tutup overflow-x-auto */}
  
{/* Container bawah table */}
<div className="p-4 bg-zinc-950/30 text-center border-t border-zinc-900">
<button 
  className="text-[9px] font-black text-zinc-500 hover:text-red-500 uppercase tracking-widest transition-all group"
  onClick={() => router.push('/it-ticketing/all-assets')}
>
  View All <span className="text-zinc-300 group-hover:text-red-500">
    {masterAssets.length.toLocaleString()}
  </span> Assets
</button>

</div>
</div> {/* Tutup Master Asset Inventory Box */}
          </div>
        )}

{/* Tickets Table Header */}
<div className="p-6 border-b border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    {assetFetchError && (
      <div className="text-[10px] text-red-400 font-bold mt-2">Error loading assets: {assetFetchError}</div>
    )}
  </div>
  
  <div className="flex gap-3">
    {/* Search Input */}
    <div className="relative">
<input
  type="text"
  value={userInput}
  onChange={(e) => setUserInput(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
  placeholder="Type your technical issue..."
  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
/>
      <span className="absolute right-3 top-2.5 opacity-30 text-[10px]">🔍</span>
    </div>
  </div>
</div>


{/* Tickets Table Area */}
<div className="bg-zinc-900/50 rounded-[2.5rem] border border-zinc-900 p-2 shadow-2xl overflow-x-auto">
  <table className="w-full text-left min-w-[600px]">
    <thead>
      <tr className="text-zinc-600 border-b border-zinc-800/50">
        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Ticket Details</th>
        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Work Progress</th>
        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-900">
      {filteredTickets.slice(0, 15).map((t) => (
<tr 
  key={t.id} 
  // Gantikan onClick kepada onDoubleClick
  onDoubleClick={() => router.push(`/it-ticketing/report?id=${t.id}`)}
  className="cursor-default hover:bg-zinc-800/40 transition-all border-b border-zinc-900 group select-none"
  title="Double click to view full report"
>

  
      {/* Isi dalam (td) kekal sama macam yang kau dah buat */}
      <td className="p-6">
        <div className="text-red-500 font-mono text-xs font-bold mb-1">#{t.id.slice(0,5)}</div>
        <div className="text-sm font-bold text-zinc-100 group-hover:text-red-600 transition-colors">{t.userName}</div>
        <div className="text-[11px] text-zinc-500 mt-1">{t.subject}: {t.specificProblem}</div>
      </td>
<td className="p-6 text-center">
  <div className="flex items-center gap-2 mb-2">
    
{/* STEP 1: HOD - Merah jika Reject, Hijau jika Approve */}
<div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black 
  ${t.status === 'REJECTED' 
    ? 'bg-red-600 text-white' 
    : t.FirstApproval 
      ? 'bg-green-600 text-white' 
      : 'bg-zinc-800 text-zinc-500'}`}>
  HOD
</div>
    
    <div className="h-[1px] w-3 bg-zinc-800"></div>

    {/* STEP 2: CEO (HANYA UNTUK REQUEST) */}
    {t.category === 'REQUEST' && (
      <>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black 
          ${(t.SecondApproval || ['PENDING_ADMIN', 'IN PROGRESS', 'COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status)) 
            ? 'bg-orange-600 text-white' 
            : 'bg-zinc-800 text-zinc-500'}`}>
          CEO
        </div>
        <div className="h-[1px] w-3 bg-zinc-800"></div>
      </>
    )}
    
    {/* STEP 3: ADMIN (ADM) */}
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black 
      ${(['IN PROGRESS', 'COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status)) 
        ? 'bg-yellow-500 text-black' 
        : 'bg-zinc-800 text-zinc-500'}`}>
      ADM
    </div>

    <div className="h-[1px] w-3 bg-zinc-800"></div>

    {/* STEP 4: IT SUPPORT (IT) */}
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black 
      ${(['COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status)) 
        ? 'bg-blue-600 text-white' 
        : 'bg-zinc-800 text-zinc-500'}`}>
      IT
    </div> 
  </div>

  {/* Label Bawah Bulatan */}
  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
    TYPE: <span className={t.category === 'REQUEST' ? 'text-orange-500' : 'text-cyan-500'}>{t.category}</span>
  </p>

{/* Letakkan ini di bawah Label "TYPE: REQUEST/SERVICE" */}
<div className="mt-2">
  {['COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status) && (
    <div className="flex flex-col gap-1 p-2 bg-green-500/5 border border-green-500/10 rounded-lg animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-green-500 tracking-widest">
        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
        Task Completed
      </div>
      
      {/* Tunjuk nama tech staff yang handle */}
      <p className="text-[10px] text-zinc-300 font-bold leading-none">
        By: <span className="text-white italic">{t.assignedTo || 'Technical Support'}</span>
      </p>
      
      {/* Tunjuk tarikh & masa siap */}
      <p className="text-[8px] text-zinc-500 font-medium">
        {t.completedAt ? new Date(t.completedAt).toLocaleString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'Date unavailable'}
      </p>
    </div>
  )}
</div>
</td>

<td className="p-6 text-right">
  {(() => {
    
    const currentUserID = localStorage.getItem('userLoginID');
    // .trim() untuk pastikan takde error kalau ada space kat DB
    const userRoles = (role || "").split(',').map(r => r.trim()); 
    const uiCollector = [];

    // --- 1. TIKET SENDIRI (STAFF) ---
    if (t.userLoginID === currentUserID) {
      const isDone = ['COMPLETED', 'RESOLVED', 'OVERDUE_DONE'].includes(t.status);
      const isRejected = t.status === 'REJECTED';

      uiCollector.push(
        <div key="my-ticket" className="flex flex-col items-end gap-1 mb-2">
          <span className="text-[9px] text-red-500 font-black uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">
            My Ticket
          </span>
          <span className={`text-[8px] font-bold italic ${
            isRejected ? 'text-red-600 animate-pulse' : isDone ? 'text-green-500' : 'text-zinc-600'
          }`}>
            {isRejected ? '❌ Ticket Rejected' : isDone ? 'Closed / Finished' : t.status === 'PENDING_HOD' ? `Waiting for ${t.FirstNameApproval}` : 'In Progress'}
          </span>
        </div>
      );
    }

    // --- 2. JIKA USER ADALAH ADMIN ---
    if (userRoles.includes('ADMIN')) {
      const isWaitingAssignment = t.status === 'PENDING_ADMIN' && !t.assignedTo;
      uiCollector.push(
        <div key="admin-actions" className="flex items-center gap-2 justify-end mb-2">
          {isWaitingAssignment ? (
            <div className="flex gap-1 items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-xl animate-in zoom-in-95 duration-300">
              <select 
                id={`assign-to-${t.id}`}
                className="bg-transparent text-[10px] font-black text-zinc-400 px-3 py-1 outline-none min-w-[120px] cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select Tech...</option>
                {techList.map((tech) => (
                  <option key={tech.userLoginID} value={tech.userLoginID} className="bg-zinc-900 text-white">
                    {tech.userName}
                  </option>
                ))}
              </select>
<button 
  onClick={(e) => {
    e.stopPropagation();
    const selectEl = document.getElementById(`assign-to-${t.id}`) as HTMLSelectElement;
    
    // Safety check supaya tak hantar string kosong atau undefined
    if(!selectEl.value || selectEl.value === "" || selectEl.value === "undefined") {
      return alert("Please select a Tech Staff!");
    }
    
    // PENTING: Hantar 't' (seluruh object tiket), bukan 't.id' sahaja
    handleAssignTicket(t, selectEl.value); 
  }}
  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
>
  Assign Task
</button>
            </div>
          ) : (
            <div className="flex flex-col items-end px-3">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded 
                ${t.status === 'IN PROGRESS' ? 'text-yellow-500 bg-yellow-500/10' : 
                  t.status === 'COMPLETED' ? 'text-green-500 bg-green-500/10' : 
                  t.status === 'REJECTED' ? 'text-red-500 bg-red-500/10' :
                  'text-zinc-600 bg-zinc-800/50'}`}>
                {t.status.replace('_', ' ')}
              </span>
              {t.assignedTo && (
                <span className="text-[8px] text-zinc-500 font-bold mt-1 uppercase italic">
                  Assigned to: {techList.find(tech => tech.userLoginID === t.assignedTo)?.userName || t.assignedTo}
                </span>
              )}
            </div>
          )}
          <div className="flex gap-1 ml-2">
<Link href={`/it-ticketing/reassign?id=${t.id}`}>
  <button className="p-2 hover:bg-zinc-800 rounded-lg text-xs transition-colors" title="Settings">
    ⚙️
  </button>
</Link>
          </div>
        </div>
      );
    }

    // --- 3. JIKA USER ADALAH HOD ---
    if (userRoles.includes('HOD') && t.FirstNameApproval === currentUserID && t.status === 'PENDING_HOD') {
      uiCollector.push(
        <div key="hod-actions" className="flex gap-3 justify-end items-center mb-2">
          <button 
            onClick={() => handleUpdateStatus(t, 'REJECTED')} 
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
          >
            Reject
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              handleUpdateStatus(t, 'APPROVED'); 
            }}
            className="relative group overflow-hidden px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-green-500/40 transition-all duration-300 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Approve
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </button>
        </div>
      );
    }

    // --- 4. JIKA USER ADALAH CEO ---
    if (userRoles.includes('CEO') && t.SecondNameApproval === currentUserID && t.status === 'PENDING_CEO') {
      uiCollector.push(
        <div key="ceo-actions" className="flex gap-3 justify-end items-center mb-2">
          <button 
            onClick={() => handleUpdateStatus(t, 'REJECTED')} 
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            Decline
          </button>
          <button 
            onClick={() => handleUpdateStatus(t, 'APPROVED')} 
            className="relative group overflow-hidden px-6 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              CEO Approve
              <svg className="w-3 h-3 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-40 group-hover:animate-shine" />
          </button>
        </div>
      );
    }

    // --- 5. JIKA USER ADALAH SUPPORT ---
if (userRoles.includes('SUPPORT') && t.status === 'IN PROGRESS' && t.assignedTo === currentUserID) {
  uiCollector.push(
    <div key="support-actions" className="flex flex-col items-end gap-2 mb-2">
      <span className="text-[8px] font-bold text-blue-400 animate-pulse uppercase tracking-widest">
        Task in Progress
      </span>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Supaya modal dashboard tak terbuka
          // Pergi ke page resolve dengan membawa ID tiket
          router.push(`/it-ticketing/resolve-ticket?id=${t.id}`);
        }}
        className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-300 active:scale-95"
      >
        <span className="relative z-10 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Resolve Task
        </span>
      </button>
    </div>
  );
}

    // --- FINAL RENDER ---
    return uiCollector.length > 0 ? (
      <div className="flex flex-col items-end gap-1">
        {uiCollector}
      </div>
    ) : (
      <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic">In Review</span>
    );
  })()}
</td>
                </tr>
              ))}
            </tbody>
          </table>
{/* FOOTER BAR */}
  <div className="p-6 border-t border-zinc-900 flex justify-between items-center bg-zinc-900/20">
    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
      Latest 15 Activities <span className="mx-2 text-zinc-800">|</span> Total {filteredTickets.length}
    </p>
    <button 
      onClick={() => router.push('/it-ticketing/allticket')}
      className="bg-white text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl"
    >
      All Ticket ➔
    </button>
  </div>
</div>
</div>

{selectedSummaryCat && (
  <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] overflow-y-auto p-6 md:p-12 custom-scrollbar">
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* HEADER & CLOSE */}
      <div className="flex justify-between items-start border-b border-zinc-900 pb-8">
        <div>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">
            {selectedSummaryCat} <span className="text-red-600">ANALYTICS</span>
          </h2>
          <p className="text-zinc-500 font-bold tracking-[0.3em] text-[10px] mt-2">
            DETAILED ASSET MANAGEMENT SUMMARY REPORT
          </p>
        </div>
        <button 
          onClick={() => setSelectedSummaryCat(null)}
          className="bg-zinc-900 hover:bg-red-600 text-white p-4 rounded-2xl transition-all font-black uppercase text-xs"
        >
          Close Report [ESC]
        </button>
      </div>

      {/* DATA CALCULATION LOGIC */}
      {(() => {
        const catAssets = masterAssets.filter(a => a.category?.toUpperCase() === selectedSummaryCat);
        const inUse = catAssets.filter(a => a.status === 'In Use').length;
        const spare = catAssets.filter(a => a.status === 'Spare').length;
        const faulty = catAssets.filter(a => a.status === 'Faulty').length;
        
        // Group by Model
// Group by Model dengan detail Status
const models = catAssets.reduce((acc: any, curr) => {
  if (!acc[curr.model]) {
    acc[curr.model] = { total: 0, inUse: 0, spare: 0, faulty: 0 };
  }
  acc[curr.model].total += 1;
  if (curr.status === 'In Use') acc[curr.model].inUse += 1;
  if (curr.status === 'Spare') acc[curr.model].spare += 1;
  if (curr.status === 'Faulty') acc[curr.model].faulty += 1;
  return acc;
}, {});

        // Group by Plant
        const plants = catAssets.reduce((acc: any, curr) => {
          acc[curr.plant || 'OTHERS'] = (acc[curr.plant || 'OTHERS'] || 0) + 1;
          return acc;
        }, {});

        // Out of Warranty Check
        const outOfWarranty = catAssets.filter(a => a.warranty_end && new Date(a.warranty_end) < new Date()).length;

        return (
          <div className="space-y-8">
            {/* ROW 1: PRIMARY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Inventory" value={catAssets.length} sub="Units" />
              <StatCard label="Active Utilization" value={inUse} sub={`${Math.round((inUse/catAssets.length)*100 || 0)}% Rate`} color="text-blue-500" />
              <StatCard label="Ready Stock (Spare)" value={spare} sub="Available" color="text-green-500" />
              <StatCard label="Maintenance / Faulty" value={faulty} sub="Action Required" color="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MODEL BREAKDOWN */}
<div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-l-2 border-red-600 pl-3">
    Model Status Breakdown
  </h3>
  <div className="space-y-8">
    {Object.entries(models).map(([name, stats]: any) => (
      <div key={name} className="group">
        {/* Nama Model & Total */}
        <div className="flex justify-between text-[11px] mb-2">
          <span className="text-white font-black uppercase tracking-tighter">{name}</span>
          <span className="text-zinc-500 font-mono">{stats.total} <span className="text-[9px]">TOTAL</span></span>
        </div>

        {/* Progress Bar (Total) */}
        <div className="w-full bg-zinc-800/50 h-1 rounded-full mb-3">
          <div className="bg-zinc-500 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>

        {/* Mini Badges untuk Status Asing-Asing */}
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">In Use</span>
            <span className={`text-[12px] font-black ${stats.inUse > 0 ? 'text-blue-500' : 'text-zinc-700'}`}>{stats.inUse}</span>
          </div>
          <div className="flex flex-col border-l border-zinc-800 pl-4">
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Spare</span>
            <span className={`text-[12px] font-black ${stats.spare > 0 ? 'text-green-500' : 'text-zinc-700'}`}>{stats.spare}</span>
          </div>
          <div className="flex flex-col border-l border-zinc-800 pl-4">
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Faulty</span>
            <span className={`text-[12px] font-black ${stats.faulty > 0 ? 'text-red-500' : 'text-zinc-700'}`}>{stats.faulty}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

              {/* PLANT BREAKDOWN */}
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-l-2 border-red-600 pl-3">Deployment By Plant</h3>
                <div className="space-y-3">
                  {Object.entries(plants).map(([plant, count]: any) => (
                    <div key={plant} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-zinc-800/50">
                      <span className="text-[11px] font-black text-zinc-300 uppercase">{plant}</span>
                      <span className="text-xl font-black text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRITICAL ALERTS */}
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-l-2 border-red-600 pl-3">Risk Assessment</h3>
                <div className="bg-red-600/5 border border-red-600/20 p-6 rounded-2xl">
                  <p className="text-[10px] font-black text-red-500 uppercase mb-1">Out of Warranty</p>
                  <p className="text-4xl font-black text-white">{outOfWarranty}</p>
                  <p className="text-[9px] text-zinc-500 mt-2 uppercase">Assets require immediate warranty renewal or hardware replacement plan.</p>
                </div>
                <div className="bg-zinc-800/20 p-6 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Avg. Reliability Score</p>
                  <p className="text-4xl font-black text-white">{(catAssets.length - faulty) / catAssets.length * 100 || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  </div>
)}

      
{/* --- LIVE CHAT AI WIDGET --- */}
      <div className="fixed bottom-8 right-8 z-[100]">
        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-red-600 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Actmax AI Support</h3>
                <p className="text-[10px] text-red-100 italic font-bold">Online | Powered by Gemini</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:rotate-90 transition-all">✕</button>
            </div>

            {/* Messages Area */}
            <div className="h-80 p-6 overflow-y-auto space-y-4 bg-zinc-950/50 flex flex-col">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-black shadow-lg 
                    ${msg.role === 'ai' ? 'bg-red-600 shadow-red-900/40' : 'bg-zinc-700'}`}>
                    {msg.role === 'ai' ? 'AI' : 'ME'}
                  </div>
                  <div className={`p-4 rounded-2xl text-[11px] leading-relaxed max-w-[80%] font-medium
                    ${msg.role === 'ai' ? 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700' : 'bg-red-600 text-white rounded-tr-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <p className="text-[9px] text-zinc-500 animate-pulse italic font-black uppercase tracking-tighter">AI is thinking...</p>}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
              <input 
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your technical issue..." 
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
              />
              <button onClick={sendMessage} className="bg-red-600 p-2 rounded-xl hover:bg-red-700 transition-all text-sm px-4">
                🚀
              </button>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isChatOpen ? 'bg-zinc-800 rotate-90' : 'bg-red-600 hover:bg-red-700 shadow-red-900/40'
          }`}
        >
          {isChatOpen ? <span className="text-xl">✕</span> : <span className="text-2xl">🤖</span>}
        </button>
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
      value={`${origin}/it-ticketing/asset-report?id=${selectedAsset.id}`}
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
      onClick={() => window.print()} // Atau buat function download QR
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
        value={`${origin}/it-ticketing/asset-report?id=${selectedAsset.id}`}
        size={125} 
        level={"H"}
        includeMargin={false}
        imageSettings={{
          src: "/Actmax_Logo1.png",
          height: 25,
          width: 25,
          excavate: true, // Ini penting supaya line QR tak kena logo
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

    </div>
  );
}