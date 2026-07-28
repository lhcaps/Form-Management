# Customer-local Docker installation

This profile is for one customer user on one Windows machine. It binds QLLaw
only to `127.0.0.1`; do not expose it to the LAN or Internet.

## Before installation

1. Install Docker Desktop and ensure it is running.
2. Create a new Clerk **Development** application owned by the customer.
3. Create the customer's only Clerk user, then copy that user's `user_...` ID.
4. Obtain a licensed Times New Roman directory containing regular, bold,
   italic, and bold-italic files. Do not add fonts or secrets to Git.
5. Copy `.env.docker.customer-local.example` to
   `.env.docker.customer-local`, then replace every `replace-with-*` value.
   Set `SEED_LE_HUY_EMAIL` and `SEED_LE_HUY_CLERK_USER_ID` to the new Clerk
   account. The bootstrap uses that ID to create the linked database `ADMIN`.

## Install and start

```powershell
pnpm install --frozen-lockfile
pnpm docker:customer-local:config
pnpm docker:customer-local:bootstrap
pnpm docker:customer-local:up
```

Open http://127.0.0.1:3000 and sign in only with the new customer Clerk
account. Check `http://127.0.0.1:3001/api/v1/readyz` before use.

## Limits and verification

The profile does not use Clerk webhooks or demo JIT provisioning. A different
Clerk user must not be created or used. Before acceptance, verify the current
supported template flow, a persisted document, DOCX download, PDF render,
restart, and backup/restore on the customer machine. Do not treat forms that
are only catalogued or skeleton-only as customer-ready.

Stop the stack without deleting data:

```powershell
pnpm docker:customer-local:down
```
