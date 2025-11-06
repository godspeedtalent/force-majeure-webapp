#!/bin/bash

# Migration Script for Feature-Based Architecture
# This script helps migrate files from the old structure to the new feature-based structure

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Force Majeure Web App - Architecture Migration Script${NC}"
echo "======================================================"
echo ""

# Function to display usage
usage() {
    echo "Usage: ./migrate-to-features.sh [FEATURE_NAME]"
    echo ""
    echo "Available features:"
    echo "  - auth"
    echo "  - events"
    echo "  - merch"
    echo "  - payments"
    echo "  - scavenger"
    echo "  - admin"
    echo "  - artist"
    echo "  - venue"
    echo "  - ticketing"
    echo "  - musicplayer"
    echo "  - organization"
    echo ""
    echo "Example: ./migrate-to-features.sh auth"
    exit 1
}

# Check if feature name is provided
if [ -z "$1" ]; then
    usage
fi

FEATURE=$1
OLD_FEATURES_DIR="src/features"
NEW_FEATURES_DIR="src/features-new"
COMPONENTS_DIR="src/components"
PAGES_DIR="src/pages"

echo -e "${YELLOW}Migrating feature: ${FEATURE}${NC}"
echo ""

# Check if feature directory exists in new structure
if [ ! -d "$NEW_FEATURES_DIR/$FEATURE" ]; then
    echo -e "${YELLOW}Feature directory doesn't exist. Creating it...${NC}"
    mkdir -p "$NEW_FEATURES_DIR/$FEATURE"/{components,hooks,services,types,pages}
    
    # Create index files
    for subdir in components hooks services types pages; do
        echo "// Export all ${subdir} from this feature" > "$NEW_FEATURES_DIR/$FEATURE/${subdir}/index.ts"
    done
    
    cat > "$NEW_FEATURES_DIR/$FEATURE/index.ts" << EOF
/**
 * ${FEATURE^} Feature Module
 * 
 * Exports all ${FEATURE}-related components, hooks, services, and types
 */

// Components
export * from './components';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Types
export * from './types';

// Pages
export * from './pages';
EOF
fi

# Migrate from old features directory if exists
if [ -d "$OLD_FEATURES_DIR/$FEATURE" ]; then
    echo -e "${GREEN}Found existing feature directory${NC}"
    
    # Copy components
    if [ -d "$OLD_FEATURES_DIR/$FEATURE/components" ]; then
        echo "  → Migrating components..."
        cp -r "$OLD_FEATURES_DIR/$FEATURE/components/"* "$NEW_FEATURES_DIR/$FEATURE/components/" 2>/dev/null || true
    fi
    
    # Copy hooks
    if [ -d "$OLD_FEATURES_DIR/$FEATURE/hooks" ]; then
        echo "  → Migrating hooks..."
        cp -r "$OLD_FEATURES_DIR/$FEATURE/hooks/"* "$NEW_FEATURES_DIR/$FEATURE/hooks/" 2>/dev/null || true
    fi
    
    # Copy services
    if [ -d "$OLD_FEATURES_DIR/$FEATURE/services" ]; then
        echo "  → Migrating services..."
        cp -r "$OLD_FEATURES_DIR/$FEATURE/services/"* "$NEW_FEATURES_DIR/$FEATURE/services/" 2>/dev/null || true
    fi
    
    # Copy types
    if [ -d "$OLD_FEATURES_DIR/$FEATURE/types" ]; then
        echo "  → Migrating types..."
        cp -r "$OLD_FEATURES_DIR/$FEATURE/types/"* "$NEW_FEATURES_DIR/$FEATURE/types/" 2>/dev/null || true
    fi
fi

# Migrate from components directory
if [ -d "$COMPONENTS_DIR/$FEATURE" ]; then
    echo -e "${GREEN}Found components in old structure${NC}"
    echo "  → Migrating from src/components/$FEATURE..."
    cp -r "$COMPONENTS_DIR/$FEATURE/"* "$NEW_FEATURES_DIR/$FEATURE/components/" 2>/dev/null || true
fi

# Migrate pages
if [ -d "$PAGES_DIR/$FEATURE" ]; then
    echo -e "${GREEN}Found pages directory${NC}"
    echo "  → Migrating from src/pages/$FEATURE..."
    cp -r "$PAGES_DIR/$FEATURE/"* "$NEW_FEATURES_DIR/$FEATURE/pages/" 2>/dev/null || true
fi

# List files that need manual attention
echo ""
echo -e "${YELLOW}Manual Migration Needed:${NC}"
echo "The following files may need to be moved manually:"
echo ""

# Find standalone page files
find "$PAGES_DIR" -maxdepth 1 -type f -name "*" 2>/dev/null | while read file; do
    basename=$(basename "$file")
    if [[ "$basename" =~ ^[A-Z] ]]; then
        echo "  - $file"
    fi
done

echo ""
echo -e "${GREEN}✓ Migration for '$FEATURE' feature completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review files in: $NEW_FEATURES_DIR/$FEATURE/"
echo "2. Update exports in index.ts files"
echo "3. Update imports throughout the codebase to use @features/$FEATURE"
echo "4. Test the feature thoroughly"
echo "5. Remove old files once confirmed working"
echo ""
echo "For detailed migration guide, see: docs/ARCHITECTURE.md"
