#!/bin/bash
# Generate Phase 8 RLS Optimization Migration
# This script helps generate the final comprehensive RLS optimization migration

echo "============================================================================"
echo "Phase 8 RLS Policy Optimization Generator"
echo "============================================================================"
echo ""
echo "This script will help you generate the Phase 8 migration to fix ALL"
echo "remaining unoptimized RLS policies in your database."
echo ""
echo "Steps:"
echo "  1. Run the discovery query to get unoptimized policies as JSON"
echo "  2. Save the JSON output to scripts/unoptimized_policies.json"
echo "  3. Run the Python generator to create the migration SQL"
echo ""
echo "============================================================================"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not found"
    exit 1
fi

# Check if JSON file exists
if [ ! -f "scripts/unoptimized_policies.json" ]; then
    echo "ERROR: scripts/unoptimized_policies.json not found"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Open Supabase SQL Editor"
    echo "2. Run the query from scripts/find_unoptimized_policies.sql"
    echo "3. Copy the JSON results"
    echo "4. Save to scripts/unoptimized_policies.json"
    echo "5. Run this script again"
    echo ""
    echo "Example JSON format:"
    echo '['
    echo '  {'
    echo '    "tablename": "table_name",'
    echo '    "policyname": "policy_name",'
    echo '    "cmd": "SELECT",'
    echo '    "using_clause": "user_id = auth.uid()",'
    echo '    "with_check_clause": null'
    echo '  }'
    echo ']'
    exit 1
fi

echo "Found unoptimized_policies.json"
echo "Running Python generator..."
echo ""

# Change to scripts directory and run generator
cd scripts
python3 generate_phase8_migration.py

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "SUCCESS! Phase 8 migration generated"
    echo "============================================================================"
    echo ""
    echo "Migration file: supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql"
    echo ""
    echo "Next steps:"
    echo "  1. Review the migration file"
    echo "  2. Commit the changes"
    echo "  3. Deploy to Supabase"
    echo "  4. Run verification query to confirm 0 remaining unoptimized policies"
    echo ""
else
    echo ""
    echo "ERROR: Migration generation failed"
    exit 1
fi
