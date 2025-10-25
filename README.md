# Xero OAuth 2.0 Prototype

A Xero OAuth 2.0 prototype built with Next.js, xero-node SDK, and Supabase to meet Xero's Practice Manager scope application requirements.

## Features

- ✅ Xero OAuth 2.0 authentication flow (using xero-node SDK)
- ✅ Encrypted token storage (AES-256-GCM)
- ✅ Supabase database integration
- ✅ Automatic token refresh
- ✅ Connection management (via updateTenants())
  

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **xero-node** (Official Xero SDK)
- **Supabase** (PostgreSQL + encrypted storage)
- **Node.js crypto** (AES-256-GCM encryption)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables Configuration

Copy `env.example` to `.env.local` and fill in your configuration:

```bash
cp env.example .env.local
```

Required variables:
- `XERO_CLIENT_ID`: Your Xero application client ID
- `XERO_CLIENT_SECRET`: Your Xero application client secret
- `XERO_REDIRECT_URI`: Callback URL (http://localhost:3000/api/xero/callback)
- `XERO_TOKEN_ENC_KEY`: 32-byte Base64 encryption key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set up Supabase Database

Run the SQL statements in `supabase-schema.sql` file in the Supabase SQL editor.

### 5. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 to get started.

## Usage Flow

1. Click "Connect to Xero" button
2. Complete Xero OAuth authentication
3. System automatically saves encrypted tokens to Supabase
4. View connection information and organization data

## API Endpoints

- `GET /api/xero/connect` - Start OAuth flow (XPM-only scopes)
- `GET /api/xpm/connect` - Explicit XPM-only consent
- `GET /api/xero/callback` - OAuth callback handling
- `GET /api/xero/demo?tenantId=xxx` - Get connections via /connections
- `GET /api/xpm/invoices?tenantId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD` - XPM invoices

## Security Features

- 🔒 Tokens encrypted and stored in Supabase
- 🔒 Service role key used only on server-side
- 🔒 Automatic token refresh
- 🔒 Row-level security policies

## Project Structure

```
src/
├── app/
│   ├── api/xero/
│   │   ├── connect/route.ts      # OAuth connection endpoint
│   │   ├── callback/route.ts     # OAuth callback handling
│   │   └── demo/route.ts         # Demo API
│   ├── xero/connected/
│   │   └── page.tsx              # Connection success page
│   └── page.tsx                  # Main page
└── lib/
    ├── crypto.ts                 # Encryption utilities
    ├── supabaseAdmin.ts          # Supabase admin client
    └── xero.ts                   # Xero client and token management
```

## Important Notes

- Ensure your Xero application has the correct redirect URI configured
- Current base scopes: `openid profile email offline_access accounting.settings`
- After Practice Manager scope approval, add `practicemanager` scope
- All sensitive information managed through environment variables

## Troubleshooting

1. **Encryption key error**: Ensure `XERO_TOKEN_ENC_KEY` is a 32-byte Base64 string
2. **Supabase connection failed**: Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. **Xero authentication failed**: Verify `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, and `XERO_REDIRECT_URI`
