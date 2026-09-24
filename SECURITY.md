# Security Deployment Action Items

## 1. Secrets Management
- **Render Environment Variables**: Ensure all secrets (`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SMTP_*`, `GMAIL_*`) are set in Render's **Environment** tab, **not** checked into source control.
- **Vercel Secrets**: Add the same secret names as **Project Settings → Environment Variables** for both Admin and Commuter front‑ends (e.g., `NEXT_PUBLIC_API_URL`). Use Vercel's encrypted storage.
- **Rotate Secrets**: Schedule periodic rotation (e.g., every 90 days) and update both Render and Vercel.

## 2. Transport Security (TLS/HTTPS)
- Render automatically provides TLS for the service URL. Verify the custom domain (if any) has a valid SSL certificate (use **Render Custom Domains → Automatic HTTPS**).
- Vercel also serves sites over HTTPS by default. Ensure any custom domains are attached and have **Force HTTPS** enabled.
- Add an **HTTPS redirect** middleware in `server/src/config/httpsRedirect.js` (use `app.use((req, res, next) => { if (req.header('x-forwarded-proto') !== 'https') return res.redirect('https://' + req.headers.host + req.url); next(); });`).

## 3. HTTP Security Headers
- Install and configure **helmet** in the Express app:
```js
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.ALLOWED_ORIGINS].join(','),
    },
  }),
  referrerPolicy: { policy: 'no-referrer' },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
}));
```

## 4. Authentication & Authorization
- **JWT**: Use strong signing keys (at least 256‑bit) and keep them secret. Set `httpOnly`, `secure`, and `sameSite: 'strict'` on refresh‑token cookies.
- **Password Hashing**: Bcrypt is already used with 12 rounds – consider raising to 14 in production.
- **RBAC**: Verify admin routes are protected with `requireAdmin` middleware.
- **Token Revocation**: Store a token version in the user record; increment on password change to invalidate old tokens.

## 5. Input Validation & Sanitisation
- Use **express‑validator** or **Joi** for all request bodies.
- Escape any data that goes into HTML templates (React already escapes by default, but double‑check any `dangerouslySetInnerHTML`).
- Sanitize MongoDB queries to prevent NoSQL injection (`mongoose` helps but avoid constructing queries from raw strings).

## 6. Rate Limiting & Brute‑Force Protection
- Add **express‑rate‑limit** on auth endpoints:
```js
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit each IP to 10 login attempts per window
  message: 'Too many login attempts, please try again later.',
});
app.use('/api/auth', authLimiter);
```
- Use **helmet**'s `crossOriginResourcePolicy` to prevent resource abuse.

## 7. CORS Configuration
- In `server/src/config/cors.js` restrict origins to the two Vercel deployments:
```js
const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({ origin: allowed, credentials: true }));
```
- Keep the list in an environment variable (`ALLOWED_ORIGINS`).

## 8. Database Security
- **IP Whitelisting**: In MongoDB Atlas, restrict access to Render's outbound IP range or use **Project → Network Access → IP Whitelist** with `0.0.0.0/0` only during development.
- Enable **TLS/SSL** for the MongoDB connection (default for Atlas). Verify `mongoose.connect` options include `tls: true`.
- Enable **Encryption at Rest** (Atlas default) and **Backup**.

## 9. Dependency & Patch Management
- Run `npm audit` regularly; apply non‑breaking fixes automatically via `npm audit fix`. For remaining high‑severity findings, assess and patch manually.
- Set up a **Dependabot** or **Renovate** workflow in the repo to keep dependencies up‑to‑date.

## 10. Logging & Monitoring
- Use **winston** (or similar) for structured logs, ensuring no secrets are logged.
- In Render, enable **Log Drains** to an external service (e.g., Papertrail, Loggly) for audit trails.
- Set up **Health Checks** in Render (`/healthz` endpoint) that return minimal status without leaking internal details.

## 11. Content Delivery & DDoS Mitigation
- Vercel provides built‑in DDoS protection; ensure the custom domain is attached and the **Edge Network** is active.
- Render’s free tier has basic DDoS shielding – consider upgrading if traffic grows.

## 12. Secure CI/CD
- Never store secrets in GitHub actions. Use **Render Deploy Hooks** with a secret token.
- Enable **Branch Protection** on main branch; require PR reviews before merge.

## 13. Documentation & Incident Response
- Create a **security run‑book** (markdown file) outlining steps for:
  - Secrets rotation
  - Log review
  - Incident containment
- Store it in the repo under `SECURITY.md` (non‑public if it contains sensitive details).

---
### Immediate Next Steps for This Project
1. Add `helmet` and `express-rate-limit` middleware to `server/src/server.js`.
2. Update CORS config to read `ALLOWED_ORIGINS` env var (already present in `render.yaml`).
3. Set the missing env variables in Render UI (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`).
4. Verify Atlas IP whitelist includes Render's outbound IP (found in Render dashboard → Settings → Outbound IP).
5. Commit this `SECURITY.md` file.
6. Re‑deploy backend on Render and front‑ends on Vercel.

Once these actions are applied, the deployment will meet modern security best‑practices.
