#!/bin/bash
# Test script to verify backup workflow logic locally

set -euo pipefail

echo "🧪 Testing Backup Workflow Logic"
echo "================================="

# Check environment variables
if [ -z "${TURSO_DATABASE_NAME:-}" ]; then
    echo "❌ TURSO_DATABASE_NAME not set"
    echo "   Run: export TURSO_DATABASE_NAME='ndeyros-nicolas-deyros'"
    exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "❌ BACKUP_ENCRYPTION_KEY not set"
    echo "   Run: export BACKUP_ENCRYPTION_KEY='67505df1ceaa5d42aba01f7e44d4b1d5'"
    exit 1
fi

echo "✅ Environment variables set"
echo "   Database: $TURSO_DATABASE_NAME"
echo "   Encryption key: ${BACKUP_ENCRYPTION_KEY:0:8}..."

# Test database access
echo "🔍 Testing database access..."
if ! turso db show "$TURSO_DATABASE_NAME" >/dev/null 2>&1; then
    echo "❌ Cannot access database $TURSO_DATABASE_NAME"
    exit 1
fi
echo "✅ Database access verified"

# Test backup creation
echo "🔄 Testing backup creation..."
DATE=$(date +"%Y-%m-%d-%H%M%S")
TEMP_DB="test_backup_${DATE}.db"
TEMP_SQL="test_backup_${DATE}.sql"
TEMP_GPG="test_backup_${DATE}.sql.gpg"

# Export database
if ! turso db export "$TURSO_DATABASE_NAME" --output-file "$TEMP_DB"; then
    echo "❌ Database export failed"
    exit 1
fi
echo "✅ Database exported successfully"

# Convert to SQL
if ! sqlite3 "$TEMP_DB" .dump > "$TEMP_SQL"; then
    echo "❌ SQL conversion failed"
    rm -f "$TEMP_DB"
    exit 1
fi
echo "✅ Converted to SQL format"

# Test encryption
if ! gpg --symmetric --cipher-algo AES256 --batch --yes \
    --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --output "$TEMP_GPG" \
    "$TEMP_SQL"; then
    echo "❌ Encryption failed"
    rm -f "$TEMP_DB" "$TEMP_SQL"
    exit 1
fi
echo "✅ Backup encrypted successfully"

# Test decryption to verify
DECRYPTED="test_decrypted_${DATE}.sql"
if ! gpg --decrypt --batch --yes \
    --passphrase "$BACKUP_ENCRYPTION_KEY" \
    --output "$DECRYPTED" \
    "$TEMP_GPG"; then
    echo "❌ Decryption test failed"
    rm -f "$TEMP_DB" "$TEMP_SQL" "$TEMP_GPG"
    exit 1
fi
echo "✅ Decryption test passed"

# Verify file sizes
ORIGINAL_SIZE=$(stat -c%s "$TEMP_SQL")
ENCRYPTED_SIZE=$(stat -c%s "$TEMP_GPG")
DECRYPTED_SIZE=$(stat -c%s "$DECRYPTED")

echo "📊 Backup statistics:"
echo "   Original SQL: ${ORIGINAL_SIZE} bytes"
echo "   Encrypted:    ${ENCRYPTED_SIZE} bytes"
echo "   Decrypted:    ${DECRYPTED_SIZE} bytes"

if [ "$ORIGINAL_SIZE" -eq "$DECRYPTED_SIZE" ]; then
    echo "✅ File integrity verified"
else
    echo "❌ File integrity check failed"
    rm -f "$TEMP_DB" "$TEMP_SQL" "$TEMP_GPG" "$DECRYPTED"
    exit 1
fi

# Clean up test files
rm -f "$TEMP_DB" "$TEMP_SQL" "$TEMP_GPG" "$DECRYPTED"

echo ""
echo "🎉 All tests passed! The backup workflow should work correctly."
echo ""
echo "📋 Next steps:"
echo "1. Add GitHub secrets (TURSO_AUTH_TOKEN, TURSO_DATABASE_NAME, BACKUP_ENCRYPTION_KEY)"
echo "2. Test the GitHub Actions workflow manually"
echo "3. Monitor the first automated backup"
