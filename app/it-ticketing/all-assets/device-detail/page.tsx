"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Setup client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AllAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) setAssets(data);
      setLoading(false);
    }
    fetchAssets();
  }, []);

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-white">
      <h1 className="text-3xl font-black italic mb-8 uppercase">IT Inventory Dashboard</h1>

      {loading ? (
        <p>Loading assets...</p>
      ) : (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="p-4">Tagging</th>
                <th className="p-4">CPU</th>
                <th className="p-4">RAM</th>
                <th className="p-4">Last User</th>
                <th className="p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition">
                  <td className="p-4 font-bold">{asset.it_tagging}</td>
                  <td className="p-4 font-mono text-zinc-400">{asset.cpu}</td>
                  <td className="p-4">{asset.ram}</td>
                  <td className="p-4">{asset.last_user}</td>
                  <td className="p-4 text-[10px] text-zinc-500">
                    {new Date(asset.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}