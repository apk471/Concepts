# GitHub Actions

GitHub Actions is GitHub's automation platform. You define workflows in YAML files, and GitHub runs them when repository events happen.

---

## Brief

GitHub Actions is commonly used for:

- CI checks on pull requests
- Building backend services
- Running tests
- Publishing Docker images
- Deploying services
- Scheduled jobs
- Dependency checks

The workflow files live in:

```text
.github/workflows/
```

Example:

```text
.github/
  workflows/
    ci.yml
    docker-publish.yml
    deploy.yml
```

---

## Basic Workflow Structure

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run tests
        run: npm test
```

Important top-level keys:

| Key | Meaning |
| --- | --- |
| `name` | Display name of the workflow |
| `on` | Events that trigger the workflow |
| `permissions` | Token permissions for the workflow |
| `env` | Environment variables shared across jobs |
| `defaults` | Default shell/working directory |
| `jobs` | Work to run |
| `concurrency` | Prevent duplicate/conflicting runs |

---

## The `.github` Folder

The `.github` folder stores GitHub-specific repository automation and metadata.

Common contents:

```text
.github/
  workflows/
    ci.yml
    release.yml
  ISSUE_TEMPLATE/
  PULL_REQUEST_TEMPLATE.md
  dependabot.yml
```

Most important for CI/CD:

```text
.github/workflows/*.yml
```

GitHub automatically detects workflow YAML files in that directory.

---

## YAML Basics

YAML is indentation-sensitive.

Rules:

- Use spaces, not tabs.
- Indentation defines nesting.
- Lists use `-`.
- Strings usually do not need quotes.
- Use quotes when strings contain special characters.

Example:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: First step
        run: echo "hello"
      - name: Second step
        run: echo "world"
```

Common mistake:

```yaml
jobs:
test:
```

Correct:

```yaml
jobs:
  test:
```

---

## Events: `on`

The `on` key controls when workflows run.

Common events:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * *"
```

Important events:

| Event | Use |
| --- | --- |
| `push` | Run on pushes to branches/tags |
| `pull_request` | Run on PR open/sync/reopen |
| `workflow_dispatch` | Manual button in GitHub UI |
| `schedule` | Cron-based runs |
| `release` | Run when a GitHub release is created |
| `workflow_call` | Reusable workflows |

---

## Jobs

Jobs are independent units of work.

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

Jobs run in parallel by default.

To make one job wait for another:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t app .
```

Important job keys:

| Key | Meaning |
| --- | --- |
| `runs-on` | Runner machine |
| `steps` | Commands/actions to run |
| `needs` | Job dependencies |
| `if` | Conditional execution |
| `env` | Job environment variables |
| `outputs` | Values passed to other jobs |
| `services` | Extra containers like Postgres/Redis |
| `strategy` | Matrix builds |
| `timeout-minutes` | Max job runtime |

---

## Steps

Steps run sequentially inside a job.

Two main step types:

```yaml
- uses: actions/checkout@v4
- run: npm test
```

`uses` runs a reusable action.

`run` runs shell commands.

Common step keys:

| Key | Meaning |
| --- | --- |
| `name` | Display name |
| `uses` | Run an action |
| `run` | Run shell command |
| `with` | Inputs for an action |
| `env` | Environment variables for the step |
| `working-directory` | Directory to run in |
| `if` | Conditional step |

---

## Common Actions

Useful actions:

| Action | Use |
| --- | --- |
| `actions/checkout@v4` | Checkout repository code |
| `actions/setup-node@v4` | Install Node.js |
| `actions/setup-go@v5` | Install Go |
| `actions/setup-python@v5` | Install Python |
| `docker/setup-buildx-action@v3` | Enable advanced Docker builds |
| `docker/login-action@v3` | Login to container registry |
| `docker/build-push-action@v6` | Build and push Docker images |
| `actions/cache@v4` | Cache dependencies |
| `actions/upload-artifact@v4` | Upload build/test artifacts |
| `actions/download-artifact@v4` | Download artifacts |

---

## Expressions and Contexts

Expressions use `${{ ... }}`.

Examples:

```yaml
${{ github.sha }}
${{ github.ref_name }}
${{ github.event_name }}
${{ secrets.DOCKERHUB_TOKEN }}
${{ env.IMAGE_NAME }}
```

Common contexts:

| Context | Contains |
| --- | --- |
| `github` | Repo, branch, commit, actor, event |
| `env` | Environment variables |
| `secrets` | Secret values |
| `vars` | Repository/org variables |
| `matrix` | Matrix values |
| `needs` | Outputs from dependency jobs |
| `steps` | Step outputs |

---

## Secrets and Variables

Secrets are configured in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions
```

Use secrets like:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Rules:

- Never hardcode secrets in YAML.
- Never print secrets.
- Use least privilege tokens.
- Use environment-specific secrets for staging/prod.

---

## Matrix Builds

Matrix runs the same job with multiple versions/configurations.

Example:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

Backend use cases:

- Test multiple Node versions
- Test multiple Go versions
- Test multiple databases
- Test multiple OS targets

---

## Service Containers

Use services for dependencies like Postgres and Redis in CI.

Example:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
```

---

## Permissions

Set workflow token permissions explicitly.

Example:

```yaml
permissions:
  contents: read
  packages: write
```

Common permissions:

| Permission | Use |
| --- | --- |
| `contents: read` | Checkout/read repo |
| `contents: write` | Push tags/releases/commits |
| `packages: write` | Publish packages/images |
| `pull-requests: write` | Comment/update PRs |
| `id-token: write` | OIDC cloud auth |

Prefer least privilege.

---

## Concurrency

Prevent multiple runs from fighting each other.

Example:

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

Useful for:

- Deployment workflows
- Expensive test suites
- Preview environment updates

---

## Docker Image Publish Example

```yaml
name: Publish Docker Image

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write

env:
  IMAGE_NAME: ghcr.io/${{ github.repository }}/api

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.IMAGE_NAME }}:latest
```

---

## Important Backend Tips

- Run the same command locally and in CI when possible.
- Keep CI logs readable.
- Use dependency caching, but do not cache broken state blindly.
- Keep secrets out of repo and Docker images.
- Use PR checks as a merge gate.
- Tag Docker images with commit SHA.
- Avoid deploying untested images.
- Add integration tests for database/cache-heavy services.
- Make production deployments require explicit approval until the pipeline is mature.

