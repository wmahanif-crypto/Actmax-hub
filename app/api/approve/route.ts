// app/api/approve/route.ts
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action'); // 'approve' atau 'reject'
  
  if (!id || !action) return NextResponse.json({ error: 'Invalid Request' });

  const isApproved = action === 'approve';
  const newStatus = action === 'approve' ? 'PENDING_ADMIN' : 'REJECTED';


  
  // Update status kat Supabase
  const { error } = await supabase
    .from('Ticket')
    .update({ 
        status: newStatus,
        FirstApprovalAt: new Date().toISOString(),
        FirstApproval: isApproved ? true : false
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message });

// Tunjuk page simple kat Bos yang proses dah selesai
  return new NextResponse(`
    <html>
      <body style="background: #09090b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0;">
        <div style="text-align: center; border: 1px solid #27272a; padding: 40px; border-radius: 24px; background: #18181b; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="font-size: 50px; margin-bottom: 20px;">
            ${isApproved ? '✅' : '❌'}
          </div>
          <h1 style="color: ${isApproved ? '#10b981' : '#ef4444'}; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
            Ticket ${action}d
          </h1>
          <p style="color: #a1a1aa; margin-top: 15px;">Ticket <b>#${id}</b> has been updated to <b>${newStatus}</b>.</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;">
          <p style="color: #52525b; font-size: 12px;">Action completed on ${new Date().toLocaleString()}</p>
          <p style="color: #71717a; font-size: 11px; margin-top: 10px;">You can close this browser tab safely.</p>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}