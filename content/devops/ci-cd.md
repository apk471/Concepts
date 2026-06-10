# CI/CD Pipelines

CI/CD is the automation system that takes backend code from a commit to a verified, packaged, and sometimes deployed service.

---

## Brief

CI/CD stands for:

- Continuous Integration
- Continuous Delivery
- Continuous Deployment

The main idea is simple: every code change should go through the same repeatable checks. Humans should not manually remember all the steps needed to test, package, and deploy a backend service.

---

## CI: Continuous Integration

CI validates changes frequently, usually on every push or pull request.

Common CI steps:

- Checkout code
- Install dependencies
- Run formatter check
- Run linter
- Run unit tests
- Run integration tests
- Build the app
- Build Docker image
- Upload test reports or build artifacts

Backend examples:

- Go: `go test ./...`
- Node.js: `npm ci && npm test`
- Python: `pip install -r requirements.txt && pytest`
- Java: `mvn test` or `gradle test`

CI answers:

```text
Is this code safe enough to merge?
```

---

## CD: Continuous Delivery

Continuous Delivery means the code is always kept in a deployable state.

Usually:

- CI passes
- Docker image is built
- Artifact is published
- Deployment can be triggered manually

CD answers:

```text
Can this code be deployed safely when we choose?
```

---

## CD: Continuous Deployment

Continuous Deployment means every change that passes checks is automatically deployed.

Typical flow:

```text
Merge to main
  -> run tests
  -> build image
  -> push image
  -> deploy staging/production automatically
```

This is powerful, but only safe when tests, monitoring, and rollback are strong.

---

## Common Pipeline Stages

### 1. Source

The pipeline starts from an event:

- Push to branch
- Pull request opened
- Merge to `main`
- Tag pushed
- Manual trigger
- Scheduled run

### 2. Validate

Fast checks that catch common problems:

- Formatting
- Linting
- Type checks
- Static analysis
- Dependency audit

### 3. Test

Backend test layers:

- Unit tests: isolated functions/classes
- Integration tests: database, cache, queues
- Contract tests: API compatibility
- End-to-end tests: full request path

### 4. Build

Create the deployable artifact:

- Binary
- JAR/WAR file
- Docker image
- Serverless bundle

### 5. Package

Attach version metadata:

- Git SHA
- Branch name
- Semver tag
- Build number
- Docker image tag

### 6. Publish

Push artifact somewhere:

- Docker Hub
- GitHub Container Registry
- AWS ECR
- GCP Artifact Registry
- GitHub Actions artifacts

### 7. Deploy

Update runtime environment:

- VM
- Kubernetes
- ECS
- Cloud Run
- Heroku/Fly.io/Render
- Bare-metal server

### 8. Verify

After deployment:

- Health check
- Smoke test
- Logs check
- Metrics check
- Error rate check

---

## Backend-Specific Best Practices

### Keep Pipelines Fast

PR pipelines should be fast enough that developers do not avoid them.

Good target:

- Unit tests: under a few minutes
- Full integration suite: acceptable if slower, but separate when needed

### Separate PR Checks from Release Checks

PR checks:

- Lint
- Unit tests
- Build
- Lightweight integration tests

Release checks:

- Full integration tests
- Docker image publish
- Security scan
- Deployment

### Use Environment Parity

Keep local, CI, staging, and production as similar as possible.

Docker helps because the same image can run everywhere.

### Make Rollback Easy

Always know:

- Which image version is deployed
- Which commit created it
- How to redeploy the previous version
- Whether database migrations are backward-compatible

### Treat Database Migrations Carefully

Backend deployments often fail because app code and database schema change together.

Safer pattern:

1. Add backward-compatible schema change.
2. Deploy code that can work with both old and new schema.
3. Backfill data if needed.
4. Remove old schema in a later release.

---

## Pipeline Inputs and Outputs

Inputs:

- Git commit
- Branch
- Pull request
- Environment variables
- Secrets
- Config files

Outputs:

- Test results
- Logs
- Build artifacts
- Docker images
- Deployment status
- Notifications

---

## Important Concepts

### Artifact

Something produced by the pipeline.

Examples:

- Compiled binary
- Test report
- Coverage report
- Docker image
- ZIP bundle

### Cache

Saved dependencies or build outputs reused between runs.

Examples:

- npm cache
- Go build cache
- Maven cache
- Docker layer cache

### Secret

Sensitive value injected at runtime.

Examples:

- API key
- Database password
- Docker registry token
- Cloud credentials

Never commit secrets.

### Environment

Target place where code runs.

Examples:

- development
- staging
- production

### Promotion

Moving the same build from one environment to another.

Good:

```text
Build once -> deploy same artifact to staging -> promote same artifact to production
```

Risky:

```text
Build separately for staging and production
```

---

## Useful Pipeline Patterns

### Build Once, Deploy Many

Build the Docker image once and promote it across environments.

Why it matters:

- Same artifact tested in staging is used in production.
- Fewer "works in staging, fails in prod" surprises.

### Fail Fast

Put cheap checks first.

Example:

```text
format -> lint -> unit tests -> build image -> integration tests -> deploy
```

### Manual Production Approval

For early-stage teams, use automatic staging deploys and manual production approval.

### Preview Environments

Spin up temporary environments per PR.

Useful for:

- API review
- Frontend-backend integration
- QA testing

---

## What a Backend Developer Should Know

- How to read a failing pipeline log
- How to reproduce the failing command locally
- How secrets are passed safely
- How Docker images are tagged and published
- How integration dependencies are started in CI
- How deployments are triggered
- How to identify which commit is in production
- How to rollback safely

