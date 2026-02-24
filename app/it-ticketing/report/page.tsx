"use client";
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useReactToPrint } from 'react-to-print';
import { ReportTemplate } from './ReportTemplate';

// 1. PINDAHKAN SEMUA LOGIC ASAL KE DALAM CONTENT COMPONENT
function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('id');
  
  const [Ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<any>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `IT-Report-${Ticket?.id?.slice(0, 8) || 'Doc'}`,
  });

  const getSLATime = (dueDate: string) => {
    if (!dueDate) return { text: "NO DEADLINE", color: "text-zinc-600" };
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    if (diff <= 0) return { text: "OVERDUE / SLA FAILED", color: "text-red-500 animate-pulse" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = "";
    if (days > 0) timeString += `${days}D `;
    if (hours > 0) timeString += `${hours}H `;
    timeString += `${minutes}M`;

    let color = "text-green-500";
    if (days === 0 && hours < 5) color = "text-orange-500";
    if (days === 0 && hours < 1) color = "text-red-500";
    return { text: timeString, color };
  };

  useEffect(() => {
    if (ticketId) {
      const fetchTicketAndStaff = async () => {
        const { data: ticketData, error: ticketError } = await supabase
          .from('Ticket')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketData) {
          setTicket(ticketData);

          if (ticketData.assignedTo) {
            const { data: empData } = await supabase
              .from('Employees')
              .select('*')
              .eq('userLoginID', ticketData.assignedTo)
              .single();
            
            if (empData) {
              setStaffData(empData);
            }
          }
        }
        setLoading(false);
      };
      
      fetchTicketAndStaff();
    }
  }, [ticketId]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-[0.5em] animate-pulse">Loading Report...</div>;
  if (!Ticket) return <div className="min-h-screen bg-black text-white p-10 font-black uppercase">Ticket Not Found.</div>;

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                Ticket.category === 'REQUEST' ? 'bg-orange-600' : 
                Ticket.category === 'INCIDENT' ? 'bg-red-600' : 'bg-blue-600'
              }`}>
                {Ticket.category}
              </span>
              <span className="text-zinc-500 font-mono text-sm">#{Ticket.id?.slice(0,8)}</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">{Ticket.subject}</h1>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 border border-zinc-800 rounded-full text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-4">
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-4 h-[1px] bg-zinc-800"></span> Issue Detail
              </h3>
              <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem]">
                <div className="mb-8">
                  <label className="text-[9px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Specific Problem</label>
                  <p className="text-xl font-bold text-white leading-tight">{Ticket.specificProblem || "Standard Issue"}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Full Description</label>
                  <p className="text-zinc-400 leading-relaxed font-medium">{Ticket.description}</p>
                </div>
              </div>
            </section>

            {/* Approval Workflow */}
            {Ticket.category !== 'INCIDENT' ? (
              <section className="space-y-4">
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-zinc-800"></span> Approval Workflow 
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-6 border rounded-2xl flex items-center gap-5 transition-all ${Ticket.FirstApproval ? 'bg-green-500/5 border-green-500/30' : 'bg-zinc-900/20 border-zinc-800'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${Ticket.FirstApproval ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {Ticket.FirstApproval ? '✓' : '1'}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase">HOD Approval</p>
                      <p className="font-bold text-sm text-white uppercase">{Ticket.fApprovalFullName || Ticket.FirstNameApproval || 'Pending'}</p>
                      {Ticket.FirstApprovalAt && (
                        <p className="text-[9px] font-bold text-green-500 mt-1 uppercase tracking-tighter">
                          Approved: {new Date(Ticket.FirstApprovalAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {Ticket.category === 'REQUEST' && (
                    <div className={`p-6 border rounded-2xl flex items-center gap-5 transition-all ${Ticket.SecondApproval ? 'bg-green-500/5 border-green-500/30' : 'bg-zinc-900/20 border-zinc-800'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${Ticket.SecondApproval ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                        {Ticket.SecondApproval ? '✓' : '2'}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase">CEO Approval</p>
                        <p className="font-bold text-sm text-white uppercase">{Ticket.sApprovalFullName || Ticket.SecondNameApproval || 'Pending'}</p>
                        {Ticket.SecondApprovalAt && (
                          <p className="text-[9px] font-bold text-green-500 mt-1 uppercase tracking-tighter">
                            Approved: {new Date(Ticket.SecondApprovalAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-4">
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-zinc-800"></span> Workflow Status
                </h3>
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Direct Technical Incident</p>
                  <p className="text-zinc-400 text-xs font-medium italic">Emergency/direct support. No management approval required.</p>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] sticky top-8 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Tracking Info</h3>
              <div className="space-y-8">
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-1 tracking-widest">Ticket Created</label>
                  <p className="text-sm font-black text-white uppercase italic">
                    {Ticket.createdAt ? new Date(Ticket.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-2 tracking-widest">Current Status</label>
                  <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${['COMPLETED', 'RESOLVED'].includes(Ticket.status) ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`}>
                    {Ticket.status}
                  </span>
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-1 tracking-widest">Technical Staff</label>
                  <p className="text-sm font-black text-red-500 uppercase">{Ticket.assignedTo || 'NOT ASSIGNED'}</p>
                  {Ticket.assignedAt && (
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter italic">
                      Assign At: {new Date(Ticket.assignedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {['COMPLETED', 'RESOLVED'].includes(Ticket.status) && Ticket.completedAt && (
                  <div>
                    <label className="text-[9px] font-black text-green-600 uppercase block mb-1 tracking-widest">Resolution Time</label>
                    <p className="text-[11px] font-black text-white uppercase">{new Date(Ticket.completedAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-black text-zinc-600 uppercase block mb-1 tracking-widest">SLA Time Remaining</label>
                  {['IN PROGRESS', 'PENDING_HOD', 'PENDING_CEO'].includes(Ticket.status) ? (
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-ping ${getSLATime(Ticket.dueDate).color.replace('text', 'bg')}`}></span>
                      <p className={`text-sm font-black italic ${getSLATime(Ticket.dueDate).color}`}>{getSLATime(Ticket.dueDate).text}</p>
                    </div>
                  ) : <p className="text-sm font-black text-zinc-500 italic uppercase">SLA CLOSED</p>}
                </div>
                <div className="pt-8 border-t border-zinc-800 mt-8">
                  <button onClick={() => handlePrint()} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                    📄 Export to PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          <ReportTemplate Ticket={Ticket} Staff={staffData} />
        </div>
      </div>
    </div>
  );
}

// 2. EXPORT DEFAULT UTAMA YANG DIBUNGKUS SUSPENSE
export default function TicketReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest">Preparing Report PWA...</div>}>
      <ReportContent />
    </Suspense>
  );
}