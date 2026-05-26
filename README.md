# Print Queen 3D

E-commerce site for Print Queen 3D with a React frontend and FastAPI backend.

## Local Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your real values.
2. Copy `frontend/.env.example` to `frontend/.env` and point it to your backend URL.
3. Install backend dependencies:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```
4. Install frontend dependencies:
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

## Required Services

- MongoDB for product, customer, order, checkout, and admin data.
- Stripe for checkout. Use `STRIPE_API_KEY` on the backend and add the Stripe webhook secret as `STRIPE_WEBHOOK_SECRET`.
- Cloudinary for admin image uploads.
- Resend for email notifications. Configure the Resend API key from the admin Email Settings screen.

## Deployment Notes

See `DEPLOYMENT.md` for the Vercel setup. Deploy the backend and frontend as two Vercel projects from this same GitHub repository.
