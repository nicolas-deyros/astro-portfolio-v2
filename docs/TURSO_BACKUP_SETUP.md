# 🚀 Turso Database Backup - Complete Setup Guide

## 📋 Prerequisites

- Turso account with an active database
- GitHub repository with Actions enabled
- Basic command line knowledge

## 🔧 Step 1: Generate Required Credentials

### 1.1 Get Your Turso Authentication Token

```bash
# Install Turso CLI if you haven't already
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Generate authentication token (save this!)
turso auth token
```

**📝 Save the output** - this is your `TURSO_AUTH_TOKEN`

### 1.2 Get Your Database Name

```bash
# List your databases
turso db list

# Note the name of the database you want to backup
# Example output: your-database-name
```

**📝 Save the database name** - this is your `TURSO_DATABASE_NAME`

### 1.3 Generate Encryption Key

```bash
# Generate a strong encryption key (save this securely!)
openssl rand -base64 32
```

**📝 Save this key securely** - this is your `BACKUP_ENCRYPTION_KEY`
⚠️ **IMPORTANT**: Store this key in a password manager. Without it, you cannot decrypt your backups!

## 🔐 Step 2: Configure GitHub Secrets

### 2.1 Navigate to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2.2 Add Required Secrets

Add these **3 secrets** one by one:

#### Secret 1: TURSO_AUTH_TOKEN

```
Name: TURSO_AUTH_TOKEN
Value: [paste your token from step 1.1]
```

#### Secret 2: TURSO_DATABASE_NAME

```
Name: TURSO_DATABASE_NAME
Value: [your database name from step 1.2]
```

#### Secret 3: BACKUP_ENCRYPTION_KEY

```
Name: BACKUP_ENCRYPTION_KEY
Value: [your encryption key from step 1.3]
```

### 2.3 Verify Secrets

Your secrets should look like this:

- ✅ `TURSO_AUTH_TOKEN` (starts with similar to: `eyJ...`)
- ✅ `TURSO_DATABASE_NAME` (example: `my-portfolio-db`)
- ✅ `BACKUP_ENCRYPTION_KEY` (example: `Kx7mN9pQ2rS8tU1vW4xY6z...`)

## 📦 Step 3: Deploy the Backup System

### 3.1 Commit the Backup Files

```bash
# Check current status
git status

# Add all backup system files
git add .github/workflows/turso-backup.yml
git add docs/TURSO_BACKUP.md
git add tools/backup-manager.sh
git add tools/restore-backup.sh
git add package.json

# Commit the backup system
git commit -m "feat: add enterprise-grade Turso database backup system

- automated daily backups with AES256 encryption
- comprehensive restoration and verification tools
- security scanning and retention management
- npm script integration for easy management"

# Push to GitHub
git push origin optimizations-v2
```

### 3.2 Verify Workflow File

Go to GitHub and check:

1. **Actions** tab in your repository
2. Look for **"Daily Turso Database Backup"** workflow
3. It should be listed but not run yet

## 🧪 Step 4: Test the Backup System

### 4.1 Manual Test (Recommended First)

1. Go to GitHub → **Actions** tab
2. Click **"Daily Turso Database Backup"**
3. Click **"Run workflow"** button
4. Select your branch (`optimizations-v2`)
5. Click **"Run workflow"**

### 4.2 Monitor the Test Run

Watch the workflow execution:

- ✅ **Install Turso CLI** should complete
- ✅ **Authenticate with Turso** should complete
- ✅ **Create backup** should create encrypted file
- ✅ **Commit backup** should add files to repository
- ✅ **Security scan** should pass
- ✅ **Backup verification** should confirm integrity

### 4.3 Verify Backup Files

After successful run, check your repository:

```bash
# Pull the latest changes
git pull origin optimizations-v2

# Check if backup files were created
ls -la backups/

# You should see files like:
# backup-2025-08-28.sql.gpg
# backup-2025-08-28-manifest.json
```

## 🔍 Step 5: Validate Backup Integrity

### 5.1 Using NPM Scripts

```bash
# Set your encryption key locally
export BACKUP_ENCRYPTION_KEY='your-key-from-step-1.3'

# List all backups
npm run backup:list

# Verify today's backup
npm run backup:verify $(date +%Y-%m-%d)

# Get detailed backup info
npm run backup:info $(date +%Y-%m-%d)
```

### 5.2 Manual Verification

```bash
# Test decryption (doesn't restore, just verifies)
gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
    backups/backup-$(date +%Y-%m-%d).sql.gpg | head -10

# You should see SQL commands like:
# PRAGMA foreign_keys=OFF;
# BEGIN TRANSACTION;
# CREATE TABLE ...
```

## 🔄 Step 6: Test Restoration Process (Optional)

⚠️ **CAUTION**: Only test this on a non-production database or create a test database

### 6.1 Create Test Database

```bash
# Create a test database for restoration testing
turso db create test-restore-db
```

### 6.2 Test Restoration

```bash
# Set encryption key
export BACKUP_ENCRYPTION_KEY='your-encryption-key'

# Test restore to the test database
npm run backup:restore $(date +%Y-%m-%d)
# When prompted, enter: test-restore-db
```

### 6.3 Verify Restoration

```bash
# Check if data was restored correctly
turso db shell test-restore-db "SELECT COUNT(*) FROM Links;"
turso db shell test-restore-db "SELECT COUNT(*) FROM FormSubmissions;"

# Clean up test database
turso db destroy test-restore-db
```

## 📅 Step 7: Schedule Verification

### 7.1 Automatic Schedule

The backup will now run automatically:

- **Every day at 2 AM UTC**
- **Keeps 30 days of backups**
- **Automatically cleans up old backups**

### 7.2 Monitor Regular Backups

Check weekly:

1. GitHub Actions tab for successful runs
2. Repository `backups/` folder for new files
3. Use `npm run backup:list` to see all backups

## 🚨 Troubleshooting

### Common Issues & Solutions

#### **Error: "Authentication failed"**

```bash
# Solution: Regenerate Turso token
turso auth token
# Update TURSO_AUTH_TOKEN secret in GitHub
```

#### **Error: "Database not found"**

```bash
# Solution: Check database name
turso db list
# Update TURSO_DATABASE_NAME secret if needed
```

#### **Error: "Decryption failed"**

```bash
# Solution: Verify encryption key
echo $BACKUP_ENCRYPTION_KEY
# Make sure it matches the GitHub secret
```

#### **Error: "Backup file empty"**

- Check database has data: `turso db shell your-db "SELECT COUNT(*) FROM sqlite_master;"`
- Check network connectivity in workflow logs
- Verify token permissions

## 📊 Success Metrics

Your backup system is working correctly when:

- ✅ **Daily workflow runs complete successfully**
- ✅ **Backup files appear in `backups/` folder**
- ✅ **File sizes are reasonable** (not 0 bytes)
- ✅ **Manifests contain valid JSON**
- ✅ **Decryption test succeeds**
- ✅ **Old backups are cleaned up after 30 days**

## 🎯 Next Steps

1. **Set up monitoring alerts** (optional)
2. **Test restoration process monthly**
3. **Review backup retention policy**
4. **Document your encryption key storage**
5. **Train team members on restoration process**

---

🎉 **Congratulations!** Your Turso database is now protected with enterprise-grade backup automation!
