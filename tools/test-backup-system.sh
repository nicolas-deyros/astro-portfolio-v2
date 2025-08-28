#!/bin/bash

# 🧪 Turso Backup System Test Script
# This script helps you validate your backup setup step by step

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}🔍 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🧪 Turso Backup System Validation"
echo "=================================="
echo

# Step 1: Check if Turso CLI is installed
print_step "Checking Turso CLI installation..."
if command -v turso &> /dev/null; then
    TURSO_VERSION=$(turso --version 2>/dev/null || echo "unknown")
    print_success "Turso CLI installed: $TURSO_VERSION"
else
    print_error "Turso CLI not found. Please install it first:"
    echo "  curl -sSfL https://get.tur.so/install.sh | bash"
    exit 1
fi

# Step 2: Check authentication
print_step "Checking Turso authentication..."
if turso auth whoami &>/dev/null; then
    USER=$(turso auth whoami 2>/dev/null || echo "unknown")
    print_success "Authenticated as: $USER"
else
    print_error "Not authenticated with Turso. Please run:"
    echo "  turso auth login"
    exit 1
fi

# Step 3: List available databases
print_step "Listing available databases..."
if turso db list &>/dev/null; then
    echo "Available databases:"
    turso db list | while read line; do
        echo "  📊 $line"
    done
    print_success "Database access verified"
else
    print_error "Cannot access databases. Check your authentication."
    exit 1
fi

# Step 4: Check environment variables
print_step "Checking local environment variables..."

if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    KEY_LENGTH=${#BACKUP_ENCRYPTION_KEY}
    print_success "BACKUP_ENCRYPTION_KEY set (${KEY_LENGTH} characters)"
else
    print_warning "BACKUP_ENCRYPTION_KEY not set locally"
    echo "  Set it with: export BACKUP_ENCRYPTION_KEY='your-key'"
fi

if [ -n "${TURSO_DATABASE_NAME:-}" ]; then
    print_success "TURSO_DATABASE_NAME set: $TURSO_DATABASE_NAME"
    
    # Test database access
    print_step "Testing database access..."
    if turso db show "$TURSO_DATABASE_NAME" &>/dev/null; then
        print_success "Database '$TURSO_DATABASE_NAME' is accessible"
        
        # Get table count
        TABLE_COUNT=$(turso db shell "$TURSO_DATABASE_NAME" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
        echo "  📋 Tables in database: $TABLE_COUNT"
        
        # Check specific tables
        for table in "Links" "FormSubmissions" "AdminSessions"; do
            if turso db shell "$TURSO_DATABASE_NAME" "SELECT COUNT(*) FROM $table;" &>/dev/null; then
                COUNT=$(turso db shell "$TURSO_DATABASE_NAME" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
                echo "  📊 $table: $COUNT records"
            else
                echo "  ❓ $table: table not found or no access"
            fi
        done
    else
        print_error "Cannot access database '$TURSO_DATABASE_NAME'"
    fi
else
    print_warning "TURSO_DATABASE_NAME not set locally"
fi

# Step 5: Check GitHub workflow file
print_step "Checking GitHub workflow file..."
WORKFLOW_FILE=".github/workflows/turso-backup.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    print_success "Workflow file exists"
    
    # Check for required secrets in workflow
    if grep -q "TURSO_AUTH_TOKEN" "$WORKFLOW_FILE"; then
        print_success "TURSO_AUTH_TOKEN reference found in workflow"
    else
        print_warning "TURSO_AUTH_TOKEN not found in workflow"
    fi
    
    if grep -q "TURSO_DATABASE_NAME" "$WORKFLOW_FILE"; then
        print_success "TURSO_DATABASE_NAME reference found in workflow"
    else
        print_warning "TURSO_DATABASE_NAME not found in workflow"
    fi
    
    if grep -q "BACKUP_ENCRYPTION_KEY" "$WORKFLOW_FILE"; then
        print_success "BACKUP_ENCRYPTION_KEY reference found in workflow"
    else
        print_warning "BACKUP_ENCRYPTION_KEY not found in workflow"
    fi
else
    print_error "Workflow file not found: $WORKFLOW_FILE"
fi

# Step 6: Check backup tools
print_step "Checking backup management tools..."
if [ -f "tools/backup-manager.sh" ]; then
    print_success "Backup manager script exists"
else
    print_warning "Backup manager script not found"
fi

if [ -f "tools/restore-backup.sh" ]; then
    print_success "Restore script exists"
else
    print_warning "Restore script not found"
fi

# Step 7: Check NPM scripts
print_step "Checking NPM script integration..."
if [ -f "package.json" ]; then
    if grep -q "backup:list" package.json; then
        print_success "NPM backup scripts configured"
    else
        print_warning "NPM backup scripts not found in package.json"
    fi
else
    print_warning "package.json not found"
fi

# Step 8: Check existing backups
print_step "Checking existing backups..."
if [ -d "backups" ]; then
    BACKUP_COUNT=$(find backups/ -name "backup-*.sql.gpg" | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        print_success "Found $BACKUP_COUNT existing backup(s)"
        
        # List recent backups
        echo "Recent backups:"
        ls -la backups/backup-*.sql.gpg | tail -3 | while read line; do
            echo "  📦 $line"
        done
    else
        print_warning "No backup files found (this is normal for new setup)"
    fi
else
    print_warning "Backups directory not found (will be created on first backup)"
fi

# Step 9: Test GPG encryption (if key available)
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    print_step "Testing GPG encryption..."
    
    # Create test data
    TEST_DATA="SELECT 1; -- Test backup data"
    
    # Test encryption
    if echo "$TEST_DATA" | gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" > /tmp/test_backup.gpg 2>/dev/null; then
        print_success "GPG encryption test successful"
        
        # Test decryption
        if gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" /tmp/test_backup.gpg > /tmp/test_restore.sql 2>/dev/null; then
            if cmp -s <(echo "$TEST_DATA") /tmp/test_restore.sql; then
                print_success "GPG decryption test successful"
            else
                print_error "GPG decryption returned different data"
            fi
        else
            print_error "GPG decryption test failed"
        fi
        
        # Cleanup
        rm -f /tmp/test_backup.gpg /tmp/test_restore.sql
    else
        print_error "GPG encryption test failed"
    fi
fi

echo
echo "🎯 Validation Summary"
echo "===================="

# Final recommendations
print_step "Next steps based on validation:"

if command -v turso &> /dev/null && turso auth whoami &>/dev/null; then
    echo "✅ Ready to test backup system"
    echo "   Run: Go to GitHub Actions → 'Daily Turso Database Backup' → 'Run workflow'"
else
    echo "❌ Complete Turso setup first"
    echo "   1. Install Turso CLI"
    echo "   2. Run: turso auth login"
fi

if [ -f "$WORKFLOW_FILE" ]; then
    echo "✅ GitHub workflow ready"
else
    echo "❌ Commit and push the workflow file"
fi

if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "✅ Local encryption key configured"
else
    echo "⚠️  Set local encryption key for testing:"
    echo "   export BACKUP_ENCRYPTION_KEY='your-github-secret-value'"
fi

echo
print_success "Validation complete! Check GitHub secrets and run a test backup."
