import { NextRequest, NextResponse } from "next/server";
import { getClientWithTokens } from "@/lib/xero";

// XPM invoices by date range
// GET /api/xpm/invoices?tenantId=...&from=2025-01-01&to=2025-01-31
// Dates are ISO (YYYY-MM-DD). XPM expects RFC3339 timestamps; we append time boundaries.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  if (!from || !to) return NextResponse.json({ error: "from and to (YYYY-MM-DD) are required" }, { status: 400 });

  try {
    const { tenantId: tid, tokenSet } = await getClientWithTokens(tenantId);
    const accessToken = tokenSet.access_token!;

    // Prefer XPM v3 (WorkflowMax-style) invoice.api/list with yyyymmdd
    const yyyymmdd = (d: string) => d.split("-").join("");
    const f = yyyymmdd(from);
    const t = yyyymmdd(to);
    const attempts = [
      // v3 primary
      `https://api.xero.com/practicemanager/3.0/invoice.api/list?from=${f}&to=${t}`,
      `https://api.xero.com/practicemanager/3.0/invoice.api/list?from=${f}&to=${t}&detailed=true`,
      // v3 alias under /api/v3
      `https://api.xero.com/api/v3/invoice.api/list?from=${f}&to=${t}`,
      // v2 fallbacks (some tenants)
      `https://api.xero.com/practicemanager/2.0/invoices?invoicedDateFrom=${from}&invoicedDateTo=${to}&pageSize=200&page=1`,
      `https://api.xero.com/practicemanager/2.0/invoices`
    ];

    let lastStatus = 0;
    let lastData: any = null;
    let lastText = "";
    let usedEndpoint = attempts[0];
    for (const ep of attempts) {
      const r = await fetch(ep, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "xero-tenant-id": tid,
          Accept: "application/xml, application/json;q=0.9, */*;q=0.8",
        },
      });
      lastStatus = r.status;
      usedEndpoint = ep;
      const text = await r.text();
      lastText = text;
      // try JSON first, else XML → parse minimally
      try { lastData = JSON.parse(text); }
      catch {
        lastData = { raw: text };
        if (text && text.trim().startsWith('<')) {
          // minimal XML extraction for invoice list
          const invoices: any[] = [];
          const invBlocks = text.split(/<Invoice>/g).slice(1).map(s => s.split(/<\/Invoice>/)[0]);
          for (const block of invBlocks) {
            const pick = (tag: string) => {
              const open = `<${tag}>`;
              const close = `</${tag}>`;
              const i = block.indexOf(open);
              if (i === -1) return undefined;
              const j = block.indexOf(close, i + open.length);
              if (j === -1) return undefined;
              return block.substring(i + open.length, j).replace(/\r?\n/g, '\n').trim();
            };
            const clientName = (() => {
              const m = block.match(/<Client>[\s\S]*?<Name>([\s\S]*?)<\/Name>[\s\S]*?<\/Client>/);
              return m ? m[1].trim() : undefined;
            })();
            invoices.push({
              id: pick('ID'),
              internalId: pick('InternalID'),
              type: pick('Type'),
              jobText: pick('JobText'),
              description: pick('Description'),
              date: pick('Date'),
              dueDate: pick('DueDate'),
              amount: pick('Amount'),
              amountTax: pick('AmountTax'),
              amountIncludingTax: pick('AmountIncludingTax'),
              amountPaid: pick('AmountPaid'),
              amountOutstanding: pick('AmountOutstanding'),
              status: pick('Status'),
              clientName,
            });
          }
          lastData = { raw: text, invoices };
        }
      }
      if (r.status >= 200 && r.status < 300) break; // success
      if (r.status === 404) continue; // try next
      // for 5xx or others, try next strategy; keep lastText
      continue;
    }

    // If the last attempt returned a list, optionally filter locally by date range
    let dataOut = lastData;
    if (Array.isArray(lastData) && from && to) {
      const fromDt = new Date(`${from}T00:00:00Z`).getTime();
      const toDt = new Date(`${to}T23:59:59Z`).getTime();
      dataOut = lastData.filter((inv: any) => {
        const d = inv?.invoicedDate || inv?.date || inv?.createdDate || inv?.invoiceddate;
        const t = d ? new Date(d).getTime() : NaN;
        return !Number.isNaN(t) && t >= fromDt && t <= toDt;
      });
    }

    return NextResponse.json({ status: lastStatus, endpointTried: usedEndpoint, count: Array.isArray(dataOut) ? dataOut.length : undefined, data: dataOut, errorBody: !Array.isArray(dataOut) && typeof dataOut !== 'object' ? lastText : undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch XPM invoices" });
  }
}


