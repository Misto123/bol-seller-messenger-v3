#!/bin/bash
# Automated BOL Seller Messenger Campaign Runner
# This script runs campaigns automatically based on saved settings

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/campaign-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "========================================="
log "BOL Seller Messenger - Automated Campaign"
log "========================================="

# Check if settings exist
SETTINGS_FILE="$PROJECT_DIR/.campaign-settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    log "ERROR: No campaign settings found at $SETTINGS_FILE"
    log "Please configure settings via the web UI first."
    exit 1
fi

log "Loading campaign settings..."
KEYWORDS=$(jq -r '.keywords | join(",")' "$SETTINGS_FILE")
MESSAGES_PER_KEYWORD=$(jq -r '.messagesPerKeyword' "$SETTINGS_FILE")
COOLDOWN_MINUTES=$(jq -r '.cooldownMinutes' "$SETTINGS_FILE")
SPONSORED_ONLY=$(jq -r '.sponsoredOnly' "$SETTINGS_FILE")

log "Keywords: $KEYWORDS"
log "Messages per keyword: $MESSAGES_PER_KEYWORD"
log "Cooldown: $COOLDOWN_MINUTES minutes"
log "Sponsored only: $SPONSORED_ONLY"

# Trigger campaign via API
log "Starting campaign..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/run \
    -H "Content-Type: application/json" \
    -d "{
        \"keywords\": $(echo "$KEYWORDS" | jq -R 'split(",")'),
        \"messagesPerKeyword\": $MESSAGES_PER_KEYWORD,
        \"cooldownMinutes\": $COOLDOWN_MINUTES,
        \"sponsoredOnly\": $SPONSORED_ONLY
    }")

log "Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    TOTAL_SENT=$(echo "$RESPONSE" | jq -r '.totalSent // 0')
    TOTAL_SKIPPED=$(echo "$RESPONSE" | jq -r '.totalSkipped // 0')
    log "✅ Campaign completed successfully!"
    log "   Sent: $TOTAL_SENT messages"
    log "   Skipped: $TOTAL_SKIPPED duplicates"
else
    log "❌ Campaign failed"
    log "   Error: $(echo "$RESPONSE" | jq -r '.error // "Unknown error"')"
    exit 1
fi

log "========================================="
log "Campaign completed at $(date)"
log "Log saved to: $LOG_FILE"
log "========================================="
