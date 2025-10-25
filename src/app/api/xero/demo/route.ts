import { NextRequest, NextResponse } from "next/server";
import { getClientWithTokens, fetchConnections } from "@/lib/xero";

export async function GET(req: NextRequest) {
  const tenantId = new URL(req.url).searchParams.get("tenantId")!;
  
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  
  try {
    const { tokenSet, tenantId: tid } = await getClientWithTokens(tenantId);
    const connections = await fetchConnections(tokenSet.access_token!);
    return NextResponse.json({ connections, tenantId: tid, success: true });
  } catch (error: any) {
    console.error("Demo API error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch data",
      details: error.toString()
    }, { status: 500 });
  }
}
