# Deploy to Vercel Production with SPA routing
# This script ensures the SPA catch-all rewrite is applied

Write-Host "🔨 Building with Vercel..."
vercel build --prod

# Fix the output config to include SPA rewrite
$configPath = ".vercel\output\config.json"
$config = @{
    version = 3
    routes = @(
        @{ handle = "filesystem" },
        @{ src = "/(.*)"; dest = "/index.html" }
    )
    crons = @()
}
$config | ConvertTo-Json -Depth 4 | Set-Content $configPath -Encoding UTF8
Write-Host "✅ Injected SPA rewrite into output config"

Write-Host "🚀 Deploying prebuilt to production..."
vercel deploy --prebuilt --prod

Write-Host "✅ Done!"
