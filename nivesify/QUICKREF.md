# 🚀 Quick Reference - Nivesify Deployment

## Common Commands

```bash
# 🧪 TESTING
npm run dev                    # Local development (localhost:3000)
npm run deploy:staging         # Deploy to staging
npm run deploy                 # Deploy to production

# 🔍 MONITORING
npx wrangler tail nivesify-staging   # View staging logs
npx wrangler tail nivesify           # View production logs

# 🗄️ DATABASE
npx wrangler d1 execute nivesify-db --remote --command "SQL"

# 🔐 SECRETS
npx wrangler secret list -c wrangler.staging.jsonc   # List staging secrets
npx wrangler secret list                              # List prod secrets
```

## URLs

- **Staging**: https://nivesify-staging.kvimal24.workers.dev
- **Production**: https://nivesify.com

## Git Workflow

```bash
git checkout -b feature/name  # Create feature branch
npm run deploy:staging        # Test on staging
git commit -am "feat: ..."    # Commit changes
git push                      # Push branch
# Merge to main via PR or directly
npm run deploy                # Deploy to production
```

## Rollback (Emergency)

```bash
git revert HEAD && git push && npm run deploy
```

---

📖 **Full documentation**: See [WORKFLOW.md](./WORKFLOW.md)
