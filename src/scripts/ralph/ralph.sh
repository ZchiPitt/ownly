#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [--tool codex|claude] [--codex-mode yolo|full-auto] [--codex-model MODEL] [--verbose] [--quiet] [max_iterations]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Parse arguments
TOOL="codex"  # Default to Codex
MAX_ITERATIONS=10
VERBOSE=true
QUIET=false
CODEX_MODE="yolo"  # yolo allows git branch/commit operations inside codex loop
CODEX_MODEL="gpt-5.3-codex"

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
    --codex-mode)
      CODEX_MODE="$2"
      shift 2
      ;;
    --codex-mode=*)
      CODEX_MODE="${1#*=}"
      shift
      ;;
    --codex-model)
      CODEX_MODEL="$2"
      shift 2
      ;;
    --codex-model=*)
      CODEX_MODEL="${1#*=}"
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      QUIET=false
      shift
      ;;
    --quiet|-q)
      QUIET=true
      VERBOSE=false
      shift
      ;;
    *)
      # Assume it's max_iterations if it's a number
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Logging functions
timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

log_info() {
  if [[ "$QUIET" != true ]]; then
    echo -e "${DIM}[$(timestamp)]${NC} ${BLUE}INFO${NC}  $1"
  fi
}

log_success() {
  if [[ "$QUIET" != true ]]; then
    echo -e "${DIM}[$(timestamp)]${NC} ${GREEN}OK${NC}    $1"
  fi
}

log_warn() {
  echo -e "${DIM}[$(timestamp)]${NC} ${YELLOW}WARN${NC}  $1"
}

log_error() {
  echo -e "${DIM}[$(timestamp)]${NC} ${RED}ERROR${NC} $1"
}

log_verbose() {
  if [[ "$VERBOSE" == true ]]; then
    echo -e "${DIM}[$(timestamp)]${NC} ${MAGENTA}DEBUG${NC} $1"
  fi
}

log_section() {
  if [[ "$QUIET" != true ]]; then
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  fi
}

# Validate tool choice
if [[ "$TOOL" != "codex" && "$TOOL" != "claude" ]]; then
  log_error "Invalid tool '$TOOL'. Must be 'codex' or 'claude'."
  exit 1
fi

# Validate required binaries
if [[ "$TOOL" == "codex" ]] && ! command -v codex >/dev/null 2>&1; then
  log_error "codex CLI not found. Install Codex CLI or run with --tool claude."
  exit 1
fi
if [[ "$TOOL" == "claude" ]] && ! command -v claude >/dev/null 2>&1; then
  log_error "claude CLI not found. Install Claude Code CLI or run with --tool codex."
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  log_error "jq is required but not installed. Install jq and retry."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"
START_TIME=$(date +%s)

# Helper to get PRD stats
get_prd_stats() {
  if [ -f "$PRD_FILE" ]; then
    local total=$(jq '[.userStories[]] | length' "$PRD_FILE" 2>/dev/null || echo "0")
    local completed=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "0")
    local remaining=$((total - completed))
    echo "$completed/$total ($remaining remaining)"
  else
    echo "PRD not found"
  fi
}

# Helper to get next story info
get_next_story() {
  if [ -f "$PRD_FILE" ]; then
    local story=$(jq -r '[.userStories[] | select(.passes != true)] | sort_by(.priority) | first | "\(.id): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "")
    if [ -n "$story" ] && [ "$story" != "null: null" ]; then
      echo "$story"
    else
      echo "None (all complete!)"
    fi
  else
    echo "PRD not found"
  fi
}

# Helper to verify all stories are actually complete in PRD
all_stories_passed() {
  if [ ! -f "$PRD_FILE" ]; then
    return 1
  fi

  local remaining
  remaining=$(jq '[.userStories[] | select(.passes != true)] | length' "$PRD_FILE" 2>/dev/null || echo "999")
  [ "$remaining" -eq 0 ]
}

# Helper to format elapsed time
format_elapsed() {
  local elapsed=$1
  local hours=$((elapsed / 3600))
  local minutes=$(((elapsed % 3600) / 60))
  local seconds=$((elapsed % 60))
  if [ $hours -gt 0 ]; then
    printf "%dh %dm %ds" $hours $minutes $seconds
  elif [ $minutes -gt 0 ]; then
    printf "%dm %ds" $minutes $seconds
  else
    printf "%ds" $seconds
  fi
}

log_section "Ralph Agent Initializing"
log_verbose "Script directory: $SCRIPT_DIR"
log_verbose "PRD file: $PRD_FILE"
log_verbose "Progress file: $PROGRESS_FILE"

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  log_verbose "Current branch in PRD: ${CURRENT_BRANCH:-'(none)'}"
  log_verbose "Last tracked branch: ${LAST_BRANCH:-'(none)'}"

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    log_warn "Branch changed: $LAST_BRANCH → $CURRENT_BRANCH"
    log_info "Archiving previous run..."
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    log_success "Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    log_info "Reset progress file for new branch"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
    log_verbose "Tracking branch: $CURRENT_BRANCH"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
  log_info "Initialized new progress file"
fi

# Print startup summary
echo ""
echo -e "${BOLD}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BOLD}│${NC}  ${CYAN}🤖 Ralph Agent${NC}                                            ${BOLD}│${NC}"
echo -e "${BOLD}├─────────────────────────────────────────────────────────────┤${NC}"
echo -e "${BOLD}│${NC}  Tool:           ${GREEN}$TOOL${NC}$(printf '%*s' $((40 - ${#TOOL})) '')${BOLD}│${NC}"
if [[ "$TOOL" == "codex" ]]; then
  echo -e "${BOLD}│${NC}  Codex Model:    ${GREEN}$CODEX_MODEL${NC}$(printf '%*s' $((40 - ${#CODEX_MODEL})) '')${BOLD}│${NC}"
fi
echo -e "${BOLD}│${NC}  Max Iterations: ${GREEN}$MAX_ITERATIONS${NC}$(printf '%*s' $((40 - ${#MAX_ITERATIONS})) '')${BOLD}│${NC}"
PROGRESS_STR=$(get_prd_stats)
echo -e "${BOLD}│${NC}  Progress:       ${YELLOW}${PROGRESS_STR}${NC}$(printf '%*s' $((40 - ${#PROGRESS_STR})) '')${BOLD}│${NC}"
echo -e "${BOLD}│${NC}  Next Story:     ${MAGENTA}$(get_next_story | cut -c1-38)${NC}  ${BOLD}│${NC}"
echo -e "${BOLD}│${NC}  Started:        ${DIM}$(timestamp)${NC}               ${BOLD}│${NC}"
echo -e "${BOLD}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

log_info "Starting Ralph loop..."

for i in $(seq 1 $MAX_ITERATIONS); do
  ITER_START=$(date +%s)
  ELAPSED=$((ITER_START - START_TIME))

  log_section "Iteration $i of $MAX_ITERATIONS"

  # Show current status
  echo ""
  echo -e "  ${DIM}Elapsed:${NC}     $(format_elapsed $ELAPSED)"
  echo -e "  ${DIM}Progress:${NC}    $(get_prd_stats)"
  echo -e "  ${DIM}Next story:${NC}  $(get_next_story)"
  echo ""

  log_info "Launching $TOOL agent..."

  if [[ "$TOOL" == "codex" ]]; then
    INSTRUCTIONS_FILE="$SCRIPT_DIR/CODEX.md"
    log_verbose "Reading instructions from: $INSTRUCTIONS_FILE"
    if [[ "$CODEX_MODE" == "yolo" ]]; then
      log_verbose "Command: codex exec --model $CODEX_MODEL --yolo <instructions>"
      OUTPUT=$(codex exec --model "$CODEX_MODEL" --yolo "$(cat "$INSTRUCTIONS_FILE")" 2>&1 | tee /dev/stderr) || true
    else
      log_verbose "Command: codex exec --model $CODEX_MODEL --full-auto <instructions>"
      OUTPUT=$(codex exec --model "$CODEX_MODEL" --full-auto "$(cat "$INSTRUCTIONS_FILE")" 2>&1 | tee /dev/stderr) || true
    fi
  else
    INSTRUCTIONS_FILE="$SCRIPT_DIR/CLAUDE.md"
    log_verbose "Reading instructions from: $INSTRUCTIONS_FILE"
    log_verbose "Command: claude --dangerously-skip-permissions -p <instructions>"
    OUTPUT=$(claude --dangerously-skip-permissions -p "$(cat "$INSTRUCTIONS_FILE")" 2>&1 | tee /dev/stderr) || true
  fi

  ITER_END=$(date +%s)
  ITER_ELAPSED=$((ITER_END - ITER_START))

  echo ""
  log_info "Iteration $i completed in $(format_elapsed $ITER_ELAPSED)"

  # Check for completion signal (must also match PRD truth)
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    if all_stories_passed; then
      TOTAL_ELAPSED=$((ITER_END - START_TIME))
      echo ""
      log_section "🎉 All Tasks Complete!"
      echo ""
      echo -e "  ${GREEN}✓${NC} All user stories have been implemented"
      echo -e "  ${DIM}Total iterations:${NC}  $i"
      echo -e "  ${DIM}Total time:${NC}        $(format_elapsed $TOTAL_ELAPSED)"
      echo -e "  ${DIM}Progress file:${NC}     $PROGRESS_FILE"
      echo ""
      log_success "Ralph completed successfully!"
      exit 0
    else
      log_warn "Received COMPLETE promise, but PRD still has unfinished stories. Continuing loop."
    fi
  fi

  # Show updated progress after iteration
  NEW_STATS=$(get_prd_stats)
  log_success "Progress: $NEW_STATS"

  REMAINING_ITERS=$((MAX_ITERATIONS - i))
  if [ $REMAINING_ITERS -gt 0 ]; then
    log_info "$REMAINING_ITERS iterations remaining"
    log_verbose "Sleeping 2 seconds before next iteration..."
    sleep 2
  fi
done

TOTAL_ELAPSED=$(($(date +%s) - START_TIME))
echo ""
log_section "⚠️  Max Iterations Reached"
echo ""
echo -e "  ${YELLOW}!${NC} Ralph reached max iterations ($MAX_ITERATIONS)"
echo -e "  ${DIM}Total time:${NC}      $(format_elapsed $TOTAL_ELAPSED)"
echo -e "  ${DIM}Final progress:${NC}  $(get_prd_stats)"
echo -e "  ${DIM}Next story:${NC}      $(get_next_story)"
echo -e "  ${DIM}Progress file:${NC}   $PROGRESS_FILE"
echo ""
log_warn "Run again with more iterations or check progress.txt for status"
exit 1
