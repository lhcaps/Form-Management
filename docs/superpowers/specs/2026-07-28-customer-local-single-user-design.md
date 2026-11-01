# Customer-local single-user design

## Goal

Deliver a repeatable Windows/Docker installation for one named customer user.
The application, database, generated files, and document rendering remain on
the customer machine. Clerk Development is used only to authenticate that one
user over the Internet.

## Deployment boundary

The delivery must not use the existing demo JIT provisioning path: it can turn
an unknown Clerk identity into an `OFFICIAL`, which is unsuitable for a
customer handoff. Instead, installation pre-binds a supplied Clerk user ID to
the seeded database administrator. The normal authorization flow then remains
unchanged: Clerk authenticates, and the database resolves the linked `ADMIN`
official and its permissions.

Customer-local mode is constrained to loopback origins, permits HTTP only on
the local machine, makes Clerk webhooks optional, and never activates demo JIT
provisioning. It is not a network or multi-user deployment mode.

## Components

1. `AppConfigService` recognises a tightly validated `customer-local` mode.
2. Docker Compose has a customer-local overlay and a safe environment example.
   It retains the licensed Times New Roman mount and uses the production image
   path, but binds services only to loopback addresses.
3. Bootstrap receives the one Clerk user ID and creates/updates the linked
   database `ADMIN` row before the application starts.
4. PowerShell helpers validate prerequisites, bootstrap/start/stop the stack,
   and perform an acceptance smoke that exercises auth, persisted documents,
   DOCX, PDF, restart, and backup/restore prerequisites.
5. Customer documentation states exact limits: current supported flows pass
   only when tested on the delivered environment; incomplete form adapters are
   not silently promoted.

## Acceptance gates

- Compose configuration resolves without secrets being committed.
- Strict production still fails closed for non-local deployments.
- Customer-local configuration rejects non-loopback origins and disables demo
  JIT behavior.
- A clean, disposable Docker run completes migration/bootstrap, API readiness,
  Clerk-linked administrator sign-in, persisted document rendering, and PDF
  output using the supplied font mount.
- Backup/restore and restart preserve the installed data.

## Non-goals

- Completing unfinished form adapters or claiming every form is runtime-ready.
- Replacing Clerk, allowing offline authentication, or opening the app to a
  LAN/public network.
- Changing locked DOCX contracts.
