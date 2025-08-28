# 🔄 Database Restoration Guide

## 🚨 **IMPORTANT SAFETY NOTICE**

⚠️ **Restoration OVERWRITES your current database**
⚠️ **Always backup current state before restoring**
⚠️ **Test restoration on a copy first if possible**

## 📋 **Prerequisites for Restoration**

1. ✅ Access to your GitHub repository
2. ✅ Your `BACKUP_ENCRYPTION_KEY` (from password manager)
3. ✅ Turso CLI installed and authenticated
4. ✅ Backup files available in `backups/` folder

## 🔄 **Step-by-Step Restoration Process**

### Step 1: Choose Your Restoration Method

#### **Method A: NPM Script (Recommended)**

```bash
# Set your encryption key (same one used for backup)
export BACKUP_ENCRYPTION_KEY='your-encryption-key-from-github-secrets'

# List available backups to choose from
npm run backup:list

# Restore a specific backup (interactive - will ask for confirmation)
npm run backup:restore 2025-08-28
```

#### **Method B: Direct Script**

```bash
# Set encryption key
export BACKUP_ENCRYPTION_KEY='your-encryption-key'

# Run restoration script
./tools/restore-backup.sh 2025-08-28 your-database-name
```

### Step 2: The Restoration Process

When you run the restoration:

```bash
🔍 Verifying backup for 2025-08-28...

✅ Backup file exists (2.5MB)
✅ Manifest file exists
✅ File size matches manifest
🔍 Testing decryption...
✅ Backup can be decrypted successfully
✅ Backup verification completed

📋 Backup Information:
  📅 Date: 2025-08-28
  ⏰ Timestamp: 02:00:15
  📦 Size: 2621440 bytes
  🔒 Encrypted: true
  🔐 Algorithm: AES256
  📝 Status: success

Available databases:
  my-portfolio-db
  test-database

Enter database name to restore to: my-portfolio-db

⚠️  WARNING: This will OVERWRITE the database 'my-portfolio-db'
⚠️  Current data in 'my-portfolio-db' will be LOST

Are you sure you want to continue? (yes/NO): yes

🔍 Creating safety backup of current database...
✅ Safety backup created: /tmp/safety-backup-20250828-143022.sql

🔍 Decrypting backup file...
✅ Backup decrypted successfully (5242880 bytes)

🔍 Restoring backup to database 'my-portfolio-db'...
✅ Database restoration completed successfully!

📊 Restoration Summary:
  📅 Backup Date: 2025-08-28
  🎯 Target Database: my-portfolio-db
  📊 Restored Data Size: 5242880 bytes
  ⏰ Restoration Time: 2025-08-28 14:30:45
  🛡️  Safety Backup: /tmp/safety-backup-20250828-143022.sql

✅ You can now use your database normally
```

### Step 3: Verify Restoration Success

```bash
# Check if your data is restored correctly
turso db shell your-database-name "SELECT COUNT(*) FROM Links;"
turso db shell your-database-name "SELECT COUNT(*) FROM FormSubmissions;"
turso db shell your-database-name "SELECT COUNT(*) FROM AdminSessions;"

# Test your application to ensure everything works
```

### Step 4: Cleanup (Optional)

```bash
# If restoration was successful, you can remove the safety backup
rm /tmp/safety-backup-20250828-143022.sql
```

## 🚨 **Emergency Rollback**

If restoration went wrong:

```bash
# If safety backup exists, restore it immediately
turso db shell your-database-name < /tmp/safety-backup-20250828-143022.sql

# Or restore from a different backup date
npm run backup:restore 2025-08-27
```

## 🧪 **Testing Restoration (Recommended)**

**Always test on a copy first:**

```bash
# Create test database
turso db create test-restore-database

# Test restore on the copy
export BACKUP_ENCRYPTION_KEY='your-key'
./tools/restore-backup.sh 2025-08-28 test-restore-database

# Verify test restoration
turso db shell test-restore-database "SELECT COUNT(*) FROM Links;"

# If successful, proceed with real restoration
# Clean up test
turso db destroy test-restore-database
```

## ⚡ **Quick Restoration Checklist**

```bash
# ✅ 1. Set encryption key
export BACKUP_ENCRYPTION_KEY='your-github-secret-key'

# ✅ 2. List backups
npm run backup:list

# ✅ 3. Verify backup integrity
npm run backup:verify 2025-08-28

# ✅ 4. Run restoration (creates safety backup automatically)
npm run backup:restore 2025-08-28

# ✅ 5. Test your application
# Visit your website, check admin panel, verify data
```

## 🔐 **Security During Restoration**

- **Encryption key stays local** - never committed to repository
- **Safety backup created** before any changes
- **Confirmation required** before overwriting data
- **Complete audit trail** in restoration logs
- **Process can be stopped** at any time

## 🎯 **When to Use Restoration**

- **Data corruption** in production database
- **Accidental data deletion**
- **Bad migration or update** went wrong
- **Rolling back to known good state**
- **Disaster recovery** scenarios
- **Testing with production data** (use copy)

---

🛡️ **Remember**: Your encryption key is the ONLY way to access backup data. Store it securely!
