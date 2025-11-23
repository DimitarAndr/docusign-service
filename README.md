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

## API Docs
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## Troubleshooting
- `invalid_grant` / `no_valid_keys_or_signatures`: regenerate RSA key for this integration key in DocuSign, update `keys/private.pem`, ensure `DOCUSIGN_USER_ID` matches consented user.
- `Failed to obtain DocuSign access token`: check env vars, key path, consent.
- DB connection issues: ensure Postgres is running (`docker-compose up`) and `DATABASE_URL` points to it.
