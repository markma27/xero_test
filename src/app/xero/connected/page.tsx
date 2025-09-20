"use client";
import { useEffect, useState } from "react";

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
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      
      {data && (
        <div>
          <h2>Connection Information:</h2>
          {data.success ? (
            <div>
              <h3>✅ Connection Successful!</h3>
              <p><strong>Tenant ID:</strong> {data.tenantId}</p>
              
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
                    </div>
                  ))}
                </div>
              )}
              
              {data.organisation && (
                <div>
                  <h3>🏢 Organization Details:</h3>
                  {data.organisation.error ? (
                    <div style={{ color: "orange", padding: "10px", background: "#fff3cd", borderRadius: "5px" }}>
                      <p><strong>⚠️ Failed to fetch organization information:</strong></p>
                      <p>Error: {data.organisation.message}</p>
                      <p>Status Code: {data.organisation.error}</p>
                      <p><em>This might be due to missing Accounting scope permissions</em></p>
                    </div>
                  ) : (
                    <div>
                      {data.organisation.organisations?.map((org: any, index: number) => (
                        <div key={index} style={{ 
                          border: "1px solid #28a745", 
                          padding: "15px", 
                          margin: "10px 0", 
                          borderRadius: "5px",
                          background: "#d4edda"
                        }}>
                          <h4>🏢 {org.name}</h4>
                          <p><strong>Legal Name:</strong> {org.legalName}</p>
                          <p><strong>Country:</strong> {org.countryCode}</p>
                          <p><strong>Currency:</strong> {org.baseCurrency}</p>
                          <p><strong>Status:</strong> {org.organisationStatus}</p>
                          <p><strong>Demo Company:</strong> {org.isDemoCompany ? "Yes" : "No"}</p>
                          {org.email && <p><strong>Email:</strong> {org.email}</p>}
                          {org.website && <p><strong>Website:</strong> {org.website}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
