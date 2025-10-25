import { XeroClient, TokenSet } from "xero-node";
import { supabaseAdmin } from "./supabaseAdmin";
import { encrypt, decrypt } from "./crypto";

export function newXeroClient() {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: [
      "openid",
      "profile",
      "email",
      "offline_access",
      "practicemanager"
    ], // XPM only
  });
}

// Some tenants/apps cannot mix Accounting and XPM scopes in a single auth.
// Provide an XPM-only client to avoid invalid scope combinations.
export function newXpmOnlyClient() {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: [
      "openid",
      "profile",
      "email",
      "offline_access",
      "practicemanager"
    ],
  });
}

export async function saveTokenSet(tenantId: string, tokenSet: TokenSet) {
  const tokenJson = JSON.stringify(tokenSet);
  const expiresAt = tokenSet.expires_at
    ? new Date(tokenSet.expires_at * 1000).toISOString()
    : new Date(Date.now() + 3600_000).toISOString();
  
  const { error } = await supabaseAdmin.from("xero_tokens").upsert({
    tenant_id: tenantId,
    token_set_enc: encrypt(tokenJson),
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id" });
  
  if (error) throw new Error(error.message);
}

async function loadTokenSet(tenantId: string): Promise<TokenSet> {
  const { data, error } = await supabaseAdmin
    .from("xero_tokens")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();
    
  if (error || !data) throw new Error("No token for tenant");
  return JSON.parse(decrypt(data.token_set_enc));
}

export async function getClientWithTokens(tenantId: string) {
  const xero = newXeroClient();
  const tokenSet = await loadTokenSet(tenantId);
  xero.setTokenSet(tokenSet);

  // refresh if needed (without using Accounting APIs)
  const exp = tokenSet.expires_at ? tokenSet.expires_at * 1000 : 0;
  if (exp && exp < Date.now() + 60_000) {
    const refreshed = await xero.refreshToken();
    await saveTokenSet(tenantId, refreshed);
    return { xero, tenantId, tokenSet: refreshed };
  }

  return { xero, tenantId, tokenSet };
}

// Fetch connections without touching Accounting endpoints
export async function fetchConnections(accessToken: string) {
  const res = await fetch("https://api.xero.com/connections", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`connections failed: HTTP ${res.status}`);
  return await res.json();
}
