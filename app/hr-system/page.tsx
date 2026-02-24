'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HRSystemPage() {
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState('STAFF'); 
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    if (savedName) setDisplayName(savedName);
    if (savedRole) setRole(savedRole);
  }, []);

  const currentRoles = (role || "").split(',').map(r => r.trim().toUpperCase());
  const isHR = currentRoles.includes('HR ADMIN');

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-4 md:p-12 relative overflow-hidden">
      {/* Background Glow Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-red-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-12 border-b border-zinc-900/50 pb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/')} 
              className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> ACTMAX HUB
            </button>
            <div className="h-6 w-[1px] bg-zinc-800"></div>
            <Image src="/Actmax_Logo.png" alt="Logo" width={120} height={30} className="brightness-125" />
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest leading-none mb-1">HR PORTAL • {role}</p>
              <p className="text-sm font-bold text-zinc-300 uppercase tracking-tight">{displayName}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-blue-500 shadow-inner">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: NAVIGATION & QUICK ACTIONS */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2rem] backdrop-blur-sm">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Service Desk
              </h3>
              <div className="space-y-3">
                <QuickActionButton title="Request Training" emoji="🎓" color="blue" />
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2rem]">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Learning Center</h3>
              <div className="bg-gradient-to-br from-zinc-900 to-black p-5 rounded-2xl border border-zinc-800 group hover:border-blue-500/50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded tracking-tighter">TECHNICAL</span>
                  <span className="text-zinc-600 text-[10px] font-bold">FEB 15</span>
                </div>
                <p className="text-sm font-black text-white uppercase group-hover:text-blue-400 transition-colors">Advanced AI Prompting for Production</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                  <span>Register Now</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>

{/* RIGHT COLUMN: MAIN INTERFACE */}
<div className="lg:col-span-8 space-y-8">
    {/* Sekarang dia check kalau dalam array roles tu ada 'HR ADMIN' */}
    {isHR ? (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            Administrator Access Granted: {role}
          </p>
        </div>
                
                {/* SECTION 1: MASTER CONTROLS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <AdminQuickLink icon="🔗" label="BrioHR" onClick={() => window.open('https://app.briohr.com/')} />
                  <AdminQuickLink icon="🏠" label="Hostel Mgmt" color="orange" onClick={() => router.push('/hr-system/hostel')} />
                  <AdminQuickLink icon="➕" label="New Joiner" color="blue" onClick={() => router.push('/hr-system/new-joiner')}/>
                  <AdminQuickLink icon="🎓" label="Add Training" color="green" />
                </div>

                {/* SECTION 2: HOSTEL & TRAINING OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-4xl">🏠</div>
                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Hostel Capacity</h4>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black italic tracking-tighter text-white">42</span>
                      <span className="text-zinc-600 font-bold text-xs mb-1 uppercase">Occupants</span>
                    </div>
                    <div className="mt-6 flex gap-1 items-center">
                      <div className="h-1.5 w-full bg-orange-500/20 rounded-full overflow-hidden">
                         <div className="h-full w-[80%] bg-orange-500 rounded-full"></div>
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase ml-2">80%</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2.5rem]">
                    <h4 className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mb-4">Training Engagement</h4>
                    <div className="flex items-end justify-between">
                      <span className="text-4xl font-black italic tracking-tighter text-white font-mono text-green-500">12</span>
                      <p className="text-[9px] font-bold text-zinc-500 text-right uppercase leading-tight italic">Pending<br/>Registrations</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: OFFBOARDING PIPELINE */}
                <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl"></div>
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Exit Management</h2>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Checklist for IT Asset & Final Clearance</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <OffboardingCard 
                      name="Hanif Musdek" 
                      dept="Creative" 
                      status="EXIT REQUESTED" 
                      steps={[true, true, false, false]} 
                    />
                    <OffboardingCard 
                      name="Sarah Jenkins" 
                      dept="Logistics" 
                      status="ASSET CLEARANCE" 
                      steps={[true, true, true, false]} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* STAFF VIEW */
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[3rem] p-10 overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                      <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">Active Employee</span>
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mt-4 mb-2">Welcome Back, {displayName}</h2>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Your profile is synchronized with HR central.</p>
                    </div>
                    
                    <div className="flex gap-3">
                       <button onClick={() => window.open('https://app.briohr.com/')} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:invert transition-all flex items-center gap-2 text-center">
                          BrioHR <span className="opacity-50">↗</span>
                       </button>
                       <button className="bg-zinc-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">
                          My Assets
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2rem]">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Upcoming Events</p>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-zinc-800 rounded-xl flex flex-col items-center justify-center border border-zinc-700">
                          <span className="text-[8px] font-black text-blue-500 leading-none">FEB</span>
                          <span className="text-sm font-black text-white leading-none">15</span>
                       </div>
                       <div>
                          <p className="text-xs font-bold uppercase text-zinc-300">Advanced AI Prompting</p>
                          <p className="text-[10px] text-zinc-600 uppercase font-black">Technical Training</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2rem]">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4">Hostel Info</p>
                    <div className="flex items-center gap-4 opacity-50">
                       <span className="text-xl">🏠</span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic underline">No Active Assignment</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AdminQuickLink({ icon, label, onClick, color = "zinc" }: { icon: string, label: string, onClick?: any, color?: string }) {
  const colorMap: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-600 hover:text-white",
    green: "text-green-500 bg-green-500/10 border-green-500/20 hover:bg-green-600 hover:text-white",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20 hover:bg-orange-600 hover:text-white",
    zinc: "text-zinc-400 bg-zinc-900/50 border-zinc-800 hover:bg-white hover:text-black",
  };

  return (
    <button onClick={onClick} className={`${colorMap[color]} border p-5 rounded-3xl flex flex-col items-center gap-3 transition-all duration-300 transform hover:-translate-y-1`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function QuickActionButton({ title, emoji, color }: { title: string, emoji: string, color: string }) {
  return (
    <button className="w-full bg-zinc-900/40 hover:bg-blue-600 border border-zinc-800 hover:border-blue-400 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex justify-between items-center group transition-all">
      <span className="flex items-center gap-3">
        <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{emoji}</span>
        {title}
      </span>
      <span className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1">→</span>
    </button>
  );
}

function OffboardingCard({ name, dept, status, steps }: { name: string, dept: string, status: string, steps: boolean[] }) {
  return (
    <div className="bg-zinc-950/50 p-6 rounded-[1.5rem] border border-zinc-800/80 flex flex-col xl:flex-row justify-between items-center gap-6 group hover:border-zinc-700 transition-all text-center xl:text-left">
      <div className="flex flex-col xl:flex-row items-center gap-5 flex-1 w-full">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 group-hover:text-white transition-colors">
          {name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center justify-center xl:justify-start gap-3 mb-1">
            <span className="text-sm font-black uppercase tracking-tight text-white">{name}</span>
            <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-black tracking-widest">{status}</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{dept} Department</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((done, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all duration-500 ${
              done ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-700'
            }`}>
              {done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`h-[2px] w-4 rounded-full ${done && steps[i+1] ? 'bg-blue-600' : 'bg-zinc-800'}`}></div>}
          </div>
        ))}
      </div>

      <button className="w-full xl:w-auto bg-zinc-800 hover:bg-white hover:text-black text-white text-[9px] font-black px-6 py-3 rounded-xl uppercase tracking-[0.2em] transition-all">
        Action
      </button>
    </div>
  );
}