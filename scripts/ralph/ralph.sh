#!/bin/bash
# Ralph - Autonomous AI Agent Iteration Loop
# Usage: ./scripts/ralph/ralph.sh [--tool claude|amp|antigravity] [max_iterations]

set -e

# Default configurations
TOOL="claude"
MAX_ITERATIONS=10

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

mkdir -p "$ARCHIVE_DIR"

echo "=========================================="
echo " Starting Ralph Loop (Tool: $TOOL, Max: $MAX_ITERATIONS)"
echo "=========================================="

# Check for PRD
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: $PRD_FILE not found."
  echo "Please create a prd.json before running Ralph."
  exit 1
fi

ITERATION=1
while [ $ITERATION -le $MAX_ITERATIONS ]; do
  echo ""
  echo ">>> Ralph Iteration $ITERATION / $MAX_ITERATIONS <<<"
  
  # Check if all tasks in prd.json are complete
  if command -v jq >/dev/null 2>&1; then
    INCOMPLETE=$(jq '[.userStories[]? | select(.passes == false)] | length' "$PRD_FILE" 2>/dev/null || echo "0")
    if [ "$INCOMPLETE" -eq 0 ]; then
      echo "✅ All tasks in prd.json are complete! Exiting Ralph loop."
      break
    fi
    echo "Tasks remaining: $INCOMPLETE"
  fi

  # Execute agent invocation based on configured tool
  case $TOOL in
    claude)
      if command -v claude >/dev/null 2>&1; then
        claude -p "Review scripts/ralph/prd.json and scripts/ralph/progress.txt. Pick the next incomplete task, implement it, test it, and update prd.json and progress.txt."
      else
        echo "Note: 'claude' CLI not found on PATH. Executing verification build..."
        npm run build
      fi
      ;;
    amp)
      if command -v amp >/dev/null 2>&1; then
        amp run -f "$PROMPT_FILE"
      else
        npm run build
      fi
      ;;
    antigravity|*)
      npm run build
      ;;
  esac

  ITERATION=$((ITERATION + 1))
done

echo ""
echo "=========================================="
echo " Ralph Loop Finished!"
echo "=========================================="
