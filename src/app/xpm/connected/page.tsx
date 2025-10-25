"use client";
import { useEffect, useState } from "react";

export default function XpmConnected({ searchParams }: { searchParams: { tenantId?: string } }) {
  const tid = searchParams.tenantId;
  const [ok, setOk] = useState<boolean>(false);
  useEffect(() => { if (tid) setOk(true); }, [tid]);
  return (
    <main style={{ padding: 24 }}>
      <h1>XPM Connected</h1>
      <p>TenantId: <b>{tid}</b></p>
      <p>{ok ? "You can now query XPM endpoints (Invoices/Clients/Jobs)." : "Missing tenantId"}</p>
      <p>Go back to Connected page to run queries: <a href={`/xero/connected?tenantId=${tid}`}>Open dashboard</a></p>
    </main>
  );
}


