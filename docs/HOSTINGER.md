# Hostinger deployment

## Recommended MVP path

This repository is a static ES-module website. Deploy the repository root to the website document root. The included `.htaccess` provides SPA fallback for `/dashboard` and `/request`.

## GitHub-first flow

1. Create a private GitHub repository.
2. Push this code to `main`.
3. In Hostinger hPanel, connect the Git repository or import the GitHub repository.
4. Set the deployment path to `public_html` or the target subdomain root.
5. Confirm that `.htaccess` is copied.
6. Enable SSL and test all routes directly.

## Future dynamic app

When real authentication or API orchestration is introduced, deploy the backend separately as a managed Node.js Web App or VPS service. The frontend should continue consuming a stable gateway contract.
