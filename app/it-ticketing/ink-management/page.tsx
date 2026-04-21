"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InkManagementPage() {
  const router = useRouter();
  const [inkList, setInkList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState<any>(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, IN, OUT

  // Form states untuk add ink baru
  const [newInkName, setNewInkName] = useState('');
  const [newInkStock, setNewInkStock] = useState(0);
  const [newInkThreshold, setNewInkThreshold] = useState(3);

  // Form states untuk restock
  const [restockQty, setRestockQty] = useState(1);
  const [restockNotes, setRestockNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: inks } = await supabase
  .from('ink_inventory')
  .select('*')
  .order('ink_name');
    if (inks) setInkList(inks);

    const { data: tx } = await supabase
  .from('ink_transactions')
  .select('*, ink_inventory(ink_name)')
  .order('created_at', { ascending: false })
  .limit(50);
    if (tx) setTransactions(tx);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('ink-mgmt')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'ink_inventory' }, fetchData)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ink_transactions' }, fetchData)
  .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddInk = async () => {
    if (!newInkName.trim()) return alert("Enter ink name");

    const { error } = await supabase.from('ink_inventory').insert({
      ink_name: newInkName,
      current_stock: newInkStock,
      low_threshold: newInkThreshold
    });

    if (error) return alert(error.message);

    setShowAddModal(false);
    setNewInkName('');
    setNewInkStock(0);
    setNewInkThreshold(3);
    fetchData();
  };

  const handleRestock = async () => {
    if (restockQty <= 0) return alert("Quantity must be > 0");

    // 1. Insert transaction
    await supabase.from('ink_transactions').insert({
      ink_id: showRestockModal.id,
      type: 'IN',
      quantity: restockQty,
      notes: restockNotes || 'Restock',
      recorded_by: localStorage.getItem('userName')
    });

    // 2. Update stock
    await supabase.from('ink_inventory')
  .update({
      current_stock: showRestockModal.current_stock + restockQty,
      last_updated: new Date().toISOString()
    })
  .eq('id', showRestockModal.id);

    setShowRestockModal(null);
    setRestockQty(1);
    setRestockNotes('');
    fetchData();
  };

  const updateThreshold = async (id: string, newThreshold: number) => {
    await supabase.from('ink_inventory')
  .update({ low_threshold: newThreshold })
  .eq('id', id);
    fetchData();
  };

  const filteredTx = transactions.filter(tx => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button onClick={() => router.back()} className="text-zinc-500 hover:text-white text-sm font-bold mb-2">
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-blue-500">Ink Stock Management</h1>
            <p className="text-zinc-500 text-xs mt-1">Add new ink, restock, set alerts & view history</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text- uppercase tracking-widest transition-all"
          >
            + Add New Ink Type
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
          <div className="p-6 border-b border-zinc-900">
            <h3 className="text-sm font-black italic uppercase text-white">Current Inventory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50">
                <tr className="text-zinc-600 text- font-black uppercase tracking-widest border-b border-zinc-900">
                  <th className="p-4">Ink Type</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Low Alert</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {inkList.map(ink => (
                  <tr key={ink.id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{ink.ink_name}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xl font-black ${
                        ink.current_stock <= ink.low_threshold? 'text-red-500' : 'text-green-500'
                      }`}>
                        {ink.current_stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        value={ink.low_threshold}
                        onChange={(e) => updateThreshold(ink.id, Number(e.target.value))}
                        className="w-16 bg-zinc-950 border-zinc-800 rounded-lg px-2 py-1 text-xs text-center"
                        min="1"
                      />
                    </td>
                    <td className="p-4 text- text-zinc-500 font-mono">
                      {new Date(ink.last_updated).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setShowRestockModal(ink)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text- font-black uppercase tracking-widest transition-all"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
            <h3 className="text-sm font-black italic uppercase text-white">Transaction History</h3>
            <div className="flex gap-2">
              {['ALL', 'IN', 'OUT'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-lg text- font-black uppercase transition-all ${
                    filterType === f
                    ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {f === 'IN'? 'Restock' : f === 'OUT'? 'Usage' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50 sticky top-0">
                <tr className="text-zinc-600 text- font-black uppercase tracking-widest border-b border-zinc-900">
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Ink</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4">Taken By</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-800/20">
                    <td className="p-4 text- text-zinc-500 font-mono">
                      {new Date(tx.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`text- font-black px-2 py-0.5 rounded ${
                        tx.type === 'IN'? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                      }`}>
                        {tx.type === 'IN'? 'RESTOCK' : 'USAGE'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-white">{tx.ink_inventory?.ink_name}</td>
                    <td className="p-4 text-center text-sm font-black">{tx.quantity}</td>
                    <td className="p-4 text- text-zinc-300">{tx.taken_by || '-'}</td>
                    <td className="p-4 text- text-zinc-500">{tx.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Ink Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-zinc-800 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-lg font-black text-white uppercase mb-6">Add New Ink Type</h3>
            <div className="space-y-4">
              <input
                placeholder="Ink name e.g. HP 682 (Black)"
                value={newInkName}
                onChange={e => setNewInkName(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 rounded-xl px-4 py-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Initial stock"
                  value={newInkStock}
                  onChange={e => setNewInkStock(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 rounded-xl px-4 py-3 text-sm"
                />
                <input
                  type="number"
                  placeholder="Low alert at"
                  value={newInkThreshold}
                  onChange={e => setNewInkThreshold(Number(e.target.value))}
                  className="bg-zinc-900 border-zinc-800 rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl text- font-black uppercase">Cancel</button>
              <button onClick={handleAddInk} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text- font-black uppercase">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-zinc-800 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-lg font-black text-white uppercase mb-1">Restock Ink</h3>
            <p className="text-blue-500 font-mono text-xs mb-6">{showRestockModal.ink_name} - Current: {showRestockModal.current_stock}</p>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Quantity to add"
                value={restockQty}
                onChange={e => setRestockQty(Number(e.target.value))}
                min="1"
                className="w-full bg-zinc-900 border-zinc-800 rounded-xl px-4 py-3 text-sm"
              />
              <input
                placeholder="Notes (supplier, PO, etc)"
                value={restockNotes}
                onChange={e => setRestockNotes(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRestockModal(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-xl text- font-black uppercase">Cancel</button>
              <button onClick={handleRestock} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text- font-black uppercase">Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}