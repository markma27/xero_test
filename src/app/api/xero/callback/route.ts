import { NextRequest, NextResponse } from "next/server";
import { newXeroClient, saveTokenSet } from "@/lib/xero";

export async function GET(req: NextRequest) {
  try {
    const xero = newXeroClient();
    const tokenSet = await xero.apiCallback(req.url);
    
    console.log("Token set received:", {
      access_token: tokenSet.access_token ? "present" : "missing",
      refresh_token: tokenSet.refresh_token ? "present" : "missing",
      expires_at: tokenSet.expires_at,
      scopes: tokenSet.scope
    });
    
    // Load tenants (this is effectively connections)
    const tenants = await xero.updateTenants();
    console.log("Tenants found:", tenants?.length || 0);
    console.log("Tenants data:", tenants);
    
    const tenantId = tenants?.[0]?.tenantId;
    
    if (!tenantId) {
      console.error("No tenant found. Available tenants:", tenants);
      return NextResponse.json({ 
        error: "No tenant connection", 
        debug: {
          tenantsCount: tenants?.length || 0,
          tenants: tenants,
          tokenScopes: tokenSet.scope
        }
      }, { status: 400 });
    }
    
    await saveTokenSet(tenantId, tokenSet);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/xero/connected?tenantId=${tenantId}`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ 
      error: "OAuth callback failed", 
      message: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
