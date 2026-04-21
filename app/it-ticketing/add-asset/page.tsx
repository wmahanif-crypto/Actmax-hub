"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// (moved inside component to avoid calling hooks at top-level)

const generateNextTag = async (category: string): Promise<string> => {
  const codes: Record<string, string> = {
    Desktop: 'PC',
    Laptop: 'NB',
    Network: 'NT',
    CCTV: 'CCTV',
    Printer: 'PRI',
  };

  const typeCode = codes[category] || 'AST';
  const prefix = `XX-XXX-${typeCode}`;

  // Ambil semua tag yang mengandungi -{typeCode} tak kira prefix apa (A2-QA-, HQ-, dsb)
  const { data, error } = await supabase
    .from('assets')
    .select('it_tagging')
    .ilike('it_tagging', `%-${typeCode}%`);

  if (error) {
    console.error('Error fetching tags:', error.message);
    return `${prefix}0001`; // fallback bila gagal query
  }

  // Cari 4 digit terakhir selepas typeCode di hujung string, cth: "...-PC0100"
  const re = new RegExp(`${typeCode}(\\d{4})$`, 'i');

  let maxNum = 0;
  for (const row of data ?? []) {
    const tag = (row.it_tagging ?? '') as string;
    const match = tag.match(re);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num)) {
        maxNum = Math.max(maxNum, num);
      }
    }
  }

  const next = String(maxNum + 1).padStart(4, '0');
  return `${prefix}${next}`;
};


const generateAutoSN = async () => {
  const prefix = 'ACTNOSN';
  
  // Ambil 1 data terakhir yang bermula dengan ACTNOSN
  const { data, error } = await supabase
    .from('assets')
    .select('serial_number')
    .ilike('serial_number', `${prefix}%`)
    .order('serial_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching last SN:", error.message);
    return `${prefix}000001`;
  }

  if (data && data.length > 0) {
    const lastSN = data[0].serial_number; // Contoh: "ACTNOSN000005"
    
    // Kita buang perkataan 'ACTNOSN' dan ambil nombor sahaja
    const lastNumberStr = lastSN.replace(prefix, ''); 
    const nextNumber = (parseInt(lastNumberStr) || 0) + 1;
    
    // PadStart(6, '0') maksudnya dia akan kekalkan 6 digit (000006)
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  // Kalau database kosong atau takde lagi prefix ni, start dengan 000001
  return `${prefix}000001`;
};


export default function AddAsset() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    
    it_tagging: '',
    category: 'Desktop',
    model: '',
    serial_number: '',
    status: 'Spare',
    warranty_end: '',
    ram: '',
    storage: ''
    
  });
    const [displayName, setDisplayName] = useState('Guest');
    const [noSN, setNoSN] = useState(false);
    const [allModels, setAllModels] = useState<string[]>([]);
    const [filteredModels, setFilteredModels] = useState<string[]>([]);
    const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  
      useEffect(() => {
      const savedName = localStorage.getItem('userName');
      const savedRole = localStorage.getItem('userRole');
  
      if (savedName && savedRole) {
        setDisplayName(savedName)
      } else {
        router.push('/login');
      }
    }, [router]);

  useEffect(() => {
  const fetchUniqueModels = async () => {
    const { data } = await supabase.from('assets').select('model');
    if (data) {
      // Ambil unik sahaja dan buang yang kosong
      const unique = Array.from(new Set(data.map(item => item.model))).filter(Boolean);
      setAllModels(unique as string[]);
    }
  };
  fetchUniqueModels();
}, []);

  useEffect(() => {
    const noTag = ['Software', 'Furniture', 'Peripheral'];
    if (noTag.includes(formData.category)) {
      setFormData(prev => ({ ...prev, it_tagging: 'N/A' }));
    } else {
      generateNextTag(formData.category).then(tag => {
        setFormData(prev => ({ ...prev, it_tagging: tag }));
      });
    }
  }, [formData.category]);

useEffect(() => {
    const updateSN = async () => {
      if (noSN) {
        const nextSN = await generateAutoSN();
        setFormData(prev => ({ ...prev, serial_number: nextSN }));
      } else {
        // Reset jadi kosong kalau user untick (supaya boleh taip manual)
        setFormData(prev => ({ ...prev, serial_number: '' }));
      }
    };

    updateSN();
  }, [noSN]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  
  const now = new Date().toISOString();
  
  const finalData = {
    ...formData,
    ram: (formData.category === 'Desktop' || formData.category === 'Laptop') ? formData.ram : 'N/A',
    storage: (formData.category === 'Desktop' || formData.category === 'Laptop') ? formData.storage : 'N/A',
    plant: 'N/A',
    location: 'Store / Spare',
    userName: 'SYSTEM', 
    updated_at: now
  };

  try {
    // 1. Masukkan data & dapatkan balik ID asset tersebut
    const { data: newAsset, error: assetError } = await supabase
      .from('assets')
      .insert([finalData])
      .select() // Tambah select() supaya kita dapat ID yang baru di-generate
      .single(); 
  
    if (assetError) throw assetError;

    // 2. Sediakan Log Data (Seragam dengan page lain)
    const logData = {
      item_ID: newAsset.id,             // Ambil ID dari data yang baru di-insert
      userName: displayName,
      action: 'ADD_ASSET',
      itemName: `${formData.category} - ${formData.model}`,
      old_value: 'NEW_ARRIVAL',         // Status asal (sebab barang baru)
      new_value: 'Spare',               // Status selepas register
      details: `New asset registered with Tag: ${formData.it_tagging} and S/N: ${formData.serial_number}`,
      created_at: now
    };

    // 3. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

toast.success("Asset Registered as Spare!");
setFormData({
  it_tagging: '',
  category: 'Desktop',
  model: '',
  serial_number: '',
  status: 'Spare',
  warranty_end: '',
  ram: '',
  storage: ''
});
setNoSN(false);
setLoading(false);

  } catch (error: any) {
    toast.error("Error:", error.message);
    toast.error("Error: " + (error.message || "Failed to register asset"));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-8 bg-zinc-900/20 border border-zinc-900 rounded-3xl my-10 shadow-2xl">
      <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">New Inventory Arrival</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Registering New Spare Stocks</p>
        </div>
        <button onClick={() => router.back()} className="text-[10px] font-black text-zinc-400 hover:text-white border border-zinc-800 px-4 py-2 rounded-full uppercase transition-all">Back</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ROW 1: TAG & CATEGORY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm transition-all text-white"
            >
              {['Desktop', 'Laptop', 'CCTV', 'Printer', 'Network', 'Peripheral', 'Furniture', 'Software'].map(cat => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">IT Tagging (Auto)</label>
            <input readOnly value={formData.it_tagging} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-red-500 font-black tracking-widest outline-none cursor-not-allowed shadow-inner" />
          </div>
        </div>

        {/* ROW 2: MODEL & SN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2 relative"> {/* 1. Parent kene ada 'relative' */}
  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
    Model / Brand Name
  </label>
  
  <input 
    required 
    placeholder="Example: Dell Latitude 5420" 
    value={formData.model}
    onChange={(e) => {
      const val = e.target.value;
      setFormData({...formData, model: val});
      if (val.length > 0) {
        const filtered = allModels.filter(m => m.toLowerCase().includes(val.toLowerCase()));
        setFilteredModels(filtered);
        setShowModelSuggestions(true);
      } else {
        setShowModelSuggestions(false);
      }
    }} 
    onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-500 outline-none text-sm text-white transition-all" 
  />

  {/* 2. Dropdown ni akan ikut lebar input di atas sahaja */}
  {showModelSuggestions && filteredModels.length > 0 && (
    <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden border-t-0">
      {filteredModels.map((m, index) => (
        <button
          key={index}
          type="button"
          onClick={() => {
            setFormData({...formData, model: m});
            setShowModelSuggestions(false);
          }}
          className="w-full text-left px-4 py-3 text-[11px] text-zinc-400 hover:bg-red-600 hover:text-white transition-colors border-b border-zinc-800/50 last:border-none flex justify-between items-center group"
        >
          <span className="font-bold truncate">{m}</span>
          <span className="text-[7px] opacity-0 group-hover:opacity-100 uppercase font-black tracking-tighter shrink-0 transition-opacity">
            Select
          </span>
        </button>
      ))}
    </div>
  )}
</div>
<div className="space-y-2">
      <div className="flex justify-between items-center">


        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Serial Number</label>
        {/* Checkbox No SN */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={noSN}
            onChange={(e) => setNoSN(e.target.checked)}
            className="w-3 h-3 accent-red-600 bg-black border-zinc-800 rounded"
          />
          <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-tighter">
            No Serial Number
          </span>
        </label>
      </div>

      <input 
        required 
        value={formData.serial_number}
        readOnly={noSN} // Lock input kalau auto-gen
        onChange={(e) => setFormData({...formData, serial_number: e.target.value})} 
        placeholder={noSN ? "Generating SN..." : "Enter Serial Number"}
        className={`w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-500 outline-none text-sm text-white ${noSN ? 'opacity-50 font-mono cursor-not-allowed' : ''}`} 
      />
    </div>
        </div>

        {/* ROW BARU: RAM & STORAGE (Hanya untuk PC/Laptop) */}
{(formData.category === 'Desktop' || formData.category === 'Laptop') && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Memory (RAM)</label>
      <select 
        required
        value={formData.ram}
        onChange={(e) => setFormData({...formData, ram: e.target.value})}
        className="w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm text-white appearance-none"
      >
        <option value="">-- Select RAM --</option>
        {["8GB", "16GB", "32GB", "64GB"].map(size => <option key={size} value={size}>{size}</option>)}
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Storage Type</label>
      <select 
        required
        value={formData.storage}
        onChange={(e) => setFormData({...formData, storage: e.target.value})}
        className="w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-600 outline-none text-sm text-white appearance-none"
      >
        <option value="">-- Select Storage --</option>
        {["HDD", "SSD", "M.2 NVMe", "M.2 SATA"].map(type => <option key={type} value={type}>{type}</option>)}
      </select>
    </div>
  </div>
)}

        {/* ROW 3: WARRANTY & STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Warranty End Date</label>
            <input required type="date" onChange={(e) => setFormData({...formData, warranty_end: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl focus:border-red-500 outline-none text-sm text-zinc-400" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initial Status</label>
            <input readOnly value="Spare" className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-500 font-black tracking-widest outline-none cursor-not-allowed uppercase" />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all active:scale-95 text-white shadow-xl shadow-red-900/20 disabled:opacity-50"
        >
          {loading ? 'Adding to Spare Inventory...' : 'Register New Asset'}
        </button>
      </form>
    </div>
  );
}