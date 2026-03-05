# Get Vercel Project IDs

## Option 1: From Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on "webapp" project
3. Go to Settings → General
4. Copy the **Project ID** (looks like `prj_xxxxxxxxxxxxx`)
5. Copy the **Team/Org ID** from your account settings

## Option 2: Using Vercel CLI
If you have Vercel CLI installed locally:

```bash
# Link to the webapp project
cd c:/Users/htsir/src/eve-market-web-app
vercel link

# This will create .vercel/project.json with:
# - orgId
# - projectId
```

Then run:
```bash
cat .vercel/project.json
```

## Add to GitHub Secrets

Once you have the IDs, add them to GitHub:
1. Go to https://github.com/tsigaro/eve-market-web-app/settings/secrets/actions
2. Click "New repository secret"
3. Add:
   - Name: `VERCEL_ORG_ID`, Value: (your org ID)
   - Name: `VERCEL_PROJECT_ID`, Value: (your project ID)

Then I'll update the workflow to use them!
