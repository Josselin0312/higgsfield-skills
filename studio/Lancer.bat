@echo off
chcp 65001 >nul
title Influencer Content Studio

echo.
echo   ✨ Influencer Content Studio
echo   ─────────────────────────────

cd /d "%~dp0"

:: Vérifie Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ❌ Node.js n'est pas installe.
    echo   → Telecharge-le sur : https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo   ✓ Node.js %NODE_VER% detecte

:: Installe les dépendances si besoin
if not exist node_modules (
    echo.
    echo   📦 Installation des modules (une seule fois, ~30 sec)...
    npm install --silent
    echo   ✓ Installation terminee
)

echo.
echo   🚀 Demarrage en cours...
echo   → L'app va s'ouvrir dans ton navigateur
echo.
echo   (garde cette fenetre ouverte pendant que tu travailles)
echo   (ferme-la pour arreter l'app)
echo.

node server.js
pause
