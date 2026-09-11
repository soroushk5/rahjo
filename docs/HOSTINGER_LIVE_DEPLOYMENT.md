# Hostinger live deployment contract

The `hostinger-production` branch is a generated deployment artifact. Updating that branch is **not** sufficient evidence that the public Hostinger site has changed.

Production is considered deployed only when the public origin returns `/health.json` with a `buildSha`/`commit` equal to the source SHA that produced the generated branch.

## Hostinger hPanel requirement

Configure the public website's Git deployment to:

- repository: `soroushk5/rahjo`
- branch: `hostinger-production`
- install path: public web root (`/public_html`, or the site's actual document root)
- Auto Deployment: enabled

Hostinger provides an Auto Deployment webhook URL from hPanel. Store that URL in GitHub Actions as the repository secret:

`HOSTINGER_PRODUCTION_DEPLOY_WEBHOOK`

The production workflow invokes this webhook after it pushes the generated branch and then verifies the live origin.

## Evidence rule

Do not write `production deployed`, `production verified`, or equivalent into Task OS based only on:

- GitHub Quality success;
- build/smoke success;
- a new `hostinger-production` commit.

Required evidence is a successful read from the live public origin showing the expected source SHA.
