#!/bin/bash
# Setup script for BOL Seller Messenger recurring campaigns

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_FILE="$SCRIPT_DIR/com.bol-seller-messenger.campaign.plist"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
LAUNCHD_PLIST="$LAUNCHD_DIR/com.bol-seller-messenger.campaign.plist"

echo "========================================="
echo "BOL Seller Messenger - Setup Recurring Tasks"
echo "========================================="

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"
echo "✅ Created logs directory"

# Copy plist to LaunchAgents
mkdir -p "$LAUNCHD_DIR"
cp "$PLIST_FILE" "$LAUNCHD_PLIST"
echo "✅ Installed launch agent"

# Load the agent
launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
launchctl load "$LAUNCHD_PLIST"
echo "✅ Loaded launch agent"

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "The campaign will run automatically:"
echo "  • Daily at 9:00 AM"
echo "  • Using settings from the web UI"
echo ""
echo "Logs will be saved to:"
echo "  $PROJECT_DIR/logs/"
echo ""
echo "Useful commands:"
echo "  • Check status:    launchctl list | grep bol-seller-messenger"
echo "  • Stop campaigns:  launchctl unload $LAUNCHD_PLIST"
echo "  • Start campaigns: launchctl load $LAUNCHD_PLIST"
echo "  • View logs:       tail -f $PROJECT_DIR/logs/campaign-*.log"
echo "  • Manual run:      $SCRIPT_DIR/run-campaign.sh"
echo ""
echo "⚠️  IMPORTANT: The web UI must be running for campaigns to work!"
echo "    Start it with: cd $PROJECT_DIR && npm run dev"
echo ""
