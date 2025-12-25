# SSH Key Troubleshooting - Hetzner Cloud

## Issue: SSH Key Added via GUI but Not Visible in authorized_keys

When you add an SSH key via Hetzner Cloud Console, it's managed by cloud-init and may not appear in the standard `~/.ssh/authorized_keys` file immediately.

## Solution Steps

### Step 1: Check Multiple Locations

SSH keys added via Hetzner GUI can be in several places:

```bash
# Check root's authorized_keys
cat /root/.ssh/authorized_keys

# Check if cloud-init created it
cat /var/lib/cloud/instances/*/user-data.txt

# Check cloud-init logs
cat /var/log/cloud-init.log | grep -i ssh

# Check for other users
ls -la /home/*/.ssh/authorized_keys

# Check if key is in cloud-init's authorized_keys
cat /var/lib/cloud/instances/*/user-data.txt | grep -A 5 ssh_authorized_keys
```

### Step 2: Check Which User the Key Was Added To

Hetzner may have added the key to a specific user, not root:

```bash
# Check for ubuntu user
cat /home/ubuntu/.ssh/authorized_keys

# Check for any user with .ssh directory
find /home -name authorized_keys 2>/dev/null

# List all users
cat /etc/passwd | grep -E "/bin/(bash|sh)$"
```

### Step 3: Manually Add Key to Root (If Needed)

If the key isn't in root's authorized_keys, add it manually:

```bash
# Access server via Hetzner Console (web-based terminal)
# Or use password authentication if available

# Once logged in as root:
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add your public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGxhWi0PrKtzygp8zimCepdwB0YX0Nm1KxWEWFMGMehl rahul.tomar@digitaltwin.technology" >> /root/.ssh/authorized_keys

# Set correct permissions
chmod 600 /root/.ssh/authorized_keys
chown root:root /root/.ssh/authorized_keys
```

### Step 4: Verify SSH Configuration

```bash
# Check SSH daemon config
cat /etc/ssh/sshd_config | grep -E "PermitRootLogin|PubkeyAuthentication|AuthorizedKeysFile"

# Should show:
# PermitRootLogin yes (or without-password)
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys

# Restart SSH if you made changes
sudo systemctl restart sshd
```

### Step 5: Test Connection

From your local machine:

```bash
# Test with verbose output
ssh -v -i ~/.ssh/garuda-travel root@91.98.39.11

# If root doesn't work, try other users
ssh -v -i ~/.ssh/garuda-travel ubuntu@91.98.39.11
```

## Alternative: Use Hetzner Console to Add Key

1. **Access Hetzner Cloud Console**
   - Go to https://console.hetzner.cloud/
   - Click on your server (91.98.39.11)
   - Click "Console" tab

2. **Log in with root password** (if you have it)

3. **Add key manually**:
   ```bash
   mkdir -p /root/.ssh
   echo "YOUR_PUBLIC_KEY_HERE" >> /root/.ssh/authorized_keys
   chmod 600 /root/.ssh/authorized_keys
   chmod 700 /root/.ssh
   ```

## Common Hetzner Cloud Issues

### Issue 1: Key Added to Wrong User

Hetzner may add keys to the default user (often `ubuntu` or `root`), but you're trying to connect as a different user.

**Solution**: Try connecting as the user Hetzner created:
```bash
ssh -i ~/.ssh/garuda-travel ubuntu@91.98.39.11
```

### Issue 2: Cloud-Init Not Run Yet

If the server was just created, cloud-init may not have finished processing.

**Solution**: Wait a few minutes and check cloud-init status:
```bash
# On server
cloud-init status
```

### Issue 3: Root Login Disabled

Some Hetzner images disable root login by default.

**Solution**: Enable root login or use sudo:
```bash
# On server, edit SSH config
sudo nano /etc/ssh/sshd_config

# Change:
PermitRootLogin yes

# Restart SSH
sudo systemctl restart sshd
```

## Quick Diagnostic Script

Run this on the server to find where keys are:

```bash
#!/bin/bash
echo "=== Checking SSH Key Locations ==="
echo ""
echo "1. Root authorized_keys:"
cat /root/.ssh/authorized_keys 2>/dev/null || echo "Not found"
echo ""
echo "2. Ubuntu user authorized_keys:"
cat /home/ubuntu/.ssh/authorized_keys 2>/dev/null || echo "Not found"
echo ""
echo "3. All authorized_keys files:"
find /home /root -name authorized_keys 2>/dev/null
echo ""
echo "4. Cloud-init user-data:"
cat /var/lib/cloud/instances/*/user-data.txt 2>/dev/null | grep -A 10 ssh
echo ""
echo "5. SSH config:"
grep -E "PermitRootLogin|PubkeyAuthentication" /etc/ssh/sshd_config
```

## Manual Key Addition (Recommended)

If GUI-added keys aren't working, manually add your key:

1. **Get your public key** (from your local machine):
   ```bash
   cat ~/.ssh/garuda-travel.pub
   ```

2. **Access server via Hetzner Console** (web terminal)

3. **Add key to root**:
   ```bash
   mkdir -p /root/.ssh
   chmod 700 /root/.ssh
   nano /root/.ssh/authorized_keys
   # Paste your public key, save and exit
   chmod 600 /root/.ssh/authorized_keys
   ```

4. **Test connection**:
   ```bash
   # From your local machine
   ssh -i ~/.ssh/garuda-travel root@91.98.39.11
   ```

## Still Not Working?

1. **Check firewall**: Ensure Hetzner firewall allows port 22 from your IP
2. **Check server logs**: `sudo tail -f /var/log/auth.log` (watch while attempting connection)
3. **Try password auth**: Temporarily enable password auth to get in, then fix key auth
4. **Contact Hetzner support**: They can help with cloud-init issues

