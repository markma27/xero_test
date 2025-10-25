import { NextResponse } from "next/server";
import { newXpmOnlyClient } from "@/lib/xero";

// Start XPM-only consent to avoid mixed-scope incompatibility
export async function GET() {
  const xero = newXpmOnlyClient();
  const url = await xero.buildConsentUrl();
  return NextResponse.redirect(url);
}


