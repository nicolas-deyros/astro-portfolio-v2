#!/bin/bash

# 📋 Turso Backup Management Script
# Usage: ./backup-manager.sh [list|verify|info] [date]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(($bytes / 1073741824))GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(($bytes / 1048576))MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(($bytes / 1024))KB"
    else
        echo "${bytes}B"
    fi
}

# Function to list all backups
list_backups() {
    print_status "Available Turso Database Backups:"
    echo
    
    if [ ! -d "backups" ] || [ -z "$(ls -A backups/ 2>/dev/null)" ]; then
        print_warning "No backups found in backups/ directory"
        return
    fi
    
    printf "%-12s %-10s %-15s %-8s %s\n" "DATE" "SIZE" "TIMESTAMP" "STATUS" "MANIFEST"
    echo "────────────────────────────────────────────────────────────────────"
    
    for backup_file in backups/backup-*.sql.gpg; do
        if [ ! -f "$backup_file" ]; then continue; fi
        
        # Extract date from filename
        date=$(echo "$backup_file" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
        manifest_file="backups/backup-${date}-manifest.json"
        
        # Get file size
        size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
        size_formatted=$(format_bytes $size)
        
        # Check manifest
        if [ -f "$manifest_file" ]; then
            timestamp=$(jq -r '.timestamp // "Unknown"' "$manifest_file" 2>/dev/null | cut -d'T' -f2 | cut -d':' -f1-2)
            status=$(jq -r '.backup_status // "Unknown"' "$manifest_file" 2>/dev/null)
            manifest_status="✅"
        else
            timestamp="Unknown"
            status="Unknown"
            manifest_status="❌"
        fi
        
        printf "%-12s %-10s %-15s %-8s %s\n" "$date" "$size_formatted" "$timestamp" "$status" "$manifest_status"
    done
    
    echo
    total_files=$(ls backups/backup-*.sql.gpg 2>/dev/null | wc -l)
    total_size=$(du -sb backups/ 2>/dev/null | cut -f1)
    total_size_formatted=$(format_bytes $total_size)
    
    print_success "Total: $total_files backups ($total_size_formatted)"
}

# Function to verify a specific backup
verify_backup() {
    local date="$1"
    local backup_file="backups/backup-${date}.sql.gpg"
    local manifest_file="backups/backup-${date}-manifest.json"
    
    print_status "Verifying backup for $date..."
    echo
    
    # Check if backup exists
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Basic file checks
    local size=$(stat -c%s "$backup_file")
    if [ $size -eq 0 ]; then
        print_error "Backup file is empty"
        return 1
    fi
    
    print_success "Backup file exists ($(format_bytes $size))"
    
    # Check manifest
    if [ ! -f "$manifest_file" ]; then
        print_warning "Manifest file missing"
    else
        print_success "Manifest file exists"
        
        # Verify manifest data
        if ! jq empty "$manifest_file" 2>/dev/null; then
            print_error "Manifest file is corrupted (invalid JSON)"
            return 1
        fi
        
        local manifest_size=$(jq -r '.backup_size_bytes // 0' "$manifest_file")
        if [ "$manifest_size" != "$size" ]; then
            print_warning "Size mismatch: file=$size, manifest=$manifest_size"
        else
            print_success "File size matches manifest"
        fi
    fi
    
    # Test encryption (if key available)
    if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        print_status "Testing decryption..."
        if gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" "$backup_file" >/dev/null 2>&1; then
            print_success "Backup can be decrypted successfully"
        else
            print_error "Backup decryption failed"
            return 1
        fi
    else
        print_warning "BACKUP_ENCRYPTION_KEY not set - skipping decryption test"
    fi
    
    print_success "Backup verification completed"
}

# Function to show detailed backup info
show_backup_info() {
    local date="$1"
    local manifest_file="backups/backup-${date}-manifest.json"
    
    if [ ! -f "$manifest_file" ]; then
        print_error "Manifest file not found: $manifest_file"
        return 1
    fi
    
    print_status "Backup Information for $date:"
    echo
    
    jq -r '
        "📅 Date: " + (.date // "Unknown") +
        "\n⏰ Timestamp: " + (.timestamp // "Unknown") +
        "\n📦 File: " + (.backup_file // "Unknown") +
        "\n📊 Size: " + ((.backup_size_bytes // 0) | tostring) + " bytes" +
        "\n🔒 Encrypted: " + ((.encrypted // false) | tostring) +
        "\n🔐 Algorithm: " + (.encryption_algo // "Unknown") +
        "\n📝 Status: " + (.backup_status // "Unknown") +
        "\n🔗 Commit SHA: " + (.commit_sha // "Unknown") +
        "\n🏃 Runner ID: " + ((.runner_id // "Unknown") | tostring) +
        "\n🔄 Workflow Run: " + ((.workflow_run_id // "Unknown") | tostring)
    ' "$manifest_file"
    
    echo
    print_status "Database Information:"
    local db_hash=$(jq -r '.database_name_hash // "Unknown"' "$manifest_file")
    echo "🗄️  Database Hash: $db_hash"
}

# Main script logic
case "${1:-list}" in
    "list")
        list_backups
        ;;
    "verify")
        if [ $# -lt 2 ]; then
            print_error "Usage: $0 verify YYYY-MM-DD"
            exit 1
        fi
        verify_backup "$2"
        ;;
    "info")
        if [ $# -lt 2 ]; then
            print_error "Usage: $0 info YYYY-MM-DD"
            exit 1
        fi
        show_backup_info "$2"
        ;;
    *)
        echo "Turso Backup Manager"
        echo
        echo "Usage: $0 [command] [options]"
        echo
        echo "Commands:"
        echo "  list              List all available backups (default)"
        echo "  verify DATE       Verify a specific backup (YYYY-MM-DD)"
        echo "  info DATE         Show detailed info for a backup (YYYY-MM-DD)"
        echo
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 verify 2025-08-28"
        echo "  $0 info 2025-08-28"
        echo
        echo "Environment Variables:"
        echo "  BACKUP_ENCRYPTION_KEY    Required for decryption testing"
        ;;
esac
