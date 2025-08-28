#!/bin/bash

# 🔄 Turso Database Restoration Script
# Usage: ./restore-backup.sh YYYY-MM-DD [database-name]
# Example: ./restore-backup.sh 2025-08-28 my-database

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if date argument is provided
if [ $# -lt 1 ]; then
    print_error "Usage: $0 YYYY-MM-DD [database-name]"
    print_error "Example: $0 2025-08-28 my-database"
    exit 1
fi

BACKUP_DATE="$1"
DATABASE_NAME="${2:-}"

# Validate date format
if ! [[ "$BACKUP_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    print_error "Invalid date format. Use YYYY-MM-DD"
    exit 1
fi

# Check if backup files exist
BACKUP_FILE="backups/backup-${BACKUP_DATE}.sql.gpg"
MANIFEST_FILE="backups/backup-${BACKUP_DATE}-manifest.json"

if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    print_status "Available backups:"
    ls -la backups/backup-*.sql.gpg 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -f "$MANIFEST_FILE" ]; then
    print_warning "Manifest file not found: $MANIFEST_FILE"
    print_warning "Continuing without manifest verification..."
else
    print_status "Found manifest file: $MANIFEST_FILE"
    
    # Display backup information
    echo
    print_status "Backup Information:"
    cat "$MANIFEST_FILE" | jq -r '
        "  📅 Date: " + .date + 
        "\n  📦 Size: " + (.backup_size_bytes | tostring) + " bytes" +
        "\n  🔒 Encrypted: " + (.encrypted | tostring) +
        "\n  🔐 Algorithm: " + .encryption_algo +
        "\n  ⏰ Timestamp: " + .timestamp'
    echo
fi

# Prompt for database name if not provided
if [ -z "$DATABASE_NAME" ]; then
    print_status "Available databases:"
    turso db list
    echo
    read -p "Enter database name to restore to: " DATABASE_NAME
    
    if [ -z "$DATABASE_NAME" ]; then
        print_error "Database name is required"
        exit 1
    fi
fi

# Confirm restoration
echo
print_warning "⚠️  WARNING: This will OVERWRITE the database '$DATABASE_NAME'"
print_warning "⚠️  Current data in '$DATABASE_NAME' will be LOST"
echo
read -p "Are you sure you want to continue? (yes/NO): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_status "Restoration cancelled"
    exit 0
fi

# Check if BACKUP_ENCRYPTION_KEY is set
if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    print_error "BACKUP_ENCRYPTION_KEY environment variable is not set"
    print_status "Set it with: export BACKUP_ENCRYPTION_KEY='your-encryption-key'"
    exit 1
fi

# Create temporary directory for restoration
TEMP_DIR=$(mktemp -d)
TEMP_SQL_FILE="$TEMP_DIR/restore.sql"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

print_status "Decrypting backup file..."

# Decrypt the backup
if ! gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" "$BACKUP_FILE" > "$TEMP_SQL_FILE"; then
    print_error "Failed to decrypt backup file"
    print_error "Check your BACKUP_ENCRYPTION_KEY"
    exit 1
fi

# Verify decrypted file
if [ ! -s "$TEMP_SQL_FILE" ]; then
    print_error "Decrypted file is empty"
    exit 1
fi

DECRYPTED_SIZE=$(stat -c%s "$TEMP_SQL_FILE")
print_success "Backup decrypted successfully (${DECRYPTED_SIZE} bytes)"

# Create a backup of current database before restoration
print_status "Creating safety backup of current database..."
SAFETY_BACKUP_FILE="$TEMP_DIR/safety-backup-$(date +%Y%m%d-%H%M%S).sql"

if turso db dump "$DATABASE_NAME" > "$SAFETY_BACKUP_FILE" 2>/dev/null; then
    print_success "Safety backup created: $SAFETY_BACKUP_FILE"
    print_status "You can restore current state from: $SAFETY_BACKUP_FILE"
else
    print_warning "Could not create safety backup (database might not exist)"
fi

# Check if database exists, create if not
print_status "Checking database existence..."
if ! turso db show "$DATABASE_NAME" >/dev/null 2>&1; then
    print_status "Database '$DATABASE_NAME' does not exist. Creating..."
    if ! turso db create "$DATABASE_NAME"; then
        print_error "Failed to create database"
        exit 1
    fi
    print_success "Database created successfully"
fi

# Restore the backup
print_status "Restoring backup to database '$DATABASE_NAME'..."

if turso db shell "$DATABASE_NAME" < "$TEMP_SQL_FILE"; then
    print_success "Database restoration completed successfully!"
    
    # Show restoration summary
    echo
    print_status "Restoration Summary:"
    echo "  📅 Backup Date: $BACKUP_DATE"
    echo "  🎯 Target Database: $DATABASE_NAME"
    echo "  📊 Restored Data Size: ${DECRYPTED_SIZE} bytes"
    echo "  ⏰ Restoration Time: $(date)"
    
    if [ -f "$SAFETY_BACKUP_FILE" ]; then
        echo "  🛡️  Safety Backup: $SAFETY_BACKUP_FILE"
    fi
    
    echo
    print_success "You can now use your database normally"
else
    print_error "Database restoration failed"
    
    if [ -f "$SAFETY_BACKUP_FILE" ]; then
        print_status "Attempting to restore safety backup..."
        if turso db shell "$DATABASE_NAME" < "$SAFETY_BACKUP_FILE"; then
            print_success "Safety backup restored successfully"
        else
            print_error "Failed to restore safety backup"
        fi
    fi
    
    exit 1
fi
