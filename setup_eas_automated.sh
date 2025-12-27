#!/data/data/com.termux/files/usr/bin/bash

echo "🏭 THE ARCHITECT - EAS Automated Setup Script"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd ~/the-architect || exit 1

# Step 1: Check if EAS is logged in
echo -e "${BLUE}[1/4]${NC} Checking EAS login status..."
if eas whoami &> /dev/null; then
    EAS_USER=$(eas whoami 2>/dev/null)
    echo -e "${GREEN}✓${NC} Already logged in as: ${EAS_USER}"
else
    echo -e "${YELLOW}⚠${NC} Not logged in to EAS"
    echo ""
    echo "Please login to your Expo account:"
    echo "Run: ${BLUE}eas login${NC}"
    echo ""
    echo "After login, run this script again!"
    exit 1
fi

echo ""

# Step 2: Check if project is configured
echo -e "${BLUE}[2/4]${NC} Checking project configuration..."
if grep -q "5b37d621-f17f-4729-ba4a-9c73ea4a8bce" app.json; then
    echo -e "${GREEN}✓${NC} Project ID configured correctly"
else
    echo -e "${RED}✗${NC} Project ID not found in app.json"
    exit 1
fi

echo ""

# Step 3: Check for existing credentials
echo -e "${BLUE}[3/4]${NC} Checking Android credentials..."
CRED_CHECK=$(eas credentials 2>&1 | grep -i "keystore" || echo "none")

if echo "$CRED_CHECK" | grep -q "none"; then
    echo -e "${YELLOW}⚠${NC} No Android keystore found"
    echo -e "${BLUE}→${NC} Will generate credentials during first build..."
else
    echo -e "${GREEN}✓${NC} Android credentials already exist"
fi

echo ""

# Step 4: Start the build
echo -e "${BLUE}[4/4]${NC} Starting Android APK build..."
echo -e "${YELLOW}Note:${NC} If this is your first build, EAS will ask:"
echo "  ${BLUE}Would you like to automatically create a keystore?${NC}"
echo "  → Press ${GREEN}Y${NC} (Yes)"
echo ""
echo "Press any key to continue..."
read -n 1 -s

echo ""
echo -e "${BLUE}Starting build...${NC}"
echo ""

# Run the build
eas build --platform android --profile preview

BUILD_EXIT_CODE=$?

echo ""
echo "============================================="

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ BUILD SUCCESSFUL!${NC}"
    echo ""
    echo "🎉 Setup complete! Your APK is being built on Expo servers."
    echo ""
    echo "Next steps:"
    echo "1. Check build status: ${BLUE}https://expo.dev${NC}"
    echo "2. Download APK when ready"
    echo "3. ${GREEN}All future GitHub pushes will auto-build!${NC}"
    echo ""
    echo "To check build status:"
    echo "  ${BLUE}eas build:list${NC}"
    echo ""
else
    echo -e "${RED}✗ BUILD FAILED${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Make sure you're logged in: ${BLUE}eas whoami${NC}"
    echo "2. Check your internet connection"
    echo "3. Verify EXPO_TOKEN is set on GitHub:"
    echo "   ${BLUE}https://github.com/Marcone1983/The-Architect/settings/secrets/actions${NC}"
    echo ""
    exit 1
fi

# Step 5: Get EXPO_TOKEN for GitHub
echo ""
echo -e "${BLUE}[BONUS]${NC} GitHub Actions Setup"
echo "============================================="
echo ""
echo "To enable automatic builds on GitHub, add this secret:"
echo ""
echo "1. Go to: ${BLUE}https://github.com/Marcone1983/The-Architect/settings/secrets/actions${NC}"
echo "2. Click: ${GREEN}New repository secret${NC}"
echo "3. Name: ${YELLOW}EXPO_TOKEN${NC}"
echo "4. Value: Get it by running: ${BLUE}cat ~/.expo/state.json | grep accessToken${NC}"
echo ""
echo "After adding the secret, every push will automatically build your APK! 🚀"
echo ""
