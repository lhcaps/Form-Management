# Lê Huy Admin Bootstrap

Creates a local ADMIN account `le_huy` for development and testing of the Clerk Identity Linking admin workflow.

## Account Details

| Field | Value |
|---|---|
| Username | `le_huy` |
| Full name | Lê Huy |
| Role | ADMIN |
| Active | yes |
| Email | from `SEED_LE_HUY_EMAIL` env (defaults to `le.huy@example.local`) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SEED_LE_HUY_PASSWORD` | **Yes** | Legacy login password. Never commit this value. |
| `SEED_LE_HUY_EMAIL` | No | Email address. Defaults to `le.huy@example.local`. |
| `SEED_LE_HUY_CLERK_USER_ID` | No | Clerk User ID. If set, links the Clerk identity to the Lê Huy account for Clerk SSO login. |

## Running the Seed

### PowerShell

```powershell
$env:SEED_LE_HUY_PASSWORD = "<local-password>"
$env:SEED_LE_HUY_EMAIL = "huyle210525@gmail.com"
$env:SEED_LE_HUY_CLERK_USER_ID = "user_xxxxxxxxxxxxx"
pnpm --filter api seed

# Cleanup (optional — removes env vars from current session)
Remove-Item Env:SEED_LE_HUY_PASSWORD
Remove-Item Env:SEED_LE_HUY_EMAIL
Remove-Item Env:SEED_LE_HUY_CLERK_USER_ID
```

### CMD

```cmd
set SEED_LE_HUY_PASSWORD=<local-password>
set SEED_LE_HUY_EMAIL=huyle210525@gmail.com
set SEED_LE_HUY_CLERK_USER_ID=user_xxxxxxxxxxxxx
pnpm --filter api seed
```

### Git Bash / Linux / macOS

```bash
SEED_LE_HUY_PASSWORD="<local-password>" \
SEED_LE_HUY_EMAIL="huyle210525@gmail.com" \
SEED_LE_HUY_CLERK_USER_ID="user_xxxxxxxxxxxxx" \
pnpm --filter api seed
```

## Without Clerk Link (legacy login only)

```powershell
# PowerShell
$env:SEED_LE_HUY_PASSWORD = "<local-password>"
pnpm --filter api seed
```

```cmd
:: CMD
set SEED_LE_HUY_PASSWORD=<local-password>
pnpm --filter api seed
```

```bash
# Bash
SEED_LE_HUY_PASSWORD="<local-password>" pnpm --filter api seed
```

## Logging In

### Legacy login

Navigate to `/auth/login` and use:

- Username: `le_huy`
- Password: the value you set for `SEED_LE_HUY_PASSWORD`

### Clerk login (if `SEED_LE_HUY_CLERK_USER_ID` was set)

Log in with Clerk using the Clerk account that has the matching User ID, then navigate to `/admin/auth/identities`.

## Idempotency

The seed is idempotent — running it multiple times will update the existing account, not create duplicates.

## Security Notes

- **Never commit `SEED_LE_HUY_PASSWORD`** to source control.
- Use a unique password per environment (dev, staging, production).
- After first login, change the password through the app's profile settings if available.
- The `SEED_LE_HUY_CLERK_USER_ID` links a real Clerk identity to the admin account — only set it in environments you control.
