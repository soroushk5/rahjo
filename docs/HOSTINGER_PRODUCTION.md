# Hostinger production deployment

## Source-of-truth contract

- `main` is the canonical source branch. It contains source, tests, build scripts, workflows, and documentation.
- `hostinger-production` is a generated deployment branch. It contains only the static files built from a quality-checked `main` commit.
- Hostinger production must connect to the existing `soroushk5/rahjo` repository and the `hostinger-production` branch.
- Do not edit `hostinger-production` or production files manually. Product or deployment fixes start on `main`, pass validation, and are published by GitHub Actions.

The production branch is updated with normal commits. Its history is not force-rewritten.
The preview publication workflow follows the same history-preserving rule.

## GitHub configuration

The repository variable `RAHJO_PRODUCTION_ORIGIN` must contain the final HTTPS origin without a trailing slash or path.

After the `Quality` workflow succeeds on `main`, `Publish Hostinger Production Branch`:

1. builds with `DEPLOY_MODE=production`;
2. embeds the checked source commit in `health.json`;
3. verifies production indexing, canonical URL, sitemap, root-relative assets, and SPA fallback;
4. commits the generated files to `hostinger-production`.

## Hostinger configuration

- Repository: `git@github.com:soroushk5/rahjo.git` or the equivalent HTTPS repository URL
- Branch: `hostinger-production`
- Target directory: the website document root (`public_html`)
- Build/install command: none; the generated branch already contains the deployable static site
- Runtime: static Apache hosting with `.htaccess`
- Database: none

Enable Hostinger automatic deployment for pushes to `hostinger-production` when the plan exposes a branch-scoped webhook. Otherwise, use Hostinger's Git deployment action against that same branch.

## Acceptance

Verify `/health.json` reports `status: ok`, `deploymentMode: production`, and the intended `main` source commit. Then test direct refreshes for `/`, `/platform`, `/atlas`, `/trust`, `/login`, `/dashboard`, `/request`, and `/map`, plus HTTPS, assets, console, and network requests.
