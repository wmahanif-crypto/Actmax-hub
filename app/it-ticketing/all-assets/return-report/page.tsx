'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function UserReturnContent() {
  const searchParams = useSearchParams();
  const rawUser = searchParams.get('user');
  const userName = rawUser ? decodeURIComponent(rawUser) : null;
  
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullReportData = async () => {
      if (!userName) return;
      setLoading(true);

      // 1. Tarik Data Assets
      const { data: assets, error: assetErr } = await supabase
        .from('assets')
        .select('*')
        .eq('userName', userName)
        .order('category', { ascending: true });

      // 2. Tarik Data Employee details (Guna huruf kecil 'employees')
      const { data: emp, error: empErr } = await supabase
        .from('Employees') 
        .select('*')
        .ilike('userName', userName) // Guna ilike supaya tak kisah huruf besar/kecil
        .maybeSingle(); // maybeSingle elakkan error kalau data takde

      if (assetErr) console.error("Asset Error:", assetErr.message);
      if (empErr) console.error("Employee Error:", empErr.message);

      if (assets) setUserAssets(assets);
      if (emp) setEmployeeData(emp);
      
      setLoading(false);
    };

    fetchFullReportData();
  }, [userName]);

  // Tarikh hari ini format DD/MM/YYYY
  const todayDate = new Date().toLocaleDateString('en-GB');

  if (loading) return <div className="p-10 text-center font-mono uppercase tracking-widest">Generating Official Report...</div>;
  if (!userAssets.length) return <div className="p-10 text-center font-mono text-red-500">NO ASSETS FOUND FOR USER: {userName}</div>;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-10 print:p-0 print:bg-white text-black font-sans">
      <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl print:shadow-none print:w-full border border-zinc-200 print:border-none">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
          <img src="/Actmax_Logo2.png" alt="Logo" className="h-16 object-contain" />
          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-tighter">IT Asset Returned Form</h1>
            <p className="text-[10px] text-zinc-600 font-mono italic">ACA-IT-F-003 (Rev 1)</p>
          </div>
        </div>

        {/* 1. Employee Details Section */}
<section className="mb-8">
  <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
    <span className="bg-black text-white px-2 py-0.5 text-xs">1</span> Employee Details
  </h3>
  <table className="w-full border-collapse border border-black text-[11px]">
    <tbody>
      <tr>
        <td className="p-2 border border-black bg-zinc-50 font-bold w-[20%]">Form Date:</td>
        <td className="p-2 border border-black w-[30%]">{todayDate}</td>
        <td className="p-2 border border-black bg-zinc-50 font-bold w-[20%]">Employee ID:</td>
        <td className="p-2 border border-black font-mono w-[30%]">{employeeData?.userID || '-'}</td>
      </tr>
      <tr>
        <td className="p-2 border border-black bg-zinc-50 font-bold">Employee Name:</td>
        <td colSpan={3} className="p-2 border border-black uppercase font-black text-sm">{userName}</td>
      </tr>
      <tr>
        <td className="p-2 border border-black bg-zinc-50 font-bold">Job Title:</td>
        <td className="p-2 border border-black uppercase">{employeeData?.userPosition || '-'}</td>
        <td className="p-2 border border-black bg-zinc-50 font-bold">Department:</td>
        <td className="p-2 border border-black uppercase">{employeeData?.userDept || '-'}</td>
      </tr>
      <tr>
        <td className="p-2 border border-black bg-zinc-50 font-bold">HOD / Supervisor:</td>
        <td className="p-2 border border-black uppercase">{employeeData?.hod || '-'}</td>
        <td className="p-2 border border-black bg-zinc-50 font-bold">Date of Hire:</td>
        <td className="p-2 border border-black">
          {employeeData?.joinDate ? new Date(employeeData.joinDate).toLocaleDateString('en-GB') : '-'}
        </td>
      </tr>
      <tr>
        <td className="p-2 border border-black bg-zinc-50 font-bold">Last Employment Date:</td>
        <td colSpan={3} className="p-2 border border-black uppercase">{todayDate}</td>
      </tr>
    </tbody>
  </table>
</section>

{/* 2. Asset List Section - Hanya tunjuk asset yang ada sahaja */}
<section className="mb-10">
  <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2">
    <span className="bg-black text-white px-2 py-0.5 text-xs">2</span> List of Company Assets Returned
  </h3>
  <table className="w-full border-collapse border border-black text-[11px]">
    <thead>
      <tr className="bg-zinc-100 border-b-2 border-black">
        <th className="p-3 border border-black text-left">Asset Description (Category / Model)</th>
        <th className="p-3 border border-black text-center w-1/3">Asset ID / Serial Number</th>
      </tr>
    </thead>
    <tbody>
      {userAssets.map((asset, index) => (
        <tr key={index} className="h-12 border-b border-zinc-300">
          <td className="p-3 border border-black">
            <p className="font-black uppercase leading-none text-[12px]">{asset.category}</p>
            <p className="text-[9px] text-zinc-600 mt-1">{asset.model}</p>
          </td>
          <td className="p-3 border border-black text-center font-mono">
            <span className="font-black text-sm block tracking-wider">{asset.it_tagging}</span>
            <span className="text-[9px] text-zinc-500 italic uppercase">S/N: {asset.serial_number}</span>
          </td>
        </tr>
      ))}
      {/* Table blank dah dibuang, table akan auto-cut kat sini */}
    </tbody>
  </table>
</section>

        {/* 3. Acknowledgement & Signature */}
        <section className="mt-8">
          <h3 className="font-black uppercase text-[10px] mb-2 border-b border-black w-fit">3. Confirmation of Receipt</h3>
          <div className="text-[10px] leading-relaxed mb-12 italic text-zinc-700">
            I, hereby confirm that I have returned all company property issued to me during my employment, as listed above. I understand that failure to return any company assets may result in a deduction from my final pay check, as per company policy, or further legal action
          </div>

          <div className="grid grid-cols-2 gap-20">
            {/* Employee Side */}
            <div className="space-y-4">
              <p className="font-bold text-[10px] uppercase underline">Employee Signature:</p>
              <div className="h-20 w-full border-b-2 border-dotted border-black"></div>
              <div className="text-[11px]">
                <p>Name: <span className="font-black uppercase ml-1">{userName}</span></p>
                <p className="mt-1">Date: <span className="font-bold ml-2 underline">{todayDate}</span></p>
              </div>
            </div>

            {/* IT Manager Side */}
            <div className="space-y-4">
              <p className="font-bold text-[10px] uppercase underline">Verified by (IT Department):</p>
              <div className="h-20 w-full border-b-2 border-dotted border-black"></div>
              <div className="text-[11px]">
                <p>Name: </p>
                <p className="mt-1">Date: </p>
              </div>
            </div>
          </div>
        </section>
{/* Footer Internal - Guna absolute di dalam container untuk lock kedudukan */}
<div className="absolute bottom-[15mm] left-[15mm] right-[15mm] pt-4 border-t border-zinc-200 flex justify-between text-[8px] font-mono text-zinc-400 uppercase tracking-[0.2em] print:bottom-[10mm]">
  <p>CONFIDENTIAL • ACTMAX ASSET MANAGEMENT SYSTEM</p>
  <p>Form ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
</div>

        <button 
          onClick={() => window.print()}
          className="fixed bottom-10 right-10 bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest print:hidden shadow-2xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 012-2H5a2 2 0 012 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Print Report
        </button>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { background: white !important; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function UserReportPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono uppercase tracking-widest">Loading report...</div>}>
      <UserReturnContent />
    </Suspense>
  );
}