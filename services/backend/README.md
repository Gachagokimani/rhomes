Rhomes Backend

This folder contains the Node.js/Express backend for the Rhomes project.

Getting started

1. Copy `.env.example` to `.env` and fill in the values.

2. Install dependencies (pnpm recommended if you use workspace):

   pnpm install --filter ./services/backend

3. Start the server in development:

   pnpm --filter ./services/backend run dev

Required environment variables

- PORT - Server port (default 3000)
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - Secret for signing JWTs
- EMAIL_USER - SMTP username (Gmail address)
- EMAIL_PASS - SMTP password or app password
- CORS_ORIGIN - Origin allowed by CORS

Auth endpoints

- POST /api/auth/register - Register new user (body: { name, email, password })
- POST /api/auth/request-otp - Request OTP (body: { email })
- POST /api/auth/verify-otp - Verify OTP and receive JWT (body: { email, otp })

Notes

- OTPs are stored in the User model and expire after 10 minutes.
- For production, use a transactional SMTP provider and consider storing OTPs in Redis for better performance and TTL semantics.
