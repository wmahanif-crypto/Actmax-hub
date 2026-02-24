"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CapacitorHttp } from '@capacitor/core';    

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

// NOTE: server-only middleware (express/cors) removed — this is a client component.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

       try {
      // 1. Check LDAP Authentication (AD Login) menggunakan CapacitorHttp
const response = await CapacitorHttp.post({
  url: 'http://192.168.40.23:3000/api/auth/ldap/',
  headers: { 'Content-Type': 'application/json' },
  data: { username, password },
});

      // CapacitorHttp menyimpan status code dalam 'status' dan data dalam 'data'
      if (response.status !== 200 && response.status !== 201) {
        setStatusMessage({ 
          type: 'error', 
          text: `LDAP service error: ${response.status}` 
        });
        return;
      }

      const result = response.data; // Response JSON terus ada di sini

      if (result && result.success) {
        // 2. Tarik info tambahan dari table Employees dkt Supabase guna userLoginID
        const { data: emp, error: dbError } = await supabase
          .from('Employees')
          .select('userName, userRole, userDept')
          .eq('userLoginID', username)
          .single();

        if (dbError || !emp) {
          setStatusMessage({
            type: 'error',
            text: dbError?.message || 'AD Login succeeded, but profile not found in Portal Database.',
          });
          return;
        }

        // 3. Simpan data dlm localStorage
        localStorage.setItem('userLoginID', username);
        localStorage.setItem('userName', emp.userName);
        localStorage.setItem('userRole', emp.userRole);
        localStorage.setItem('userDept', emp.userDept);

        // 4. Redirect ke HomePage
        router.push('/');
        
      } else {
        setStatusMessage({
          type: 'error',
          text: (result && result.message) || 'Invalid AD credentials.',
        });
      }
    } catch (error) {
      // Jika masih error, ia akan masuk ke sini
      console.error('Login Error:', error);
      setStatusMessage({
        type: 'error',
        text: 'Connection failed. Please check your network or server firewall.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-10 shadow-2xl">
        
        <div className="flex flex-col items-center mb-10">
          <Image src="/Actmax_Logo.png" alt="Actmax Logo" width={200} height={60} className="object-contain" />
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] mt-4">Internal IT Portal</p>
        </div>

        {statusMessage.text && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold border ${
            statusMessage.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1">Username ID</label>
            <input 
              required type="text" placeholder="e.g. administrator"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-red-600 text-white"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1">Password</label>
            <input 
              required type="password" placeholder="••••••••"
              className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-red-600 text-white"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest mt-4"
          >
            {isSubmitting ? 'Verifying Identity...' : 'Authorize Access'}
          </button>
        </form>
      </div>
    </div>
  );
}