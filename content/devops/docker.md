# Docker for Backend Developers

Docker packages backend applications into images that can run as containers. It gives you a repeatable runtime environment for local development, CI, staging, and production.

---

## Brief

Without Docker, running a backend often means:

```text
Install language runtime
Install system packages
Install dependencies
Set environment variables
Start database/cache
Run app command
Hope versions match everyone else's machine
```

With Docker, you define the runtime once and run it consistently.

Docker is useful for:

- Running backend services consistently
- Running databases and caches locally
- Packaging apps for deployment
- Reproducing bugs
- Creating isolated dev/test environments
- Publishing versioned images

---

## Core Concepts

### Image

An image is a read-only package containing:

- Application code
- Runtime
- System dependencies
- Default command
- Filesystem layers

Think of it as a blueprint.

Example:

```bash
docker build -t my-api:dev .
```

### Container

A container is a running instance of an image.

Think of it as a process with isolation.

Example:

```bash
docker run my-api:dev
```

### Dockerfile

A Dockerfile is the recipe for building an image.

Example:

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Volume

A volume persists data outside the container lifecycle.

Use volumes for:

- Database data
- Uploaded files
- Local development mounts
- Cache directories

Example:

```bash
docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data postgres:16
```

### Docker Client

The Docker client is the CLI you use:

```bash
docker ps
docker build
docker run
docker compose up
```

The client sends commands to the Docker daemon.

### Docker Daemon

The Docker daemon does the real work:

- Builds images
- Runs containers
- Manages networks
- Manages volumes
- Pulls and pushes images

### Docker Registry

A registry stores Docker images.

Examples:

- Docker Hub
- GitHub Container Registry
- AWS ECR
- GCP Artifact Registry

Common flow:

```text
Build image locally/CI
  -> tag image
  -> push image to registry
  -> server pulls image
  -> container runs from image
```

---

## Dockerfile Important Keywords

### `FROM`

Sets the base image.

```Dockerfile
FROM golang:1.22-alpine
```

### `WORKDIR`

Sets the working directory for following commands.

```Dockerfile
WORKDIR /app
```

### `COPY`

Copies files from your repo into the image.

```Dockerfile
COPY . .
```

### `ADD`

Like `COPY`, but can also extract archives and fetch remote URLs.

Prefer `COPY` unless you specifically need `ADD`.

### `RUN`

Runs commands at image build time.

```Dockerfile
RUN npm ci
```

### `CMD`

Default command when container starts.

```Dockerfile
CMD ["node", "server.js"]
```

### `ENTRYPOINT`

Fixed executable for the container.

```Dockerfile
ENTRYPOINT ["./api"]
```

`CMD` can provide default arguments to `ENTRYPOINT`.

### `ENV`

Sets environment variables in the image.

```Dockerfile
ENV NODE_ENV=production
```

Do not bake secrets into images.

### `ARG`

Build-time variable.

```Dockerfile
ARG APP_VERSION
```

### `EXPOSE`

Documents the port the container listens on.

```Dockerfile
EXPOSE 8080
```

This does not publish the port by itself. Use `-p` at runtime.

### `VOLUME`

Declares mount point for persistent data.

```Dockerfile
VOLUME ["/data"]
```

### `USER`

Runs the app as a non-root user.

```Dockerfile
USER appuser
```

Important for production security.

### `HEALTHCHECK`

Defines how Docker checks if the container is healthy.

```Dockerfile
HEALTHCHECK CMD wget -qO- http://localhost:8080/health || exit 1
```

---

## Example Dockerfiles

### Go Backend Multi-Stage Build

```Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o api ./cmd/api

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /app/api .
EXPOSE 8080
CMD ["./api"]
```

Why multi-stage:

- Build tools stay in builder image.
- Final image is smaller.
- Production image has less attack surface.

### Node.js Backend

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Python FastAPI Backend

```Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## `.dockerignore`

Like `.gitignore`, but for Docker build context.

Example:

```text
.git
node_modules
dist
coverage
.env
*.log
```

Important because Docker sends the build context to the daemon. Large or secret files make builds slower and risky.

---

## Docker Commands

### Version and Info

```bash
docker --version
docker info
```

### Build Image

```bash
docker build -t my-api:dev .
docker build -t my-api:1.0.0 .
docker build -f Dockerfile.prod -t my-api:prod .
```

### List Images

```bash
docker images
docker image ls
```

### Run Container

```bash
docker run my-api:dev
docker run --name my-api -p 8080:8080 my-api:dev
docker run -d --name my-api -p 8080:8080 my-api:dev
docker run --rm my-api:dev
```

Common flags:

| Flag | Meaning |
| --- | --- |
| `-d` | Detached/background mode |
| `--name` | Container name |
| `-p host:container` | Publish port |
| `-e KEY=value` | Environment variable |
| `--env-file .env` | Load env vars from file |
| `-v source:target` | Mount volume/bind mount |
| `--rm` | Remove container after exit |

### See Running Containers

```bash
docker ps
docker ps -a
```

### Stop and Remove Containers

```bash
docker stop my-api
docker start my-api
docker restart my-api
docker rm my-api
docker rm -f my-api
```

### Logs and Debugging

```bash
docker logs my-api
docker logs -f my-api
docker exec -it my-api sh
docker inspect my-api
docker stats
```

### Image Tagging

```bash
docker tag my-api:dev username/my-api:1.0.0
docker tag my-api:dev username/my-api:latest
```

### Login and Publish

```bash
docker login
docker push username/my-api:1.0.0
docker push username/my-api:latest
```

### Pull Image

```bash
docker pull postgres:16
docker pull redis:7
docker pull username/my-api:1.0.0
```

### Cleanup

```bash
docker system df
docker container prune
docker image prune
docker volume prune
docker system prune
```

Be careful with prune commands. They remove unused resources.

---

## Docker Compose

Docker Compose runs multi-container applications from a YAML file.

Typical backend stack:

```text
api + postgres + redis
```

Compose file:

```yaml
services:
  api:
    build: .
    container_name: my-api
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### Compose Important Keywords

| Key | Meaning |
| --- | --- |
| `services` | Containers to run |
| `image` | Existing image to use |
| `build` | Build image from Dockerfile |
| `container_name` | Explicit container name |
| `ports` | Host-to-container port mapping |
| `environment` | Environment variables |
| `env_file` | Load env vars from file |
| `volumes` | Mount persistent data/files |
| `depends_on` | Start dependency containers first |
| `networks` | Custom networks |
| `restart` | Restart policy |
| `command` | Override container command |
| `healthcheck` | Container health test |

### Compose Commands

Start stack:

```bash
docker compose up
docker compose up -d
```

Build and start:

```bash
docker compose up --build
docker compose build
```

Stop stack:

```bash
docker compose down
```

Stop and remove volumes:

```bash
docker compose down -v
```

View containers:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs
docker compose logs -f
docker compose logs -f api
```

Run command inside service:

```bash
docker compose exec api sh
docker compose exec db psql -U postgres
```

Restart service:

```bash
docker compose restart api
```

Pull latest images:

```bash
docker compose pull
```

Recreate after changes:

```bash
docker compose up -d --build
```

---

## Image Build and Publish Flow

Docker Hub example:

```bash
docker build -t my-api:1.0.0 .
docker tag my-api:1.0.0 your-dockerhub-user/my-api:1.0.0
docker tag my-api:1.0.0 your-dockerhub-user/my-api:latest
docker login
docker push your-dockerhub-user/my-api:1.0.0
docker push your-dockerhub-user/my-api:latest
```

GitHub Container Registry example:

```bash
docker build -t ghcr.io/OWNER/REPO/my-api:1.0.0 .
docker login ghcr.io
docker push ghcr.io/OWNER/REPO/my-api:1.0.0
```

Run published image:

```bash
docker pull your-dockerhub-user/my-api:1.0.0
docker run -d --name my-api -p 8080:8080 your-dockerhub-user/my-api:1.0.0
```

---

## Backend Best Practices

- Use small base images when possible.
- Use multi-stage builds for compiled languages.
- Never put secrets in Dockerfiles.
- Add `.dockerignore`.
- Pin important image versions instead of relying only on `latest`.
- Run as non-root in production.
- Keep one main process per container.
- Store persistent data in volumes.
- Use health checks for services.
- Tag images with commit SHA in CI/CD.
- Keep local Compose close to production dependencies.

---

## Common Docker Problems

### Port Already in Use

```bash
docker: bind: address already in use
```

Fix:

- Stop the process using the port.
- Use a different host port.

Example:

```yaml
ports:
  - "8081:8080"
```

### Container Exits Immediately

Check logs:

```bash
docker logs container-name
```

Usually caused by:

- Wrong command
- Missing env vars
- App crash
- Dependency connection failure

### App Cannot Reach Database in Compose

Inside Compose, use service names as hostnames.

Good:

```text
postgres://postgres:postgres@db:5432/app
```

Bad:

```text
postgres://postgres:postgres@localhost:5432/app
```

Inside the API container, `localhost` means the API container itself, not the database container.

