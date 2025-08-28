# 🔄 Turso Database Backup System

This repository includes an automated backup system for your Turso database with enterprise-grade security and reliability features.

## 🎯 Features

- **Automated Daily Backups**: Runs every day at 2 AM UTC
- **Military-Grade Encryption**: AES256 encryption for all backups
- **Security Scanning**: Automatic detection of sensitive data leaks
- **Retention Management**: Automatic cleanup of backups older than 30 days
- **Verification**: Multiple validation checks for backup integrity
- **Manual Triggering**: Ability to run backups on-demand
- **Easy Restoration**: Simple script for database recovery

## 🔧 Setup

### 1. Required GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

```bash
TURSO_AUTH_TOKEN          # Your Turso authentication token
TURSO_DATABASE_NAME       # Your database name
BACKUP_ENCRYPTION_KEY     # Strong passphrase for GPG encryption
```

### 2. Generate Encryption Key

```bash
# Generate a strong encryption key
openssl rand -base64 32
```

### 3. Get Turso Auth Token

```bash
# Login and get token
turso auth login
turso auth token
```

## 📁 Backup Structure

```
backups/
├── backup-2025-08-28.sql.gpg              # Encrypted backup file
├── backup-2025-08-28-manifest.json        # Backup metadata
├── backup-2025-08-27.sql.gpg
├── backup-2025-08-27-manifest.json
└── ...
```

### Manifest Example

```json
{
	"timestamp": "2025-08-28T02:00:00Z",
	"date": "2025-08-28",
	"database_name_hash": "a1b2c3d4e5f6...",
	"backup_file": "backup-2025-08-28.sql.gpg",
	"backup_size_bytes": 1048576,
	"encrypted": true,
	"encryption_algo": "AES256",
	"commit_sha": "abc123...",
	"runner_id": "12345",
	"workflow_run_id": "67890",
	"backup_status": "success"
}
```

## 🔄 Restoration

### Using NPM Scripts (Recommended)

```bash
# Set your encryption key
export BACKUP_ENCRYPTION_KEY='your-encryption-key'

# List all available backups
npm run backup:list

# Get detailed info about a backup
npm run backup:info 2025-08-28

# Verify backup integrity
npm run backup:verify 2025-08-28

# Restore a backup (interactive)
npm run backup:restore 2025-08-28
```

### Using the Restoration Script Directly

```bash
# Make script executable
chmod +x tools/restore-backup.sh

# Set your encryption key
export BACKUP_ENCRYPTION_KEY='your-encryption-key'

# Restore a specific backup
./tools/restore-backup.sh 2025-08-28 your-database-name

# Interactive mode (will prompt for database name)
./tools/restore-backup.sh 2025-08-28
```

### Manual Restoration

```bash
# 1. Decrypt the backup
gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
    backups/backup-2025-08-28.sql.gpg > restore.sql

# 2. Create database if needed
turso db create your-database-name

# 3. Import to Turso
turso db shell your-database-name < restore.sql
```

## 🔒 Security Features

### Encryption

- **AES256 symmetric encryption** for all backup files
- **No plaintext data** stored in repository
- **Encrypted in transit** and at rest

### Access Control

- **Minimal GitHub Actions permissions**
- **Environment variable security**
- **No secrets in logs or output**

### Data Protection

- **Database name hashing** in manifests
- **Automatic sensitive data scanning**
- **Supply chain security** with pinned versions

### Monitoring

- **Backup size verification**
- **File integrity checks**
- **Empty backup detection**
- **Automatic cleanup validation**

## 📊 Monitoring & Alerts

### Backup Status

Monitor backup health through:

- GitHub Actions workflow status
- Commit messages with backup details
- Manifest files for metadata

### Manual Backup Trigger

```bash
# Trigger backup manually via GitHub API
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/turso-backup.yml/dispatches \
  -d '{"ref":"main"}'
```

## 🛠️ Maintenance

### Backup Retention

- **Default**: 30 days
- **Configurable**: Edit `CUTOFF_DATE` in workflow
- **Manual cleanup**: Remove files from `backups/` directory

### Version Updates

1. Check [Turso CLI releases](https://github.com/tursodatabase/turso-cli/releases)
2. Update `TURSO_VERSION` in workflow
3. Update checksum verification

### Key Rotation

1. Generate new encryption key: `openssl rand -base64 32`
2. Update `BACKUP_ENCRYPTION_KEY` secret
3. Re-encrypt existing backups if needed

## 🚨 Troubleshooting

### Common Issues

**Authentication Failed**

```bash
# Verify token is valid
turso auth whoami

# Check token permissions
turso db list
```

**Decryption Failed**

```bash
# Verify encryption key
gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
    backups/backup-YYYY-MM-DD.sql.gpg | head -5
```

**Empty Backup**

- Check database permissions
- Verify database exists and has data
- Check workflow logs for errors

### Backup Verification

```bash
# List all backups with status
npm run backup:list

# Verify specific backup integrity
npm run backup:verify 2025-08-28

# Get detailed backup information
npm run backup:info 2025-08-28

# Or use the scripts directly:
# Check backup file size
ls -lh backups/backup-*.sql.gpg

# Verify manifest data
cat backups/backup-YYYY-MM-DD-manifest.json | jq

# Test decryption without restoring
gpg --decrypt --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" \
    backups/backup-YYYY-MM-DD.sql.gpg | wc -l
```

## 📈 Best Practices

1. **Regular Testing**: Periodically test restoration process
2. **Monitor Storage**: Keep an eye on repository size
3. **Key Security**: Store encryption keys securely
4. **Access Review**: Regularly audit GitHub secrets
5. **Backup Validation**: Check backup integrity after major changes

## 🔗 Related Documentation

- [Turso CLI Documentation](https://docs.turso.tech/reference/turso-cli)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [GPG Encryption Guide](https://gnupg.org/documentation/)
