import { NextResponse } from "next/server";
import { newXeroClient } from "@/lib/xero";

export async function GET() {
  const xero = newXeroClient();
  const url = await xero.buildConsentUrl();
  return NextResponse.redirect(url);
}
