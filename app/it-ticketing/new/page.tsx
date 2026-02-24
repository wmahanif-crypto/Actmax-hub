"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface IssueMap {
  [key: string]: string[];
}

export default function NewTicketPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('Guest');
  
  // Tambah 'INCIDENT' dalam type
  const [category, setCategory] = useState<'SERVICE' | 'REQUEST' | 'INCIDENT'>('SERVICE');
  const [mainIssue, setMainIssue] = useState('');
  const [subIssue, setSubIssue] = useState('');
  const [description, setDescription] = useState('');
  
  const [hodApproval, setHodApproval] = useState('');
  const [managerApproval, setManagerApproval] = useState('');
  
  const [hodList, setHodList] = useState<any[]>([]);
  const [managerList, setManagerList] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);


  useEffect(() => {
    const fetchData = async () => {
      const loginID = localStorage.getItem('userLoginID');
      
      if (loginID) {
        const { data: emp } = await supabase
          .from('Employees')
          .select('*')
          .eq('userLoginID', loginID)
          .single();
        if (emp) {
          setEmployeeData(emp);
          setDisplayName(emp.userName);
        }
      }

const { data: allEmps } = await supabase
  .from('Employees')
  .select('userLoginID, userName, userRole, email');

      if (allEmps && loginID) {
        const hods = allEmps.filter(emp => {
          const roles = (emp.userRole || "").split(',').map((r: string) => r.trim());
          return roles.includes('HOD') && emp.userLoginID !== loginID;
        });
        setHodList(hods);

        const managers = allEmps.filter(emp => {
          const roles = (emp.userRole || "").split(',').map((r: string) => r.trim());
          return roles.includes('CEO') && emp.userLoginID !== loginID;
        });
        setManagerList(managers);
      }
    };
    fetchData();
  }, []);

  const serviceOptions: IssueMap = {
    "Access": ["Folder Permission", "VPN Access", "M365",  "New Account", "Door Access", "Email Distribution List" , "Other Access Issue"],
    "Hardware": ["New Keyboard/Mouse", "Monitor Issue", "Printer Problem", "Other Hardware Issue"],
    "Software": ["Software Installation", "Software Bug", "Update Required" , "Other Software Issue"],
    "Network": ["Wi-Fi Slow", "VPN Disconnected", "Cannot Connect to Network", "Other Network Issue"],
  };

  const requestOptions: IssueMap = {
    "Access": ["MERP",  "Whatapps", "USB Access", "Social Media Access" , "Other Access Issue"],
    "Hardware": ["New Laptop", "New Desktop", "New Monitor", "New Printer", "New CCTV", "New Graphic Card", "Other Hardware"],
    "License": ["Microsoft Office", "Antivirus Software", "Other Software"],
  };

  const incidentOptions: IssueMap = {
    "Account Issue": ["Forgot Password", "Unlock Account" , "Email Not Receiving", "Email Not Sending", "Access Denied", "Cannot Login", "Change Password" ,"Other Account Issue"],
    "Hardware": ["Monitor Issue",  "PC Cannot On", "Printer Problem", "Other Hardware Issue"],
    "Critical Failure": ["Server Down", "Internet Outage", "System Crash", "Other Critical Issue"],
    "Security": ["Virus/Malware", "Phishing Email", "Data Breach", "Other Security Issue"],
  };

  const isFormValid = () => {
    if (category === 'INCIDENT') {
      return mainIssue && subIssue && description; // Tak perlu check approval
    } else if (category === 'SERVICE') {
      return mainIssue && subIssue && description && hodApproval;
    } else {
      return mainIssue && subIssue && description && hodApproval && managerApproval;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (!employeeData) throw new Error("Employee data not found.");

    // 1. CARI DATA HOD (Cari sekali je untuk dapat Nama & Email)
    const selectedHodData = hodList.find((h) => h.userLoginID === hodApproval);
    
    // Sediakan Nama Penuh untuk simpan dalam DB (Table Ticket)
    const fApprovalFullName = selectedHodData ? selectedHodData.userName : (category === 'INCIDENT' ? 'AUTO-APPROVED' : hodApproval);

    const ticketStatus = category === 'INCIDENT' ? 'APPROVED' : 'PENDING_HOD';

    // 2. SIMPAN KE DATABASE
    const { data: newTicket, error } = await supabase
      .from('Ticket')
      .insert([
        {
          subject: mainIssue,
          specificProblem: subIssue,
          description: description,
          category: category,
          status: ticketStatus,
          userId: employeeData.userID,
          userName: employeeData.userName,
          userDept: employeeData.userDept,
          // Simpan ID HOD kat FirstNameApproval
          FirstNameApproval: category === 'INCIDENT' ? null : hodApproval, 
          // Simpan Nama HOD kat fApprovalFullName
          fApprovalFullName: fApprovalFullName, 
          FirstApproval: category === 'INCIDENT',
          adminApproved: category === 'INCIDENT',
          dueDate: new Date(new Date().getTime() + 86400000).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 3. TENTUKAN RECIPIENT EMAIL
    let recipientEmail = "";
    if (category === 'INCIDENT') {
      recipientEmail = "it.support@actmax.com";
    } else {
      // Ambil email daripada selectedHodData yang kita cari tadi
      recipientEmail = selectedHodData?.email || ""; 
    }

    // 4. HANTAR EMAIL
    if (recipientEmail && newTicket) {
      await fetch('/api/send-approval-email', { // Pastikan path betol: /api/...
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: newTicket.id,
          requestorName: employeeData.userName,
          subject: `${category}: ${mainIssue}`,
          description: description,
          approverEmail: recipientEmail,
          category: category
        }),
      });
    }

    alert("Ticket submitted & Notification sent!");
    router.push('/it-ticketing');

  } catch (error: any) {
    alert("Error: " + error.message);
  } finally {
    setIsLoading(false);
  }
};

  // Helper untuk ambil option ikut category
  const getOptions = () => {
    if (category === 'SERVICE') return serviceOptions;
    if (category === 'REQUEST') return requestOptions;
    return incidentOptions;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <nav className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
          <button onClick={() => router.back()} className="text-zinc-500 hover:text-white text-xs font-black uppercase">← Cancel</button>
          <Image src="/Actmax_Logo.png" alt="Logo" width={110} height={30} className="object-contain" />
        </nav>

        <form onSubmit={handleSubmit} className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-900 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">New Ticket</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Logged in as: <span className="text-red-500">{displayName}</span></p>
          </div>

          {/* Category Switcher - Sekarang ada 3 */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['SERVICE', 'REQUEST', 'INCIDENT'] as const).map((type) => (
              <button key={type} type="button" 
                onClick={() => { 
                    setCategory(type); 
                    setMainIssue(''); 
                    setSubIssue(''); 
                    setManagerApproval(''); 
                    setHodApproval(''); 
                }}
                className={`flex-1 py-3 rounded-lg text-[10px] font-black transition-all ${category === type ? 'bg-red-600 text-white' : 'text-zinc-500'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select required value={mainIssue} onChange={(e) => { setMainIssue(e.target.value); setSubIssue(''); }} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:border-red-600 appearance-none">
                <option value="">-- Issue Group --</option>
                {Object.keys(getOptions()).map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </select>
             <select required disabled={!mainIssue} value={subIssue} onChange={(e) => setSubIssue(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm font-bold text-red-500 outline-none focus:border-red-600 appearance-none">
                <option value="">-- Specific Problem --</option>
                {mainIssue && getOptions()[mainIssue]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
             </select>
          </div>

          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain details..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm min-h-[80px] outline-none focus:border-red-600" />

          {/* APPROVAL SECTION - Hanya muncul jika BUKAN Incident */}
          {category !== 'INCIDENT' ? (
            <div className="pt-6 border-t border-zinc-800 space-y-4 animate-in fade-in duration-500">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center">
                {category === 'SERVICE' ? 'HOD Approval Required' : 'Dual Approval Required (HOD + CEO)'}
                </p>
                
                <div className={`grid gap-4 ${category === 'SERVICE' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">1st Approval (HOD)</label>
                    <input required list="hod-list" placeholder="Search HOD Name..." value={hodApproval} onChange={(e) => setHodApproval(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-xl p-4 text-xs font-bold focus:border-red-600 outline-none" />
                    <datalist id="hod-list">
                    {hodList.map(hod => <option key={hod.userLoginID} value={hod.userLoginID}>{hod.userName}</option>)}
                    </datalist>
                </div>

                {category === 'REQUEST' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">2nd Approval (CEO)</label>
                    <input required list="ceo-list" placeholder="Search CEO Name..." value={managerApproval} onChange={(e) => setManagerApproval(e.target.value)} className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-xl p-4 text-xs font-bold focus:border-red-600 outline-none" />
                    <datalist id="ceo-list">
                        {managerList.map(mgr => <option key={mgr.userLoginID} value={mgr.userLoginID}>{mgr.userName}</option>)}
                    </datalist>
                    </div>
                )}
                </div>
            </div>
          ) : (
            <div className="pt-6 border-t border-zinc-800">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">🚨 Incident Mode: Direct IT Support (No Approval Required)</p>
                </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !isFormValid()} 
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${!isFormValid() ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/20'}`}
          >
            {isLoading ? "Submitting..." : "Submit Ticket →"}
          </button>
        </form>
      </div>
    </div>
  );
}