#!/bin/bash
set -e

echo ""
echo "  IGFlow — Installation"
echo "================================"

# 1. Vérifie Node.js
if ! command -v node &> /dev/null; then
  echo ""
  echo "❌ Node.js manquant. Installe-le sur https://nodejs.org"
  echo "   Relance ce script après installation."
  exit 1
fi

# 2. Clone ou met à jour le projet
APP_DIR="$HOME/.igflow"
if [ -d "$APP_DIR" ]; then
  echo "🔄 Mise à jour..."
  git -C "$APP_DIR" pull origin main --quiet
else
  echo "📦 Téléchargement..."
  git clone https://github.com/Josselin0312/higgsfield-skills "$APP_DIR" --quiet
fi

# 3. Installe les dépendances
echo "📦 Installation des modules..."
cd "$APP_DIR"
npm install --silent

# 4. Crée IGFlow.app sur le Bureau
APP_PATH="$HOME/Desktop/IGFlow.app"
mkdir -p "$APP_PATH/Contents/MacOS"

cat > "$APP_PATH/Contents/MacOS/IGFlow" << 'EOF'
#!/bin/bash
APP_DIR="$HOME/.igflow"
osascript << SCRIPT
tell application "Terminal"
  activate
  do script "cd '$APP_DIR' && npm run dev & sleep 8 && open http://localhost:3000"
end tell
SCRIPT
EOF

chmod +x "$APP_PATH/Contents/MacOS/IGFlow"

cat > "$APP_PATH/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>IGFlow</string>
  <key>CFBundleIdentifier</key>
  <string>com.igflow.app</string>
  <key>CFBundleName</key>
  <string>IGFlow</string>
  <key>CFBundleDisplayName</key>
  <string>IGFlow</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
EOF

echo ""
echo "✅ IGFlow installé sur ton Bureau !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👉 Double-clique sur IGFlow sur ton Bureau"
echo "   L'app s'ouvre dans ton navigateur."
echo ""
