#!/data/data/com.termux/files/usr/bin/bash

# Quick setup script - does everything in one go
# Usage: ./quick_setup.sh

echo "🚀 THE ARCHITECT - Quick Setup"
echo "=============================="
echo ""
echo "This script will:"
echo "  1. Login to EAS"
echo "  2. Generate Android credentials"
echo "  3. Start first build"
echo "  4. Configure GitHub Actions"
echo ""
echo "Press ENTER to start or CTRL+C to cancel"
read

# Step 1: Login
echo ""
echo "📧 Step 1: Login to Expo"
echo "------------------------"
eas login

if [ $? -ne 0 ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo ""
echo "✅ Login successful!"
echo ""
echo "Press ENTER to continue..."
read

# Step 2: Run full setup
echo ""
echo "🔧 Step 2: Running automated setup..."
echo "--------------------------------------"
./setup_eas_automated.sh

# Step 3: Show GitHub token
echo ""
echo "🔑 Step 3: GitHub Secret Configuration"
echo "---------------------------------------"
echo ""
echo "Your EXPO_TOKEN for GitHub Actions:"
echo ""
cat ~/.expo/state.json 2>/dev/null | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || echo "Token not found. Try: cat ~/.expo/state.json"
echo ""
echo "Copy this token and add it to:"
echo "https://github.com/Marcone1983/The-Architect/settings/secrets/actions"
echo ""
echo "Secret name: EXPO_TOKEN"
echo ""
