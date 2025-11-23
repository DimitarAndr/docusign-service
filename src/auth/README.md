# Auth Module

DocuSign authentication with two OAuth flows.

## Services

### AuthService
**Purpose**: JWT Bearer authentication for server-to-server API calls

**Flow**:
1. Check DB for valid cached token
2. If expired, refresh using refresh token
3. If no refresh token, create new JWT assertion
4. Store token in DB with TTL

**Usage**: Automatically called by DocuSign API client

### AuthConsentService
**Purpose**: OAuth Authorization Code flow for initial user consent

**Flow**:
1. User visits `/auth/docusign/authorize`
2. Redirects to DocuSign login
3. User grants consent
4. DocuSign redirects to `/auth/docusign/callback` with code
5. Exchange code for tokens
6. Save to DB via AuthService

**Usage**: Required ONCE before JWT authentication works

## Setup

1. Configure env vars (see `.env.example`)
2. Visit `http://localhost:3000/auth/docusign/authorize` in browser
3. Login and grant consent
4. Done - all future requests use JWT automatically
