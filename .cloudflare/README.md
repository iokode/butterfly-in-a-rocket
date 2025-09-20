# IOKode Blog - Cloudflare Worker Deployment

This directory contains the Cloudflare Worker implementation for the IOKode Blog, which serves static assets using
Cloudflare's static assets feature and handles the comments API.

## Features

- **Static Asset Serving**: Serves all blog content (HTML, CSS, JS, images) using Cloudflare's static assets feature
- **Comments API**: Handles `/comments` endpoint with GitHub Discussions integration
- **Simple Deployment**: No database or KV storage required - just static assets
- **404 Handling**: Automatic handling by Cloudflare's static assets

## Prerequisites

1. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
2. Cloudflare account with Workers enabled
3. GitHub Personal Access Token with appropriate permissions

## Setup Instructions

### 1. Install Wrangler (if not already installed)

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Set GitHub Token Secret

```bash
wrangler secret put GITHUB_TOKEN
```

Enter your GitHub Personal Access Token when prompted. The token needs these permissions:
- `public_repo`
- `read:discussion`

### 4. Build the Blog

From the project root directory:

```bash
npm run build
```

This will generate the static files in the `dist/` directory.

### 5. Deploy the Worker

```bash
cd .cloudflare
wrangler deploy
```

The static assets will be automatically deployed from the `../dist` directory as configured in `wrangler.toml`.

## Development and Local Testing

For the most accurate testing environment that mimics Cloudflare Workers:

```bash
# First, build the blog from the project root
npm run build

# Then start the local development server
cd .cloudflare
wrangler dev --local
```

This will start a local development server at `http://localhost:8787` that:
- Serves static assets from the `../dist` directory
- Handles the `/comments` endpoint with GitHub API integration
- Mimics the Cloudflare Workers environment

### Updating and Deploying

After making changes to the blog content:

1. Rebuild the site: `npm run build`
2. Deploy: `cd .cloudflare && wrangler deploy`

The static assets are automatically updated during deployment.