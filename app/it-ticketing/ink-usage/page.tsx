"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InkUsagePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchInk, setSearchInk] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
  .from('ink_transactions')
  .select('*, ink_inventory(ink_name)')
  .eq('type', 'OUT')
  .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data } = await query.limit(200);
    if (data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase.channel('ink-usage-log')
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ink_transactions', filter: 'type=eq.OUT' }, fetchLogs)
 .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dateFrom, dateTo]);

  const filteredLogs = logs.filter(log => {
    const matchUser = log.taken_by?.toLowerCase().includes(searchUser.toLowerCase());
    const matchInk = log.ink_inventory?.ink_name?.toLowerCase().includes(searchInk.toLowerCase());
    return matchUser && matchInk;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Ink Type', 'Quantity', 'Taken By', 'Recorded By', 'Notes'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleDateString('en-GB'),
      new Date(log.created_at).toLocaleTimeString('en-GB'),
      log.ink_inventory?.ink_name,
      log.quantity,
      log.taken_by,
      log.recorded_by,
      log.notes || ''
    ]);

    const csv = [headers,...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ink-usage-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalIssued = filteredLogs.reduce((sum, log) => sum + log.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button onClick={() => router.back()} className="text-zinc-500 hover:text-white text-sm font-bold mb-2">
              ← Back
            </button>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-red-500">Ink Issue Log</h1>
            <p className="text-zinc-500 text-xs mt-1">Audit trail: who took what, when</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black text- uppercase tracking-widest transition-all"
          >
            Export CSV
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text- font-black text-zinc-600 uppercase tracking-widest mb-1">Total Records</p>
            <p className="text-2xl font-black text-white">{filteredLogs.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text- font-black text-zinc-600 uppercase tracking-widest mb-1">Total Issued</p>
            <p className="text-2xl font-black text-red-500">{totalIssued}</p>
            <p className="text- text-zinc-500">units</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text- font-black text-zinc-600 uppercase tracking-widest mb-1">Unique Users</p>
            <p className="text-2xl font-black text-blue-500">
              {new Set(filteredLogs.map(l => l.taken_by)).size}
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <p className="text- font-black text-zinc-600 uppercase tracking-widest mb-1">Date Range</p>
            <p className="text- font-bold text-zinc-400">
              {dateFrom || 'All time'} → {dateTo || 'Now'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-3xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              placeholder="Search by user..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="bg-zinc-950 border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              placeholder="Search ink type..."
              value={searchInk}
              onChange={e => setSearchInk(e.target.value)}
              className="bg-zinc-950 border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-zinc-950 border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-zinc-950 border-zinc-800 rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 sticky top-0">
                <tr className="text-zinc-600 text- font-black uppercase tracking-widest border-b border-zinc-900">
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Ink Type</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4">Taken By</th>
                  <th className="p-4">Recorded By</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {loading? (
                  <tr><td colSpan={6} className="p-10 text-center text-zinc-500">Loading...</td></tr>
                ) : filteredLogs.length === 0? (
                  <tr><td colSpan={6} className="p-10 text-center text-zinc-600 italic uppercase text-">No records found</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-800/20 transition-all">
                      <td className="p-4">
                        <p className="text- text-zinc-300 font-mono">
                          {new Date(log.created_at).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text- text-zinc-600">
                          {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-white">{log.ink_inventory?.ink_name}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black text-red-500">{log.quantity}</span>
                      </td>
                      <td className="p-4">
                        <p className="text- font-bold text-red-500 uppercase">{log.taken_by}</p>
                      </td>
                      <td className="p-4 text- text-zinc-500">{log.recorded_by}</td>
                      <td className="p-4 text- text-zinc-500 max-w-xs truncate">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}