"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AllTicketsPage() {
  const router = useRouter();
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 50; // Berapa tiket nak tunjuk satu page

  useEffect(() => {
    async function getData() {
      const { data, error } = await supabase
        .from('Ticket') 
        .select('*')
        .order('createdAt', { ascending: false });

      if (data) setAllTickets(data);
      setLoading(false);
    }
    getData();
  }, []);

  // Filter logic untuk search bar
const filtered = allTickets.filter(t => 
  t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  String(t.id).toLowerCase().includes(searchTerm.toLowerCase())
);

const indexOfLastTicket = currentPage * ticketsPerPage;
const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
const currentTickets = filtered.slice(indexOfFirstTicket, indexOfLastTicket);

const totalPages = Math.ceil(filtered.length / ticketsPerPage);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-black tracking-[0.5em] animate-pulse italic">LOADING MASTER ARCHIVE...</div>;

  return (
    <div className="min-h-screen bg-[#060606] text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white">All tickets detail</h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Centralized IT Support Database</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
<input 
  type="text"
  placeholder="SEARCH USER / SUBJECT..."
  className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl text-[10px] font-bold outline-none focus:border-red-600 w-full md:w-80 uppercase tracking-widest"
  
  // UPDATE DI SINI
  value={searchTerm} 
  onChange={(e) => {
    setSearchTerm(e.target.value); 
    setCurrentPage(1);           
  }}
/>
            <button 
              onClick={() => router.back()}
              className="px-6 py-3 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
            >
              Back
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/50 font-black uppercase text-[10px] tracking-widest">
                <th className="p-8">Details</th>
                <th className="p-8 text-center">Category</th>
                <th className="p-8 text-center">Current Status</th>
                <th className="p-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {currentTickets.map((Ticket) => (
                <tr 
                  key={Ticket.id}
                  onDoubleClick={() => router.push(`/it-ticketing/report?id=${Ticket.id}`)}
                  className="hover:bg-zinc-800/20 transition-all group select-none cursor-default"
                >
                  <td className="p-8">
                    <div className="text-red-600 font-mono text-[10px] font-black mb-1">#{Ticket.id.slice(0,8)}</div>
                    <div className="text-lg font-bold text-white group-hover:text-red-500 transition-colors uppercase tracking-tight">{Ticket.userName}</div>
                    <div className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-tighter italic opacity-70">{Ticket.subject}</div>
                  </td>
                  
                  <td className="p-8 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black border ${Ticket.category === 'REQUEST' ? 'border-orange-500/20 text-orange-500 bg-orange-500/5' : 'border-blue-500/20 text-blue-500 bg-blue-500/5'}`}>
                      {Ticket.category}
                    </span>
                  </td>

                  <td className="p-8 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${Ticket.status === 'REJECTED' ? 'text-red-600 animate-pulse' : Ticket.status === 'COMPLETED' ? 'text-green-500' : 'text-zinc-400'}`}>
                      {Ticket.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-8 text-right">
                    <button 
                      onClick={() => router.push(`/it-ticketing/report?id=${Ticket.id}`)}
                      className="text-[10px] font-black text-zinc-600 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white pb-1"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
<div className="p-8 border-t border-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/10">
  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
    Page {currentPage} of {totalPages || 1} — Total {filtered.length} Tickets
  </p>

  <div className="flex gap-2">
    <button
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
    >
      Previous
    </button>

    {/* Optional: Page Numbers (Senarai Nombor Page) */}
    <div className="flex gap-1">
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i + 1)}
          className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${currentPage === i + 1 ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800'}`}
        >
          {i + 1}
        </button>
      )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))} 
    </div>

    <button
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages || totalPages === 0}
      className="px-4 py-2 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
    >
      Next
    </button>
  </div>
</div>

          
          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="p-20 text-center text-zinc-700 font-black uppercase tracking-widest text-xs">
              No matching records found in the archive
            </div>
          )}
        </div>
      </div>
    </div>
  );
}