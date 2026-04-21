## ADDED Requirements

### Requirement: CI workflow runs on every pull request
The `.github/workflows/ci.yml` file SHALL define a GitHub Actions workflow triggered on `pull_request` to `main` that runs lint, typecheck, and build for each Node.js service (api, web, worker) using pnpm.

#### Scenario: PR passes CI checks
- **WHEN** a pull request is opened or updated against `main`
- **THEN** the CI workflow runs lint, typecheck (`tsc --noEmit`), and build for api, web, and worker — all must pass for the check to succeed

#### Scenario: TypeScript error blocks merge
- **WHEN** a pull request introduces a TypeScript type error in any service
- **THEN** the CI workflow fails and the PR is blocked from merging

### Requirement: CD workflow deploys to staging on merge to main
The `.github/workflows/cd.yml` file SHALL define a GitHub Actions workflow triggered on `push` to `main` that builds Docker images and runs a staging deploy step (stubbed as `echo "deploy to staging"` until infra is provisioned).

#### Scenario: Merge to main triggers CD
- **WHEN** a pull request is merged into `main`
- **THEN** the CD workflow runs and logs the deploy step without failing

### Requirement: CI caches pnpm store between runs
The CI workflow SHALL use `actions/cache` to cache the pnpm store directory, keyed by the OS and `pnpm-lock.yaml` hash.

#### Scenario: Subsequent CI runs use cache
- **WHEN** a PR is pushed with no changes to `pnpm-lock.yaml`
- **THEN** the pnpm install step restores from cache and completes faster than a cold install
