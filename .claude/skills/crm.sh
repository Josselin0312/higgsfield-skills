#!/bin/bash

# CRM Skills Hub - Interactive Dashboard

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DASHBOARD="$SCRIPT_DIR/crm-dashboard.js"

case "$1" in
  dashboard|"")
    node "$DASHBOARD" dashboard
    ;;
  revenue)
    node "$DASHBOARD" revenue
    ;;
  history)
    node "$DASHBOARD" history
    ;;
  init)
    node "$DASHBOARD" init
    ;;
  *)
    echo "CRM Skills Hub"
    echo ""
    echo "Usage:"
    echo "  /crm                - Show dashboard (default)"
    echo "  /crm dashboard      - Show dashboard"
    echo "  /crm revenue        - Show revenue breakdown"
    echo "  /crm history        - Show generation history"
    echo "  /crm init           - Initialize database"
    ;;
esac
