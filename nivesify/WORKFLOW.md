# Nivesify Development Workflow Guide

## 🌐 Environments

### Production
- **URL**: https://nivesify.com (your custom domain)
- **Worker**: `nivesify`
- **Database**: nivesify-db (bafa9d4f-99ca-450c-8723-a16d034bfe50)
- **Deploy**: `npm run deploy`

### Staging
- **URL**: https://nivesify-staging.kvimal24.workers.dev
- **Worker**: `nivesify-staging`
- **Database**: Same as production (shared)
- **Deploy**: `npm run deploy:staging`

---

## 🚀 Daily Development Workflow

### 1. Create Feature Branch
```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Develop Locally
```bash
# Start local dev server
npm run dev

# Test at http://localhost:3000
```

### 3. Deploy to Staging
```bash
# Build and deploy to staging
npm run deploy:staging

# Test at https://nivesify-staging.kvimal24.workers.dev
```

### 4. Test Thoroughly on Staging
- ✅ Test all new features
- ✅ Test Google login
- ✅ Test database operations
- ✅ Test on mobile & desktop
- ✅ Check console for errors

### 5. Merge to Main & Deploy to Production
```bash
# If tests pass, commit your changes
git add .
git commit -m "feat: describe your feature"
git push origin feature/your-feature-name

# Merge to main (via GitHub PR or directly)
git checkout main
git merge feature/your-feature-name
git push origin main

# Deploy to production
npm run deploy
```

---

## 🆘 Emergency Rollback

If production breaks after deployment:

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main
npm run deploy

# Option 2: Hard reset to previous commit
git log  # Find the good commit hash
git reset --hard <good-commit-hash>
git push origin main --force
npm run deploy
```

---

## 🔧 Useful Commands

### Check Deployment Status
```bash
# List all workers
npx wrangler deployments list

# Check staging secrets
npx wrangler secret list -c wrangler.staging.jsonc

# Check production secrets
npx wrangler secret list
```

### Database Operations
```bash
# Run migrations on production
npx wrangler d1 migrations apply nivesify-db --remote

# Query database directly
npx wrangler d1 execute nivesify-db --remote --command "SELECT * FROM users LIMIT 5"
```

### Logs & Debugging
```bash
# Tail staging logs
npx wrangler tail nivesify-staging

# Tail production logs
npx wrangler tail nivesify
```

---

## 📊 Cost Information

Both environments run on Cloudflare's **FREE tier**:
- ✅ 100,000 requests/day FREE
- ✅ 5M database reads/day FREE
- ✅ 100k database writes/day FREE

Staging adds **$0/month** cost for typical usage.

---

## 🔐 Secrets Management

### View Secrets
```bash
# Staging
npx wrangler secret list -c wrangler.staging.jsonc

# Production
npx wrangler secret list
```

### Update Secrets
```bash
# Update staging secret
echo "new_value" | npx wrangler secret put SECRET_NAME -c wrangler.staging.jsonc

# Update production secret
echo "new_value" | npx wrangler secret put SECRET_NAME
```

### Required Secrets
Both environments need:
- `NEXT_PUBLIC_BASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

---

## ⚠️ Important Notes

### Database
- ✅ Staging and production share the same database
- ⚠️ Test data will appear in both environments
- ⚠️ Be careful with destructive operations
- 💡 For safer testing, create a separate staging DB in the future

### Google OAuth
Both redirect URIs are configured:
- Production: Your custom domain callback
- Staging: https://nivesify-staging.kvimal24.workers.dev/api/auth/callback/google

### Branch Strategy
- `main` = Production-ready code
- `feature/*` = New features (test on staging first)
- `hotfix/*` = Urgent fixes (test quickly on staging)

---

## 🎯 Best Practices

1. **Never deploy directly to production without testing on staging first**
2. **Always test Google login on staging after OAuth changes**
3. **Keep main branch clean** - only merge tested code
4. **Use descriptive commit messages**: `feat:`, `fix:`, `chore:`
5. **Monitor logs** after production deployment for 5-10 minutes
6. **Keep secrets in `.dev.vars`** (already gitignored)

---

## 🎓 Example: Adding New Feature

```bash
# 1. Create branch
git checkout -b feature/add-tabs-to-landing

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run dev

# 4. Deploy to staging
npm run deploy:staging
# Visit: https://nivesify-staging.kvimal24.workers.dev

# 5. If good, merge and deploy
git add .
git commit -m "feat: add tabs to landing page"
git push origin feature/add-tabs-to-landing
git checkout main
git merge feature/add-tabs-to-landing
git push origin main
npm run deploy
```

---

## 📞 Need Help?

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **OpenNext Docs**: https://opennext.js.org/cloudflare
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Last Updated**: February 7, 2026
**Setup By**: GitHub Copilot
