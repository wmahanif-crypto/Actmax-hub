import { NextResponse } from 'next/server';
import ldap from 'ldapjs';

// 1. Tambah fungsi OPTIONS untuk handle preflight request dari Android/Capacitor
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  // Setup headers common untuk semua response
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { username, password } = await request.json();

    const client = ldap.createClient({
      url: 'ldap://192.168.1.100' // Pastikan IP Server AD ini boleh diakses oleh server Next.js anda
    });

    return new Promise<NextResponse>((resolve) => {
      const userPrincipalName = `${username}@actmax.local`; 

      client.bind(userPrincipalName, password, (err) => {
        if (err) {
          client.unbind();
          resolve(NextResponse.json(
            { success: false, message: "Login failed" }, 
            { status: 401, headers: corsHeaders } // Tambah headers di sini
          ));
        } else {
          client.unbind();

          let userRole = 'STAFF'; 

          resolve(NextResponse.json({ 
            success: true, 
            message: "Login successful",
            user: {
              name: username,          
              userLoginID: username,   
              role: userRole          
            }
          }, { status: 200, headers: corsHeaders })); // Tambah headers di sini
        }
      });
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}