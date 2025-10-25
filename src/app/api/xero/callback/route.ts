import { NextRequest, NextResponse } from "next/server";
import { newXeroClient, saveTokenSet, fetchConnections } from "@/lib/xero";

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
    
    // XPM-only: resolve connections via /connections endpoint (no Accounting)
    const connections = await fetchConnections(tokenSet.access_token!);
    console.log("Connections found:", Array.isArray(connections) ? connections.length : 0);
    const tenantId = Array.isArray(connections) ? connections[0]?.tenantId : undefined;
    
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
    
    // Persist token for ALL connections
    for (const c of connections || []) {
      if (c?.tenantId) await saveTokenSet(c.tenantId, tokenSet);
    }
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/xpm/connected?tenantId=${tenantId}`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.json({ 
      error: "OAuth callback failed", 
      message: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
