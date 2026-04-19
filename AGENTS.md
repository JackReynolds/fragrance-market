# Repository Guidelines

## Project Structure & Module Organization

The Next.js App Router lives in `src/app/` with route segments such as `marketplace`, `new-listing`, and auth/account flows (`sign-in`, `sign-up`, `my-profile`, `forgot-password`).

Shared React components live in `src/components/`.
- UI primitives are in `src/components/ui/`.
- Feature components are grouped in folders like `marketplace`, `listing`, `profile`, `inbox`, `checkout`, and `admin`.

Cross-cutting state and helpers live in:
- `src/context`
- `src/hooks`
- `src/lib`
- `src/utils`
- `src/data`

Firebase Cloud Functions live in `functions/`.
Static assets (logos, Open Graph images) live in `public/`.

## Build, Lint, and Development Commands

- `npm run dev` starts the app on `http://localhost:3000`.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs `next lint`.

Cloud Functions (`functions/`):
- `npm run lint` runs ESLint.
- `npm run serve` starts the Functions emulator.
- `npm run deploy` deploys functions.

## Coding Style & Naming Conventions

- Use 2-space indentation.
- Follow ESLint rules from `eslint.config.mjs` (`@next/eslint-plugin-next`, `eslint-plugin-react`).
- Use PascalCase for component exports.
- Keep route folders lowercase to match URL segments.
- Prefer absolute imports with the `@/` alias (`jsconfig.json`).
- Use Tailwind utility classes in logical order: layout -> spacing -> typography.

## Testing Guidelines

Automated tests are not currently wired in.

When adding tests:
- Use Jest + React Testing Library.
- Use `*.test.jsx` naming.
- Co-locate tests with feature code or place them in `src/__tests__/`.

For every PR:
- Run `npm run lint`.
- Manually verify changed flows in the dev server.
- Document manual QA steps (especially auth, checkout, and messaging).

## Commit & Pull Request Guidelines

- Use concise present-tense commit messages, for example:
  - `add favourites page`
  - `update premium copy`
- Keep commits focused and revertable.
- PRs should include:
  - What changed
  - Why it changed
  - How it was verified
  - Screenshots/Loom for UI changes
- Request both product and engineering review when touching payments, auth, or notifications.

## UI Components & Styling

- UI primitives are from shadcn/ui (Radix), configured in `components.json` with the `new-york` style.
- Tailwind CSS v4 is used for styling.
- Icons use `lucide-react`.
- Toast notifications use Sonner (`toast.success`, `toast.error`, etc.) with `<Toaster />` in `src/app/layout.js`.

## Third-Party Services

### Firebase

- Auth state is provided via `AuthContext` (`authUser`, `authLoading`) in `src/context/authContext.js`.
- Extended profile state is provided via `ProfileDocContext` in `src/context/profileDocContext.js`.
- Firestore collections in active use include `users`, `profiles`, `listings`, `swap_requests`, and nested `messages` subcollections (plus operational collections like `orders` and webhook/system stats collections).
- Admin SDK for server routes is initialized in `src/lib/firebaseAdmin.js`.
- Admin credentials are read from:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

### Cloudinary

- Cloudinary Upload Widget is loaded dynamically in listing/profile pages.
- Cloud name: `prodcloudinary`
- Upload preset: `fragrance-market`
- Folders used:
  - `fragrance-market/listings`
  - `fragrance-market/profile-pictures`
- Next image remote source is configured for `res.cloudinary.com` in `next.config.mjs`.

### SendGrid

- SendGrid powers transactional emails.
- Email routes are under `src/app/api/email/`.
- Premium welcome emails are sent from `src/app/api/email/premium-welcome/route.js`.
- SendGrid is also used in selected non-email routes (for example swap request creation and some webhook flows).
- API key comes from `SENDGRID_API_KEY`.
- Premium welcome emails use `SENDGRID_PREMIUM_WELCOME_TEMPLATE_ID`.

### Stripe

- Stripe is used for checkout, payment intents, subscriptions, and connected accounts.
- Routes live in:
  - `src/app/api/stripe/`
  - `src/app/api/identity/start-session/route.js`
  - `src/app/api/webhooks/stripe-payment/`
  - `src/app/api/webhooks/stripe-subscription/`
  - `src/app/api/webhooks/stripe-connected-account/`
  - `src/app/api/webhooks/stripe-identity/route.js`
- Webhook routes verify signatures using `stripe.webhooks.constructEvent(...)`.
- Stripe Identity reuses `STRIPE_SECRET_KEY` and verifies webhooks with `STRIPE_IDENTITY_WEBHOOK_SECRET`.

### Discord

- Premium Discord access is activated via Discord OAuth and synced from `src/lib/premiumDiscord.js`.
- The Stripe subscription webhook in `src/app/api/webhooks/stripe-subscription/route.js` marks premium active, sends the premium welcome email, and attempts Discord sync for already-linked accounts.
- Discord OAuth routes live in:
  - `src/app/api/discord/connect-url/route.js`
  - `src/app/api/discord/callback/route.js`
  - `src/app/api/discord/sync-access/route.js`
- Discord REST helpers live in `src/lib/discord.js` and premium access orchestration lives in `src/lib/premiumDiscord.js`.
- Discord configuration requires:
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_GUILD_ID`
  - `DISCORD_OAUTH_REDIRECT_URI`

### Algolia

- Search uses Algolia InstantSearch (`react-instantsearch`) on the `fragrances` index.
- Env vars:
  - `NEXT_PUBLIC_ALGOLIA_SEARCH_APP_ID`
  - `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`
- Hits are rendered with `ListingHit`.
- Debounced search components are used in marketplace/search flows.

### Google Maps

- Address autocomplete uses `@react-google-maps/api`.
- Wrapper component: `src/components/googleLocationSearch.jsx`.

## State Management & Data Fetching

- Global app state is React Context-based (`AuthContext`, `ProfileDocContext`, and admin context).
- Data fetching is primarily Firestore client SDK (`onSnapshot`, `getDocs`, queries).
- Server-side privileged operations are handled in API routes via Firebase Admin SDK.
- No Redux/Zustand-style external state library is used.

## Firebase Cloud Functions

Functions are exported from `functions/index.js`:
- `onListingCreate`: sets owner tier/priority fields on new listings.
- `onMessageWritten`: marks conversations unread for recipients based on message events and refreshes swap activity timestamps.
- `onMessageRead`: removes conversation unread markers when all messages are read.
- `onUserTierChange`: syncs premium/verification flags to listings when profile tier changes.
- `reduceSwapCountToZero`: monthly reset for `monthlySwapCount` (UTC 03:00, day 1).
- `removeOldSwapRequests`: scheduled cleanup of inactive active-state `swap_requests` with no movement for 30 days (UTC 03:00 daily), including legacy timestamp repair when recent message activity is newer than the parent document.
- `validateUnreadCounts`: scheduled unread-conversation consistency maintenance.

Region note:
- Most functions explicitly set `region: "europe-west2"`.
- `onUserTierChange` currently does not set region explicitly, so it uses the Firebase default region.

## API Route Patterns

- API routes follow Next.js App Router conventions in `src/app/api/`.
- Server routes use Firebase Admin SDK when privileged access is required.
- Webhooks validate signatures before processing.
- Routes generally return JSON responses and log failures for observability.

## Maintenance Rules For This File

Treat `AGENTS.md` as an operational source of truth:
- Update it in the same PR when adding/removing:
  - Route groups
  - Services/integrations
  - Cloud Functions
  - Env var requirements
- Keep statements factual and verifiable against code.
- Prefer explicit file paths over general descriptions.
- Avoid aspirational wording ("should", "planned") unless marked as future work.
