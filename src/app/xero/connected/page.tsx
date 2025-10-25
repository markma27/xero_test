"use client";
import { useEffect, useMemo, useState } from "react";
import Chart from "chart.js/auto";

interface ConnectedProps {
  searchParams: { tenantId?: string };
}

export default function Connected({ searchParams }: ConnectedProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const tid = searchParams.tenantId;
  
  useEffect(() => {
    if (tid) {
      fetch(`/api/xero/demo?tenantId=${tid}`)
        .then(r => r.json())
        .then(result => {
          if (result.error) {
            setError(`API Error: ${result.error}${result.message ? ` - ${result.message}` : ''}`);
          } else {
            setData(result);
          }
          setLoading(false);
        })
        .catch(err => {
          setError(`Network Error: ${err.message}`);
          setLoading(false);
        });
    } else {
      setError("No tenant ID provided");
      setLoading(false);
    }
  }, [tid]);
  
  return (
    <main style={{ padding: 24 }}>
      <h1>Connected to Xero</h1>
      <p>TenantId: <b>{tid}</b></p>
      
      {/* XPM invoices query form */}
      {tid && (
        <section style={{ margin: "16px 0", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>XPM Invoices – Date Range</h2>
          <XpmInvoicesForm tenantId={tid} />
        </section>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      
      {data && (
        <div>
          <h2>Connection Information:</h2>
          {data.success ? (
            <div>
              <h3>✅ Connection Successful!</h3>
              <p><strong>Tenant ID:</strong> {data.tenantId}</p>
              
              <div style={{ 
                background: "#d1ecf1", 
                border: "1px solid #bee5eb", 
                padding: "15px", 
                borderRadius: "5px", 
                margin: "10px 0" 
              }}>
                <h4>🎯 XPM API Integration Verified</h4>
                <p><strong>✅ OAuth 2.0 Flow:</strong> Successfully completed</p>
                <p><strong>✅ Practicemanager scope:</strong> Granted</p>
                <p><strong>✅ XPM endpoints:</strong> Ready to query (Invoices, Clients, Jobs)</p>
              </div>
              
              {data.connections && data.connections.length > 0 && (
                <div>
                  <h3>📋 Connected Organizations:</h3>
                  {data.connections.map((conn: any, index: number) => (
                    <div key={index} style={{ 
                      border: "1px solid #ddd", 
                      padding: "10px", 
                      margin: "10px 0", 
                      borderRadius: "5px" 
                    }}>
                      <p><strong>Name:</strong> {conn.tenantName}</p>
                      <p><strong>Type:</strong> {conn.tenantType}</p>
                      <p><strong>ID:</strong> {conn.tenantId}</p>
                      <a href={`/xero/connected?tenantId=${conn.tenantId}`} style={{
                        display: "inline-block",
                        marginTop: 8,
                        padding: "6px 10px",
                        border: "1px solid #0b7285",
                        color: "#0b7285",
                        borderRadius: 6,
                        textDecoration: "none"
                      }}>Use this tenant</a>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Removed Accounting org section for XPM-only app */}
            </div>
          ) : (
            <div style={{ color: "red" }}>
              <h3>❌ Connection Failed</h3>
              <p>{data.error}</p>
            </div>
          )}
          
          <details style={{ marginTop: "20px" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>🔍 Raw API Response (Debug)</summary>
            <pre style={{ 
              background: "#f6f8fa", 
              padding: 16, 
              borderRadius: 8,
              overflow: "auto",
              maxHeight: "500px",
              marginTop: "10px"
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}

function XpmInvoicesForm({ tenantId }: { tenantId: string }) {
  const [from, setFrom] = useState<string>(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch(`/api/xpm/invoices?tenantId=${tenantId}&from=${from}&to=${to}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) setError(json.error || `HTTP ${res.status}`);
    else setResult(json);
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label>
          <div>From</div>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label>
          <div>To</div>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <button type="submit" disabled={loading} style={{ padding: "6px 10px" }}>
          {loading ? "Loading..." : "Fetch Invoices"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {/* Monthly totals bar chart */}
      {result && (() => {
        const invoices = Array.isArray(result?.data) ? result.data : (result?.data?.invoices || []);
        if (!invoices?.length) return null;
        // Build month buckets dynamically from selected range (inclusive)
        const labels: string[] = [];
        const start = new Date(`${from}T00:00:00Z`);
        const end = new Date(`${to}T00:00:00Z`);
        const startYM = { y: start.getUTCFullYear(), m: start.getUTCMonth() };
        const endYM = { y: end.getUTCFullYear(), m: end.getUTCMonth() };
        let y = startYM.y, m = startYM.m;
        while (y < endYM.y || (y === endYM.y && m <= endYM.m)) {
          labels.push(`${y}-${String(m + 1).padStart(2, "0")}`);
          m += 1;
          if (m > 11) { m = 0; y += 1; }
        }
        const totals = new Array(labels.length).fill(0);
        for (const inv of invoices) {
          const date = inv?.date ? new Date(inv.date) : null;
          if (!date || isNaN(date.getTime())) continue;
          const y = date.getUTCFullYear();
          const m = date.getUTCMonth(); // 0-11
          const key = `${y}-${String(m + 1).padStart(2, "0")}`;
          const idx = labels.indexOf(key);
          if (idx >= 0) {
            const amt = Number(inv?.amount ?? 0);
            if (!Number.isNaN(amt)) totals[idx] += amt;
          }
        }
        // Render simple canvas
        return (
          <div style={{ marginTop: 16 }}>
            <h4>Monthly totals (excl tax)</h4>
            <BarChart labels={labels} data={totals} />
          </div>
        );
      })()}
      {/* Table view for invoices */}
      {result && (() => {
        const invoices = Array.isArray(result?.data)
          ? result.data
          : (result?.data?.invoices || []);
        if (!Array.isArray(invoices) || invoices.length === 0) return null;
        const currency = (v: any) => {
          const n = Number(v ?? 0);
          return isNaN(n) ? String(v ?? "") : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        const dateFmt = (s: any) => {
          if (!s) return "";
          const d = new Date(s);
          return isNaN(d.getTime()) ? String(s) : d.toISOString().slice(0, 10);
        };
        return (
          <div style={{ marginTop: 12 }}>
            <h4>Invoices</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "6px" }}>Date</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "6px" }}>Invoice #</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "6px" }}>Client</th>
                    <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "6px" }}>Amount (excl tax)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={inv.id || idx}>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{dateFmt(inv.date)}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{inv.id || ""}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px" }}>{inv.clientName || ""}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "6px", textAlign: "right" }}>{currency(inv.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
      {result && (
        <details open style={{ marginTop: 12 }}>
          <summary>Invoices Response</summary>
          <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 6, overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function BarChart({ labels, data }: { labels: string[]; data: number[] }) {
  const canvasId = useMemo(() => `chart_${Math.random().toString(36).slice(2)}`, []);
  useEffect(() => {
    const ctx = (document.getElementById(canvasId) as HTMLCanvasElement)?.getContext("2d");
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Total (excl tax)",
          data,
          backgroundColor: "#0b7285",
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Month (YYYY-MM)" } },
          y: { title: { display: true, text: "Amount (excl tax)" } },
        },
        plugins: { legend: { display: false } },
      }
    });
    return () => chart.destroy();
  }, [labels, data, canvasId]);
  return <canvas id={canvasId} />;
}
