# DocuSign Service

NestJS + PostgreSQL service for sending DocuSign envelopes. Uses JWT grant for server-to-server auth; DocuSign tokens are minted and cached by the backend.

## Quick Start

### 1) Prerequisites
- Node.js 20+
- Docker (for local Postgres)
- DocuSign developer account with Integration Key, User ID, Account ID, RSA private key (PEM)

### 2) Configure environment
```bash
cp .env.example .env
mkdir -p keys
# place your DocuSign private key at keys/private.pem
```

Example `.env` (works with docker-compose Postgres):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docusign?schema=public"
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_guid
DOCUSIGN_ACCOUNT_ID=your_account_guid
DOCUSIGN_CLIENT_SECRET=your_client_secret   # only needed for auth code grant
DOCUSIGN_PRIVATE_KEY_PATH=./keys/private.pem
```

### 3) Install deps
```bash
npm install
```

### 4) Run with Docker (app + Postgres)
```bash
docker-compose up --build
```
- Postgres: `localhost:5432` (user/pass `postgres`/`postgres`, db `docusign`)
- App: `http://localhost:3000`

### 5) Database setup (local dev)
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6) Grant DocuSign consent (once, for JWT)
Open in browser (replace with your integration key):
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=<integration_key>&redirect_uri=http://localhost:3000/auth/docusign/callback
```
Sign in and allow.

### 7) Send an envelope
```bash
curl -X POST http://localhost:3000/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "sample-nda",
    "recipient": { "name": "John Doe", "email": "john@example.com" },
    "subject": "Please sign this document",
    "message": "Thank you!"
  }'
```
Or import `postman/DocuSign Service.postman_collection.json` and run “Send Envelope (JWT)”.

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (`postgresql://user:pass@host:port/db?schema=public`) |
| `DOCUSIGN_INTEGRATION_KEY` | yes | DocuSign app client ID |
| `DOCUSIGN_USER_ID` | yes | DocuSign API user GUID (impersonated user) |
| `DOCUSIGN_ACCOUNT_ID` | yes | DocuSign account GUID |
| `DOCUSIGN_AUTH_SERVER` | no | Auth server (`https://account-d.docusign.com` demo) |
| `DOCUSIGN_API_BASE` | no | REST base (`https://demo.docusign.net/restapi`) |
| `DOCUSIGN_SCOPES` | no | Scopes (default `signature impersonation`) |
| `DOCUSIGN_PRIVATE_KEY_PATH` | yes | Path to RSA private key PEM |
| `DOCUSIGN_CLIENT_SECRET` | optional | Only for authorization code grant |
| `DOCUSIGN_REDIRECT_URI` | optional | Redirect URI for code grant |

## Testing & Lint
```bash
npm run lint
npm test
```

## Health & Readiness Endpoints

### `/health` - Health Check
Returns basic service health status. Always returns 200 OK if the service is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": "3600s",
  "version": "1.0.0",
  "environment": "production",
  "memory": {
    "rss": "150MB",
    "heapUsed": "80MB",
    "heapTotal": "120MB"
  },
  "cpu": {
    "user": "5000ms",
    "system": "1000ms"
  }
}
```

**Use Cases:**
- Basic liveness probe for Kubernetes/ECS
- Monitoring service uptime
- Quick health dashboard

### `/ready` - Readiness Check
Validates that the service is ready to handle traffic. Returns 503 if any dependency is unavailable.

**Checks:**
- ✅ PostgreSQL database connection
- ✅ DocuSign API reachability
- ✅ Required environment variables
- ✅ Memory usage within limits

**Response (Healthy):**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "docusign": { "status": "up", "message": "DocuSign API is reachable" },
    "environment": { "status": "up", "message": "All required env vars present" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  },
  "error": {},
  "details": { ... }
}
```

**Response (Unhealthy):**
```json
{
  "status": "error",
  "info": { ... },
  "error": {
    "database": { "status": "down", "message": "Connection timeout" }
  },
  "details": { ... }
}
```

**Use Cases:**
- Kubernetes readiness probe
- Load balancer health checks
- Pre-deployment validation
- Circuit breaker integration

### Production Deployment

**Docker/Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

**AWS ECS:**
```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:3000/ready || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3
  }
}
```

**Benefits:**
- Zero-downtime deployments
- Automatic traffic routing
- Early failure detection
- Improved reliability and uptime

## API Docs
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## Troubleshooting
- `invalid_grant` / `no_valid_keys_or_signatures`: regenerate RSA key for this integration key in DocuSign, update `keys/private.pem`, ensure `DOCUSIGN_USER_ID` matches consented user.
- `Failed to obtain DocuSign access token`: check env vars, key path, consent.
- DB connection issues: ensure Postgres is running (`docker-compose up`) and `DATABASE_URL` points to it.
