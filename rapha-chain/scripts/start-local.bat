@echo off
echo ============================================
echo   RAPHA CHAIN - PUBLIC LOCAL DEPLOYMENT
echo ============================================
echo.

REM Start the Rapha Chain node
echo Starting Rapha Chain node...
start "Rapha Chain Node" cmd /k "c:\Aura\rapha-chain\build\raphad.exe start --home %USERPROFILE%\.rapha-testnet"

REM Wait for node to start
timeout /t 3 /nobreak >nul

echo.
echo Node started! Endpoints:
echo   - EVM RPC:      http://localhost:8545
echo   - REST API:     http://localhost:1317
echo   - Tendermint:   http://localhost:26657
echo.
echo ============================================
echo   To make public, run Cloudflare Tunnel:
echo   cloudflared tunnel --url http://localhost:8545
echo ============================================
pause
