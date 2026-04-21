// app/api/inventory/update/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Data diterima dari PowerShell:", data); // Lihat ni di terminal VS Code

    // Pastikan data penting ada
    if (!data.pcName) {
      return NextResponse.json({ error: "pcName is missing" }, { status: 400 });
    }

    const { data: result, error } = await supabase
      .from('pc_laptop')
      .upsert({
        it_tagging: data.pcName,
        serialnumber: data.serialNumber || 'N/A',
        cpu: data.cpu || 'N/A',
        ram: data.ram || 'N/A',
        os: data.os || 'N/A',
        last_user: data.lastUser || 'N/A',
        software_list: data.software || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'it_tagging' });

    if (error) {
      console.error("Supabase Database Error:", error); // Ralat sebenar akan keluar di sini
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Inventory Updated", result });
  } catch (error: any) {
    console.error("Critical API Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}