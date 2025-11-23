# DocuSign Service

NestJS microservice for managing DocuSign envelopes and documents with PostgreSQL and Prisma ORM.

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database running
- DocuSign Developer Account with:
  - Integration Key
  - User ID
  - Account ID
  - RSA Private Key (PEM format)

### 2. Installation

```bash
npm install
```

### 3. Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/docusign?schema=public"
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_CLIENT_SECRET=your_client_secret
DOCUSIGN_PRIVATE_KEY_PATH=./keys/private.pem
```

3. Place your DocuSign private key:
```bash
mkdir -p keys
# Copy your private.pem file to keys/private.pem
```

### 4. Database Setup

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Start the Service

```bash
npm run start:dev
```

Service will be available at `http://localhost:3000`

### 6. Grant DocuSign Consent (Required Once)

**Option A: Browser**
1. Visit `http://localhost:3000/auth/docusign/authorize`
2. Login to DocuSign
3. Click "Allow" to grant consent

**Option B: Postman**
1. Import `postman/DocuSign Service.postman_collection.json`
2. Run "Auth > Get Consent URL"
3. Copy the URL from response
4. Open URL in browser and grant consent

### 7. Test the API

Using Postman:
1. Run "Envelopes > Send Envelope (JWT)"
2. Check the response for `envelopeId`

Or using curl:
```bash
curl -X POST http://localhost:3000/envelopes \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "sample-nda",
    "recipient": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "subject": "Please sign this document",
    "message": "Thank you!"
  }'
```

## Docker

```bash
docker-compose up
```

## API Documentation

Swagger UI available at: `http://localhost:3000/api`

## Troubleshooting

**Error: "Failed to obtain DocuSign access token"**
- Make sure you've granted consent (Step 6)
- Verify your integration key and user ID are correct
- Check that private key file exists and is valid

**Error: "DocuSign configuration not loaded"**
- Verify all required environment variables are set
- Check `.env` file exists and has correct values
