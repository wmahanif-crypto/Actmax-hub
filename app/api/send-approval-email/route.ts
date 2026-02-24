import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Data got recieve by client:", body); // TAMBAH NI
    
    const { ticketId, requestorName, subject, description, approverEmail, category } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Lebih senang, nodemailer dah tahu setting dia
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.40.46:3000';
    const isIncident = category === 'INCIDENT';

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: #ef4444;">ACTMAX IT SYSTEM</h2>
        <p>New <b>${category}</b> ticket from <b>${requestorName}</b></p>
        
        <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p><b>Issue:</b> ${subject}</p>
          <p><b>Details:</b> ${description}</p>
        </div>

        ${isIncident ? `
          <a href="${baseUrl}/it-ticketing" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            VIEW INCIDENT
          </a>
        ` : `
          <div style="display: flex; gap: 10px;">
            <a href="${baseUrl}/api/approve?id=${ticketId}&action=approve" style="background: #16a34a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">APPROVE</a>
            <a href="${baseUrl}/api/approve?id=${ticketId}&action=reject" style="background: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-left: 10px;">REJECT</a>
          </div>
        `}
      </div>
    `;

    await transporter.sendMail({
      from: `"Actmax IT Notifier" <${process.env.EMAIL_USER}>`,
      to: approverEmail,
      subject: `[${category}] Approval Required: ${subject}`,
      html: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Nodemailer Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Untuk testing direct dari browser
export async function GET() {
    return new Response("API Email is running. Use POST to send emails.");
}