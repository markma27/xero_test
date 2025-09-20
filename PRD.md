# PRD – Xero OAuth Prototype (Supabase + xero-node SDK)

## 1. Objective
Deliver a minimal, verifiable **Xero OAuth 2.0 prototype** to satisfy Xero’s prerequisite for enabling the **Practice Manager (`practicemanager`)** scope. The prototype must:
- Complete OAuth with a Xero organisation (Demo or trial is acceptable) using the **official `xero-node` SDK**.
- Persist the SDK token set securely in **Supabase** (encrypted at rest).
- Successfully call:
  - Connections (via SDK `updateTenants()`), and
  - Accounting API `getOrganisations(tenantId)`.

## 2. Users
- Internal developer/tester validating OAuth and API connectivity.

## 3. Scopes (prototype)
- `openid profile email offline_access`
- (Optional) add minimal Accounting read scope to call Organisations.
- After approval from Xero, add: `practicemanager`.

## 4. Tech Stack
- **Next.js** (App Router, TypeScript)
- **xero-node** (official Xero SDK) for OAuth and API calls
- **Supabase Postgres** for token storage (`@supabase/supabase-js` with Service Role on server)
- **Node crypto** (AES-256-GCM) for encrypting the token set

## 5. Data Model (Supabase)
- `xero_tokens`
  - `tenant_id` (text, unique)
  - `token_set_enc` (text, encrypted JSON from `xero-node`)
  - `expires_at` (timestamptz)
  - `created_at`, `updated_at`
- RLS enabled; Service Role only on server.

## 6. Flows
### 6.1 Connect
1. Build consent URL via `xero-node`.
2. Callback handled via `xeroClient.apiCallback()`.
3. `xeroClient.updateTenants()` to obtain `tenantId`.
4. Store encrypted token set keyed by `tenantId`.

### 6.2 Demo calls
- `xeroClient.tenants` (connections)  
- `xeroClient.accountingApi.getOrganisations(tenantId)`  
- Refresh tokens via `xeroClient.refreshToken()` when near expiry; upsert to Supabase.

## 7. Security
- Token set encrypted at rest (AES-256-GCM).
- Service Role key never sent to browser.
- TLS in transit; secrets via server env.
- No tokens or PII in logs.

## 8. Deliverables
- Working Next.js app with:
  - `/api/xero/connect`, `/api/xero/callback`
  - `/api/xero/demo` using **xero-node**
  - `/xero/connected` page rendering results
- Supabase table `xero_tokens` created and used.
- README with setup steps and scopes.

## 9. Acceptance Criteria
- Connect to a Xero org and land on `/xero/connected?tenantId=...`.
- `/api/xero/demo` returns connections and organisation JSON.
- Tokens saved encrypted; automatic refresh works.
- No client-side use of Service Role key.

## 10. Next Steps (post-approval)
- Add `practicemanager` scope; reconnect to an **XPM-enabled** org.
- Begin XPM ETL (raw → normalized → marts) and dashboards.
- Extend schema to multi-tenant with `tenant_id` on all rows and RLS.
