# GitHub Actions Deployment

This repository includes a GitHub Action workflow for manual deployment to Cloudflare Workers.

## Required Secrets

Before using the deployment workflow, you need to configure the following secrets in your GitHub repository:

### `CLOUDFLARE_API_TOKEN`
- A Cloudflare API token with permissions to deploy to Cloudflare Workers
- To create this token:
  1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  2. Click "Create Token"
  3. Use the "Custom token" template
  4. Add permissions:
     - Account: `Cloudflare Workers:Edit`
     - Zone: `Zone:Read` (for your domain)
  5. Set Account Resources to include your account
  6. Copy the generated token

### `CLOUDFLARE_ACCOUNT_ID`
- Your Cloudflare Account ID
- To find this:
  1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
  2. Select your account
  3. The Account ID is shown in the right sidebar