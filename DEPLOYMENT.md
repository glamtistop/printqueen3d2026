# Deployment

Deploy this repository as two Vercel projects from the same GitHub repo.

## Backend Project

Create a Vercel project with:

- Root Directory: `backend`
- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty

Environment variables:

```text
MONGO_URL=
DB_NAME=printqueen3d
CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN.vercel.app
COOKIE_SECURE=true

ADMIN_EMAIL=printqueen3d@gmail.com
ADMIN_PASSWORD=
ADMIN_NAME=Print Queen Admin

STRIPE_API_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_URL=

RESEND_API_KEY=
EMAIL_SENDER_NAME=Print Queen 3D
EMAIL_SENDER_EMAIL=noreply@printqueen3d.com
EMAIL_ADMIN_EMAIL=printqueen3d@gmail.com
```

After deployment, the API base URL will be:

```text
https://YOUR-BACKEND-DOMAIN.vercel.app
```

Stripe webhook endpoint:

```text
https://www.printqueen3d.com/api/webhook/stripe
```

## Frontend Project

Create a second Vercel project with:

- Root Directory: `frontend`
- Framework Preset: Create React App
- Build Command: `yarn build`
- Output Directory: `build`

Environment variable:

```text
REACT_APP_BACKEND_URL=https://YOUR-BACKEND-DOMAIN.vercel.app
```

## Notes

- Do not commit `.env` files.
- The Resend domain `printqueen3d.com` must be verified before production email sends reliably.
- Add the final frontend URL to backend `CORS_ORIGINS`.
