# Xero OAuth Prototype Installation Script
# Run in PowerShell: .\install.ps1

Write-Host "🚀 Starting Xero OAuth prototype installation..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Please install Node.js first: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Install dependencies
Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow
pnpm install

# Create environment variables file
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creating environment variables file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "✅ Created .env.local file, please fill in your configuration" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local file already exists" -ForegroundColor Green
}

# Generate encryption key
Write-Host "🔑 Generating encryption key..." -ForegroundColor Yellow
$encKey = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
Write-Host "Generated encryption key: $encKey" -ForegroundColor Cyan
Write-Host "Please add this key to the XERO_TOKEN_ENC_KEY variable in .env.local file" -ForegroundColor Yellow

Write-Host "`n🎉 Installation completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure .env.local file" -ForegroundColor White
Write-Host "2. Run supabase-schema.sql in Supabase" -ForegroundColor White
Write-Host "3. Run 'pnpm dev' to start the development server" -ForegroundColor White
