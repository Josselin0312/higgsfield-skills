#!/bin/bash
set -e

echo ""
echo "  SlideIn — Installation"
echo "================================"

# 1. Vérifie Node.js
if ! command -v node &> /dev/null; then
  echo ""
  echo "❌ Node.js manquant. Installe-le sur https://nodejs.org"
  echo "   Relance ce script après installation."
  exit 1
fi

# 2. Clone ou met à jour le projet
BRANCH="claude/instagram-dm-acquisition-BVRyA"
APP_DIR="$HOME/.igflow"
if [ -d "$APP_DIR" ]; then
  echo "🔄 Mise à jour..."
  git -C "$APP_DIR" fetch origin --quiet
  git -C "$APP_DIR" checkout "$BRANCH" --quiet 2>/dev/null || true
  git -C "$APP_DIR" pull origin "$BRANCH" --quiet
else
  echo "📦 Téléchargement..."
  git clone -b "$BRANCH" https://github.com/Josselin0312/higgsfield-skills "$APP_DIR" --quiet
fi

# 3. Installe les dépendances
echo "📦 Installation des modules..."
cd "$APP_DIR"
npm install --silent

# 4. Crée SlideIn.app sur le Bureau
APP_PATH="$HOME/Desktop/SlideIn.app"
mkdir -p "$APP_PATH/Contents/MacOS"

cat > "$APP_PATH/Contents/MacOS/SlideIn" << 'EOF'
#!/bin/bash
APP_DIR="$HOME/.igflow"
osascript << SCRIPT
tell application "Terminal"
  activate
  do script "cd '$APP_DIR' && npm run dev & sleep 8 && open http://localhost:3000"
end tell
SCRIPT
EOF

chmod +x "$APP_PATH/Contents/MacOS/SlideIn"

cat > "$APP_PATH/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>SlideIn</string>
  <key>CFBundleIdentifier</key>
  <string>com.igflow.app</string>
  <key>CFBundleName</key>
  <string>SlideIn</string>
  <key>CFBundleDisplayName</key>
  <string>SlideIn</string>
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
echo "✅ SlideIn installé sur ton Bureau !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👉 Double-clique sur SlideIn sur ton Bureau"
echo "   L'app s'ouvre dans ton navigateur."
echo ""
