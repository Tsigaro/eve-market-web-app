# How to Get Your Vercel Project ID

## Step 1: Get the Project ID

Go to Vercel dashboard:
1. Open https://vercel.com/dashboard
2. Click on the **"webapp"** project (webapp-vert-ten.vercel.app)
3. Go to **Settings** → **General**
4. Scroll down to find **"Project ID"**
5. Copy the ID (starts with `prj_...`)

## Step 2: Add to GitHub Secrets

1. Go to: https://github.com/tsigaro/eve-market-web-app/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `VERCEL_PROJECT_ID`
4. Value: (paste the project ID you copied)
5. Click **"Add secret"**

## Step 3: I'll Update the Workflow

Once you've added the secret, tell me and I'll update the workflow to use it.
This will prevent Vercel from auto-creating new projects!

---

## Alternative: Use Vercel Dashboard Settings

If you don't want to add the project ID:
1. Go to the **"webapp"** project settings
2. Go to **Git** → **Connected Git Repository**
3. Make sure it's connected to `tsigaro/eve-market-web-app`
4. Set **Production Branch**: `main`
5. This should help Vercel auto-detect the right project

But adding the project ID is the most reliable solution!
