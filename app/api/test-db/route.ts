import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from('Ticket')
    .insert([
      {
        subject: "Test Supabase Success",
        specificProblem: "ID Automatik",
        description: "Sekarang ID dah tak perlu hantar manual",
        category: "SERVICE",
        dueDate: new Date(new Date().getTime() + 86400000).toISOString(),
        userId: "user_123",
        userName: "Actmax User",
        userDept: "IT"
      },
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Settle! Data dah masuk.", data });
}