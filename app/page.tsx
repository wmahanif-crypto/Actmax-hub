"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ticket = {
  id: string | number;
  createdAt: string;
  userName: string;
  subject: string;
  category: "INCIDENT" | "SERVICE" | "REQUEST" | string;
  FirstNameApproval?: string;
  FirstApproval?: boolean;
  SecondNameApproval?: string;
  SecondApproval?: boolean;
};

export default function CyberCommandHub() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState<string>("Guest");
  const [role, setRole] = useState<string>(""); // [IMPROVED] mula dengan kosong
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Notifikasi
  const [notifications, setNotifications] = useState<Ticket[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);     // [IMPROVED]
  const [notifError, setNotifError] = useState<string | null>(null); // [IMPROVED]

  const isAdmin = useMemo(() => role.includes("ADMIN"), [role]); // [IMPROVED]

  // --- AUTH & USER CONTEXT ---
  useEffect(() => {
    // [IMPROVED] baca serentak untuk elak multiple re-render
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");

    if (savedName && savedRole) {
      setDisplayName(savedName);
      setRole(savedRole);
      setIsLoading(false);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    router.push("/login");
  }, [router]);

  // --- NOTIFICATIONS FETCH ---
  const fetchNotifications = useCallback(async () => {
    const loginID = localStorage.getItem("userLoginID");
    if (!loginID) return;

    try {
      setNotifLoading(true);
      setNotifError(null);

      const { data, error } = await supabase
        .from("Ticket")
        .select("*")
        .or(`FirstNameApproval.eq.${loginID},SecondNameApproval.eq.${loginID}`)
        .order("createdAt", { ascending: false });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const pending = data.filter((t: any) => {
          const isFirst = t.FirstNameApproval === loginID && t.FirstApproval === false;
          const isSecond = t.SecondNameApproval === loginID && t.SecondApproval === false;
          return isFirst || isSecond;
        });
        setNotifications(pending);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      setNotifError(err?.message || "Ralat memuat notifikasi.");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // Pastikan setState hanya jika mounted
    const safeFetch = async () => {
      if (!mounted) return;
      await fetchNotifications();
    };
    safeFetch();

    const interval = setInterval(() => {
      if (!mounted) return;
      fetchNotifications();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // --- ESC untuk tutup modal notifikasi ---
  useEffect(() => {
    if (!isNotifModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsNotifModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNotifModalOpen]);

  // --- DATA SISTEM ---
  const systems = useMemo(
    () => [
      {
        id: "it",
        name: "IT Ticketing",
        desc: "Technical support & hardware requests",
        icon: "🛠️",
        color: "from-red-600/20",
        border: "hover:border-red-600",
        path: "/it-ticketing",
        access: "ALL",
      },
      {
        id: "hr",
        name: "HR System",
        desc: "Leave application & payroll",
        icon: "👥",
        color: "from-blue-600/20",
        border: "hover:border-blue-600",
        path: "/hr-system",
        access: "ALL",
      },
      {
        id: "purchasing",
        name: "Purchasing",
        desc: "Procurement & vendor management",
        icon: "🛒",
        color: "from-green-600/20",
        border: "hover:border-green-600",
        path: "/purchasing",
        access: "ADMIN",
      },
      {
        id: "finance",
        name: "Finance",
        desc: "Claims, invoices & budget tracking",
        icon: "💰",
        color: "from-amber-500/20",
        border: "hover:border-amber-500",
        path: "/finance",
        access: "ADMIN",
      },
      {
        id: "mrf",
        name: "Maintenance (MRF)",
        desc: "Facility, electrical & civil repairs",
        icon: "🏢",
        color: "from-orange-600/20",
        border: "hover:border-orange-600",
        path: "/mrf-maintenance",
        access: "ADMIN",
      },
      {
        id: "disposal",
        name: "Disposal Form",
        desc: "Asset disposal & E-waste management",
        icon: "♻️",
        color: "from-rose-500/20",
        border: "hover:border-rose-500",
        path: "/disposal-form",
        access: "ADMIN",
      },
      {
        id: "transfer",
        name: "Transfer Form",
        desc: "Inter-departmental asset transfer",
        icon: "📦",
        color: "from-cyan-500/20",
        border: "hover:border-cyan-500",
        path: "/transfer-form",
        access: "ADMIN",
      },
      {
        id: "work-permit",
        name: "Work Permit",
        desc: "Contractor access & authorization",
        icon: "👷",
        color: "from-slate-500/20",
        border: "hover:border-zinc-500",
        path: "/work-permit",
        access: "ADMIN",
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-600 font-black tracking-[0.5em] animate-pulse">
        LOADING_SYSTEM...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans p-4 md:p-10 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] -z-10 rounded-full" />

      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 px-4">
        <div className="relative group">
          <Image
            src="/Actmax_Logo.png"
            alt="Logo"
            width={150}
            height={40}
            className="object-contain filter brightness-110"
          />
          <div className="absolute -bottom-2 left-0 w-0 h-[2px] bg-red-600 group-hover:w-full transition-all duration-500" />
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((s) => !s)}
            className="flex items-center gap-4 bg-zinc-900/30 backdrop-blur-md border border-zinc-800 p-2 pr-6 rounded-2xl hover:bg-zinc-800/50 transition-all shadow-xl"
          >
            {/* Avatar + Badge */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-black text-white">
              {displayName.charAt(0).toUpperCase()}

              {notifications.length > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 border-2 border-[#020202] rounded-full flex items-center justify-center text-[10px] font-black animate-bounce shadow-lg">
                  {notifications.length}
                </div>
              )}
            </div>

            <div className="text-left">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter leading-none mb-1">
                {role}
              </p>
              <p className="text-sm font-bold tracking-tight uppercase">
                {displayName}
              </p>
            </div>
            <span className={`text-[10px] transition-transform ${isMenuOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {/* DROPDOWN */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-4 w-56 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/setting");
                  }}
                  className="w-full text-left px-6 py-4 text-sm hover:bg-zinc-900 transition-colors flex items-center gap-3 font-bold"
                >
                  <span>⚙️</span> Setting
                </button>
              )}

              <button
                onClick={() => {
                  setIsNotifModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-6 py-4 text-sm hover:bg-zinc-900 transition-colors flex items-center gap-3 font-bold text-zinc-300"
              >
                <span>🔔</span> Notifications
                {notifications.length > 0 && (
                  <span className="bg-red-600 text-[10px] px-1.5 py-0.5 rounded-full text-white ml-2">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-6 py-4 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3 font-bold border-t border-zinc-900"
              >
                <span>🚪</span> Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="text-red-600 font-black text-[10px] uppercase tracking-[0.6em] mb-4">
              Centralized Operations Hub
            </h2>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.8] italic uppercase">
              ACT<span className="text-zinc-800">MAX</span>
              <br />
              HUB
            </h1>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] backdrop-blur-sm max-w-sm shadow-lg shadow-red-900/5">
            <p className="text-zinc-400 text-xs font-medium leading-relaxed uppercase tracking-tight">
              Welcome, <span className="text-white font-black">{displayName}</span>. Your vision
              drives our innovation. Execute with precision,{" "}
              <span className="text-red-600">lead with focus</span>.
            </p>
          </div>
        </div>
      </div>

      {/* NOTIFICATION MODAL */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsNotifModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Notifications
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  {notifLoading
                    ? "Loading..."
                    : `${notifications.length} Pending Actions Required`}
                </p>
              </div>
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {notifError && (
                <div className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  {notifError}
                </div>
              )}

              {!notifLoading && notifications.length > 0 ? (
                notifications.slice(0, 5).map((ticket) => (
                  <div
                    key={String(ticket.id)}
                    onClick={() => {
                      setIsNotifModalOpen(false);
                      router.push("/it-ticketing");
                    }}
                    className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-red-600/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">
                        {ticket.category} Approval
                      </span>
                      <span className="text-[9px] text-zinc-600 uppercase">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">
                      {ticket.subject} #{String(ticket.id).slice(-4)}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">
                      Requested by: {ticket.userName}
                    </p>
                  </div>
                ))
              ) : !notifLoading ? (
                <p className="text-center text-zinc-600 py-10 text-xs font-bold uppercase italic">
                  No pending notifications
                </p>
              ) : null}
            </div>

            {notifications.length > 5 && !notifLoading && (
              <div className="p-6 bg-zinc-900/20 text-center border-t border-zinc-900">
                <button
                  onClick={() => {
                    setIsNotifModalOpen(false);
                    router.push("/it-ticketing");
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 hover:text-red-400 transition-colors"
                >
                  See all {notifications.length} requests →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRID SISTEM */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        {systems.map((sys) => {
          const hasAccess = sys.access === "ALL" || isAdmin;

          return (
            <div
              key={sys.id}
              onClick={() => hasAccess && router.push(sys.path)}
              className={`group relative min-h-[280px] rounded-[2.5rem] p-8 border border-zinc-900 bg-zinc-900/10 transition-all duration-500 overflow-hidden flex flex-col justify-between ${
                hasAccess
                  ? `cursor-pointer hover:bg-zinc-900/40 ${sys.border} hover:-translate-y-2 shadow-2xl shadow-black`
                  : "opacity-30 cursor-not-allowed grayscale"
              }`}
            >
              {/* Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${sys.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform duration-500">
                  {sys.icon}
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-3">
                  {sys.name.split(" ")[0]}
                  <br />
                  <span className="text-zinc-600 group-hover:text-white transition-colors">
                    {sys.name.split(" ").slice(1).join(" ")}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                  {sys.desc}
                </p>
              </div>

              <div className="relative z-10 flex justify-between items-center pt-6 border-t border-zinc-800 group-hover:border-zinc-700 transition-colors">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-white transition-colors">
                  {hasAccess ? "Open Portal →" : "Access Restricted"}
                </span>
                {hasAccess && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-24 pb-12 flex justify-between items-center text-zinc-700 border-t border-zinc-900 pt-8">
        <p className="text-[8px] font-black uppercase tracking-widest">System Ver: 1.0.1 created by WMAH</p>
      </footer>
    </div>
  );
}