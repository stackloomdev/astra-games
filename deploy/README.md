# ECS automatic deployment

`main` pushes build and publish the commit at the tip of that push. Pull requests
run the same tests, build, and runtime checks without receiving cloud credentials.
The workflow can also be started manually from GitHub Actions on `main`.

## GitHub configuration

In **Settings → Secrets and variables → Actions**, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | Deployment RAM user's AccessKey ID |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | Matching AccessKey Secret |

Create a deployment-specific RAM user and apply the official minimum Workbench
permissions. Restrict instance-scoped permissions to the target ECS where
supported. Never use an Alibaba Cloud account owner key. Keep the credentials in
GitHub Secrets; do not put them in source files, Actions variables, release
archives, screenshots, or chat messages.

Add these non-secret repository **Variables**:

| Variable | Value |
| --- | --- |
| `ECS_INSTANCE_ID` | Target Linux ECS instance ID |
| `ECS_REGION` | Target region, for example `cn-hangzhou` |

References: [Workbench credential configuration](https://help.aliyun.com/en/ecs/user-guide/install-and-configure-workbench-cli-credentials),
[GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Pipeline

1. GitHub's Ubuntu x64 runner installs Node.js `24.21.0`, runs `npm ci`, JavaScript
   tests and Python tests. Official GitHub Actions are pinned to commit SHAs.
2. A loopback-only copy of `catalog-mirror.py` reads all registered locale READMEs
   and raster screenshots from the upstream's official codeload archive. Every
   locale must be ready before building. The existing bounded cover builder runs
   before Next.js; unavailable external cover sources retain their normal fallback.
3. Next.js standalone output includes `public` and `.next/static`. CI starts that
   exact package and checks locale redirects, all language pages and fresh APIs,
   JavaScript/CSS, built WebP covers, original screenshot previews, and editorial
   pages. The build ID and `/api/health` identify the exact commit.
4. Only the standalone runtime and an explicit deployment file allowlist are
   archived. `.git`, `.env*`, local cloud credentials and build caches are excluded.
   The deploy job creates a temporary mode-0600 Workbench credential file after
   building; it is never included in the artifact and is removed after use.
5. Workbench uploads to a unique root-only staging directory and verifies SHA256.
   Existing matching files can be reused after a transport interruption; different
   files are never silently overwritten.
6. A systemd transaction takes a server deployment lock, extracts into a new
   version directory and tests the app on loopback port 3101 with a separate mirror
   on 3032. Successful activation atomically switches `current` and restarts the
   application. Post-deploy checks cover both Next.js and the local Nginx proxy.
7. Failed activation restores the prior symlink, launcher and both systemd units,
   then restarts the previous app. Upstream failure does not block application
   recovery; rollback health checks accept its normal catalogue fallback.
   The launcher supports the initial source-based release for the first rollback.
   Unchanged mirror code and locale registry preserve its running last-good cache.

Production workflows queue rather than interrupt an in-progress release. A
persisted workflow sequence also rejects late arrivals or duplicate completed
deployments. If a runner disconnects, systemd continues the server transaction.
The server transaction removes its uploaded staging archive on completion.

## Server prerequisites

The server is already provisioned with Node.js `24.21.0` at
`/opt/node-v24.21.0`, Python 3.12 or newer, an `astra-games` account, Nginx,
and these services:

- `astra-games.service`, loopback port 3000.
- `astra-catalog-mirror.service`, loopback port 3031.

Versions live under `/opt/astra-games/releases`; `/opt/astra-games/current` is an
atomic symlink. The installer updates only the application's launcher and two
systemd units. The existing Nginx, DNS and certificate configuration remains
managed separately. A deployment has a brief application restart window.

The production mirror continues refreshing upstream READMEs and original images
every 240 seconds. Code deployments rebuild static WebP covers; their existing
three-day source cache is not copied between CI runs, so each new CI deployment
fetches the current source images. Upstream-only changes continue through the
runtime preview API until the next code deployment.

## Recovery

Keep the latest five successful installer-managed versions. Initial manual
releases are retained. Each successful log prints `DEPLOY_OK: <release-id>`.

To roll back, open **Actions → ECS deployment → Run workflow**, select `main`,
choose `rollback`, and enter a retained successful release ID. The rollback is
staged, checked and published using the same transaction. A new workflow sequence
prevents an older queued deployment from undoing the rollback.

For initial source-based recovery, an operator can point `current` back to the
retained manual release and restart the application; `start-app.sh` detects that
layout automatically. Never rebuild `.next` inside the active release.

View application logs with `journalctl -u astra-games`; mirror logs with
`journalctl -u astra-catalog-mirror`; transaction logs with
`journalctl -u astra-deploy-<run-id>-<attempt>`.
