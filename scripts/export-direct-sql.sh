#!/bin/bash

# Export Database Schema and Data using Direct SQL
# This script uses pg_dump to get the complete schema
# Requires direct database connection (get from Supabase settings)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Supabase Database Export Script${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file with the following variables:"
    echo "  DB_HOST=db.your-project.supabase.co"
    echo "  DB_PORT=5432"
    echo "  DB_NAME=postgres"
    echo "  DB_USER=postgres"
    echo "  DB_PASSWORD=your-password"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Database connection variables not set${NC}"
    echo "Please set DB_HOST and DB_PASSWORD in your .env file"
    echo ""
    echo "You can find these in Supabase:"
    echo "  1. Go to Project Settings > Database"
    echo "  2. Copy the connection string"
    echo "  3. Extract host and password"
    exit 1
fi

# Create output directory
OUTPUT_DIR="schema-exports"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

echo -e "${YELLOW}📊 Exporting schema...${NC}"

# Export schema only (no data)
SCHEMA_FILE="$OUTPUT_DIR/schema-${TIMESTAMP}.sql"
PGPASSWORD=$DB_PASSWORD pg_dump \
    --host=$DB_HOST \
    --port=${DB_PORT:-5432} \
    --username=${DB_USER:-postgres} \
    --dbname=${DB_NAME:-postgres} \
    --schema-only \
    --no-owner \
    --no-privileges \
    --schema=public \
    --file="$SCHEMA_FILE"

echo -e "${GREEN}✓ Schema exported to: $SCHEMA_FILE${NC}\n"

echo -e "${YELLOW}📦 Exporting data...${NC}"

# Export data only (no schema)
DATA_FILE="$OUTPUT_DIR/data-${TIMESTAMP}.sql"
PGPASSWORD=$DB_PASSWORD pg_dump \
    --host=$DB_HOST \
    --port=${DB_PORT:-5432} \
    --username=${DB_USER:-postgres} \
    --dbname=${DB_NAME:-postgres} \
    --data-only \
    --no-owner \
    --no-privileges \
    --schema=public \
    --file="$DATA_FILE"

echo -e "${GREEN}✓ Data exported to: $DATA_FILE${NC}\n"

echo -e "${YELLOW}🔍 Exporting complete dump (schema + data)...${NC}"

# Export complete database
COMPLETE_FILE="$OUTPUT_DIR/complete-${TIMESTAMP}.sql"
PGPASSWORD=$DB_PASSWORD pg_dump \
    --host=$DB_HOST \
    --port=${DB_PORT:-5432} \
    --username=${DB_USER:-postgres} \
    --dbname=${DB_NAME:-postgres} \
    --no-owner \
    --no-privileges \
    --schema=public \
    --file="$COMPLETE_FILE"

echo -e "${GREEN}✓ Complete dump exported to: $COMPLETE_FILE${NC}\n"

# Get statistics
echo -e "${GREEN}📊 Export Summary:${NC}"
echo "  Schema file size: $(du -h "$SCHEMA_FILE" | cut -f1)"
echo "  Data file size: $(du -h "$DATA_FILE" | cut -f1)"
echo "  Complete file size: $(du -h "$COMPLETE_FILE" | cut -f1)"
echo ""

# Count tables
TABLE_COUNT=$(grep -c "CREATE TABLE" "$SCHEMA_FILE" || echo "0")
echo "  Tables found: $TABLE_COUNT"

# Count functions
FUNCTION_COUNT=$(grep -c "CREATE.*FUNCTION" "$SCHEMA_FILE" || echo "0")
echo "  Functions found: $FUNCTION_COUNT"

# Count triggers
TRIGGER_COUNT=$(grep -c "CREATE TRIGGER" "$SCHEMA_FILE" || echo "0")
echo "  Triggers found: $TRIGGER_COUNT"

echo ""
echo -e "${GREEN}✅ Export complete!${NC}"
echo -e "${YELLOW}⚠️  Note: Review exported files for sensitive data before sharing${NC}"
