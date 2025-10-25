export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>XPM Dashboard – Xero OAuth Prototype (SDK)</h1>
      <a 
        href="/api/xero/connect" 
        style={{ 
          display: "inline-block", 
          padding: "10px 14px", 
          border: "1px solid #222", 
          borderRadius: 8,
          textDecoration: "none",
          color: "#222",
          backgroundColor: "#f8f9fa"
        }}
      >
        Connect to Xero
      </a>
      <span style={{ display: "inline-block", width: 12 }} />
      <a 
        href="/api/xpm/connect" 
        style={{ 
          display: "inline-block", 
          padding: "10px 14px", 
          border: "1px solid #0b7285", 
          borderRadius: 8,
          textDecoration: "none",
          color: "#0b7285",
          backgroundColor: "#e3fafc"
        }}
      >
        Connect XPM only
      </a>
    </main>
  );
}
