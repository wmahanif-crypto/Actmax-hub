'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Pastikan path ni betul

export default function NewJoinerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('Guest');
  const [role, setRole] = useState('ADMIN'); // STAFF, HOD, SUPPORT, ADMIN

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

  // State untuk simpan semua data form
  const [formData, setFormData] = useState({
    userID: '',
    userLoginID: '',
    userPosition: '',
    userDept: '',
    userRole: '',
    plant: '',
    location: '',
    userName: '', // Full Name
    email: '',
    ICoRpassportNo: '',
    gender: '',
    race: '',
    nationality: '',
    joinDate: '',
    itAssetNeeded: 'None'
  });

  // Function untuk update state bila user menaip/pilih
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const now = new Date().toISOString();

  try {
    // 1. Masukkan data ke table Employees
    // Kita guna .select().single() untuk dapatkan ID yang baru dijana (jika perlu)
    const { data: newEmp, error: empError } = await supabase
      .from('Employees')
      .insert([{
        userID: formData.userID,
        userLoginID: formData.userLoginID,
        userName: formData.userName,
        userPosition: formData.userPosition,
        userDept: formData.userDept,
        userRole: formData.userRole,
        plant: formData.plant,
        location: formData.location,
        email: formData.email,
        ICoRpassportNo: formData.ICoRpassportNo,
        gender: formData.gender,
        race: formData.race,
        nationality: formData.nationality,
        joinDate: formData.joinDate,
        itAssetNeeded: formData.itAssetNeeded,
        createdAt: now
      }])
      .select()
      .single();

    if (empError) throw empError;

    // 2. Sediakan Log Data (Seragam dengan module lain)
    const logData = {
      item_ID: formData.userID, // Gunakan Employee ID sebagai identifier
      userName: displayName,    // Nama staff yang mendaftarkan (IT/HR Admin)
      action: 'ADD_EMPLOYEE', 
      itemName: `${formData.userName} (${formData.userDept})`,
      old_value: 'NEW_REGISTRATION',
      new_value: 'Active',
      details: `New employee registered: ${formData.userName}. Position: ${formData.userPosition}. Asset needed: ${formData.itAssetNeeded}`,
      created_at: now
    };

    // 3. Masukkan ke table activity_logs
    const { error: logError } = await supabase.from('activity_logs').insert([logData]);

    if (logError) {
      console.error("Failed to save activity log:", logError.message);
    }

    alert("Employee Registered Successfully & Logged!");
    router.push('/hr-system'); 

  } catch (error: any) {
    console.error("Error:", error.message || error);
    alert("Failed to register: " + (error.message || "Unknown error occurred"));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans p-6 md:p-16">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => router.back()} 
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">New Personnel</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Actmax Employee Database Entry</p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] p-8 md:p-12 backdrop-blur-sm shadow-2xl">
<form onSubmit={handleSubmit} className="space-y-12">
  {/* SECTION 1: WORK ASSIGNMENT */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
    <div className="lg:col-span-4">
      <h3 className="text-lg font-black uppercase italic text-white mb-2">Work Assignment</h3>
      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">System IDs & Factory Location</p>
    </div>
    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputGroup name="userID" label="User ID" placeholder="e.g. AM-1001" onChange={handleChange} />
      <InputGroup name="userLoginID" label="Eser Login ID" placeholder="e.g. firstname.lastname" onChange={handleChange} />
      <InputGroup name="userPosition" label="Position" placeholder="e.g. Production Leader" onChange={handleChange} />
      <InputGroup name="userDept" label="Department" placeholder="e.g. Manufacturing" onChange={handleChange} />
      <SelectGroup name="systemRole" label="System Role" options={['STAFF', 'HOD']} onChange={handleChange} />
      <SelectGroup name="plant" label="Plant" options={['A1', 'A2', 'A3', 'A4', 'A5', 'A6']} onChange={handleChange} />
      <InputGroup name="location" label="Location" placeholder="e.g. Main Office, Level 2" className="md:col-span-2" onChange={handleChange} />
    </div>
  </div>

  <hr className="border-zinc-900" />

{/* NEW SECTION: IT ASSET PROVISIONING */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
  <div className="lg:col-span-4">
    <h3 className="text-lg font-black uppercase italic text-white mb-2">IT Provisioning</h3>
    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Asset Requirements & Setup</p>
  </div>
  <div className="lg:col-span-8 space-y-8">
    
    {/* Asset Selection */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AssetOption id="laptop" label="Laptop" icon="💻" name="itAssetNeeded" value="Laptop" onChange={handleChange} />
      <AssetOption id="desktop" label="Desktop" icon="🖥️" name="itAssetNeeded" value="Desktop" onChange={handleChange} />
      <AssetOption id="none" label="No Asset" icon="✖" name="itAssetNeeded" value="None" onChange={handleChange} defaultChecked />
    </div>

    {/* IT Notification Mockup */}
    <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-[2rem] flex items-start gap-4">
      <div className="text-2xl">📧</div>
      <div>
        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">IT Automation Notice</h4>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Submitting this form will auto-notify **IT Support Team** to generate an @actmax.com email and check current asset stock.
        </p>
      </div>
    </div>
  </div>
</div>

<hr className="border-zinc-900" />

            {/* SECTION 2: PERSONAL IDENTITY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <h3 className="text-lg font-black uppercase italic text-white mb-2">Personal Identity</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Official Identification & Origin</p>
              </div>
<div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
    <InputGroup name="userName" label="Full Name" placeholder="e.g. Ahmad Suhairi Bin Ali" className="md:col-span-2" onChange={handleChange} />
    <InputGroup name="userEmail" label="Email Address" type="email" placeholder="suhairi@actmax.com" onChange={handleChange} />
    <InputGroup name="icNo" label="IC or Passport No" placeholder="e.g. 950101-01-XXXX" onChange={handleChange} />
    <SelectGroup name="gender" label="Gender" options={['Male', 'Female']} onChange={handleChange} />
    <SelectGroup name="race" label="Race" options={['Malay', 'Chinese', 'Indian', 'Others']} onChange={handleChange} />
    <SelectGroup name="nationality" label="Nationality" options={['Malaysia', 'Indonesia', 'Bangladesh', 'Myanmar', 'Nepal']} onChange={handleChange} />
    <InputGroup name="joinDate" label="Join Date" type="date" onChange={handleChange} />
  </div>
            </div>

            {/* Action Buttons */}
<div className="pt-8 flex flex-col md:flex-row gap-4">
    <button 
      type="submit" 
      disabled={loading}
      className="flex-1 bg-white text-black font-black uppercase py-5 rounded-2xl tracking-[0.3em] text-xs hover:bg-blue-600 hover:text-white transition-all shadow-lg disabled:opacity-50"
    >
      {loading ? "Registering..." : "Register Employee to System"}
    </button>
  </div>

          </form>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function InputGroup({ label, name, placeholder, type = "text", onChange, className = "" }: any) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} // Tambah ini
        onChange={onChange} // Tambah ini
        required // Bagus kalau letak required
        type={type}
        placeholder={placeholder}
        className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-700 font-bold shadow-inner"
      />
    </div>
  );
}

function AssetOption({ id, label, icon, name, value, onChange, defaultChecked = false }: { id: string, label: string, icon: string, name: string, value: string, onChange: (e: any) => void, defaultChecked?: boolean }) {
  return (
    <label htmlFor={id} className="cursor-pointer group">
      <input type="radio" id={id} name={name} value={value} defaultChecked={defaultChecked} onChange={onChange} className="peer hidden" />
      <div className="flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl group-hover:border-zinc-700 peer-checked:border-blue-500 peer-checked:bg-blue-500/5 transition-all">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 peer-checked:text-white">{label}</span>
        </div>
        <div className="w-3 h-3 rounded-full border-2 border-zinc-800 peer-checked:border-blue-500 peer-checked:bg-white transition-all"></div>
      </div>
    </label>
  );
}

function SelectGroup({ label, options, className, name, onChange }: { label: string, options: string[], className?: string, name: string, onChange?: (e: any) => void }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {/* Kita guna defaultValue="" untuk set "Select Label" sebagai yang pertama keluar */}
<select 
          name={name} // Tambah ini
          onChange={onChange} // Tambah ini
          required
          defaultValue="" 
          className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl px-5 py-4 text-sm appearance-none cursor-pointer text-white font-bold"
        >
          <option value="" disabled className="text-zinc-700">
            Select {label}
          </option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-zinc-950 text-white">
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 text-xs">▼</div>
      </div>
    </div>
  );
}