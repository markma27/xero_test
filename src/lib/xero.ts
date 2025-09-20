import { XeroClient, TokenSet } from "xero-node";
import { supabaseAdmin } from "./supabaseAdmin";
import { encrypt, decrypt } from "./crypto";

export function newXeroClient() {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: ["openid", "profile", "email", "offline_access", "accounting.settings"], // add 'practicemanager' after approval
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
  
  // refresh if needed
  const exp = tokenSet.expires_at ? tokenSet.expires_at * 1000 : 0;
  if (exp && exp < Date.now() + 60_000) {
    const refreshed = await xero.refreshToken();
    const tenants = await xero.updateTenants();
    const tid = tenants?.[0]?.tenantId || tenantId;
    await saveTokenSet(tid, refreshed);
    return { xero, tenantId: tid };
  }
  
  const tenants = await xero.updateTenants();
  return { xero, tenantId: tenants?.[0]?.tenantId || tenantId };
}
