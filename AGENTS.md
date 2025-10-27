# Repository Guidelines

## Project Structure & Module Organization

The Next.js App Router lives in `src/app/` with route segments such as `marketplace`, `new-listing`, and account flows. Shared React components stay in `src/components` (UI primitives in `ui/`, modals and forms in sibling folders). Cross-cutting state and helpers sit in `src/context`, `src/hooks`, `src/lib`, and `src/utils`, while sample data resides in `src/data`. Firebase Cloud Functions live in `functions/`, and static assets (logos, Open Graph images) belong in `public/`.

## Build, Test, and Development Commands

- `npm run dev` launches the App Router dev server on `http://localhost:3000`.
- `npm run build` produces an optimized production bundle; run this before deploying.
- `npm run start` serves the latest `next build` output for smoke-testing production builds.
- `npm run lint` runs ESLint with the shared configuration across all JS/JSX modules.

## Coding Style & Naming Conventions

Use two-space indentation and align with the ESLint recommendations (`@next/eslint-plugin-next`, `eslint-plugin-react`). Components should export PascalCase functions and live under `src/components`, while route folders in `src/app` mirror URL segments in lowercase. Prefer absolute imports via the `@/` alias for anything inside `src`. Tailwind utility classes power styling; order classes logically (layout → spacing → typography) to keep diffs readable.

## Testing Guidelines

Automated tests are not yet wired in. When introducing coverage, use Jest with React Testing Library, naming specs `*.test.jsx` and colocating them with the feature or under `src/__tests__/`. Document manual QA steps in each PR, especially for checkout, authentication, or messaging flows. Always run `npm run lint` and verify the feature in the dev server before requesting review.

## Commit & Pull Request Guidelines

Follow the lightweight history already in place: concise, present-tense commit messages such as `add favourites page` or `update premium copy`. Keep commits focused so they can be reverted cleanly. Pull requests should describe the change, motivation, and verification steps; include screenshots or Loom links for UI tweaks and reference related issues. Request reviewers from product and engineering when changes affect payments, authentication, or notifications.?

## UI Components & Styling

Components use **shadcn/ui** (Radix UI primitives) with the "New York" style variant. All UI components live in `src/components/ui/` and are configured via `components.json`. Style with **Tailwind CSS v4**, utilizing utility classes in logical order (layout → spacing → typography). Icons come from **Lucide React**. Use **Sonner** for toast notifications via the `toast` API (e.g., `toast.success()`, `toast.error()`).

## Third-Party Service Integrations

### Firebase

- **Authentication**: Firebase Auth handles sign-in/sign-up; the `AuthContext` provider wraps the app and exposes `authUser` and `authLoading`.
- **Database**: Firestore collections include `users`, `profiles`, `listings`, `swap_requests`, and nested `messages` subcollections.
- **Cloud Functions**: Backend logic lives in `functions/` and deploys to the **europe-west2** region. Key functions handle message notifications, tier changes, listing creation, and scheduled tasks (swap count resets, cleanup).
- **Admin SDK**: Server-side routes use `src/lib/firebaseAdmin.js` for privileged operations. Credentials come from environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

### Cloudinary

Images are uploaded via the Cloudinary Upload Widget. Load the widget script dynamically and use the upload preset `fragrance-market` with cloud name `prodcloudinary`. Images are organized into folders like `fragrance-market/listings` and `fragrance-market/profile-pictures`. The `next.config.mjs` allows remote images from `res.cloudinary.com`.

### SendGrid

Transactional emails (verification, swap requests, shipment notifications) are sent via SendGrid. API routes in `src/app/api/email/` handle email dispatch. Store the SendGrid API key in environment variables.

### Stripe

Payments use Stripe for checkout and connected accounts for sellers. Webhooks handle subscription events, payment intents, and connected account updates. API routes in `src/app/api/stripe/` and `src/app/api/webhooks/` manage Stripe operations. Keep Stripe keys in environment variables.

### Algolia

The marketplace uses Algolia InstantSearch React to search the `fragrances` index. Client initialization requires `NEXT_PUBLIC_ALGOLIA_SEARCH_APP_ID` and `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`. Hits are rendered with the `ListingHit` component, and debounced search boxes improve UX.

### Veriff

ID verification sessions are initiated via `src/app/api/veriff/start-veriff-session/`. Webhooks or decision events update user verification status in Firestore.

### Google Maps

Address search uses `@react-google-maps/api` for autocomplete in address forms. The `googleLocationSearch.jsx` component wraps the API.

## State Management & Data Fetching

Global authentication state is managed via **React Context** (`AuthContext` and `ProfileDocContext`). Most data fetching happens client-side with Firestore's `onSnapshot` or direct queries. API routes handle server-side operations requiring admin privileges or third-party API calls. No external state management library (Redux, Zustand) is used.

## Firebase Cloud Functions

Functions deploy from the `functions/` directory to the **europe-west2** region. Use `npm run deploy` in the `functions/` folder to publish. Key functions:

- **onListingCreate**: Sets owner tier flags when a listing is created
- **onMessageWritten**: Updates unread message counts
- **onUserTierChange**: Syncs premium/verified status across listings
- **reduceSwapCountToZero**: Scheduled monthly reset (3 AM UTC, day 1)
- **removeOldSwapRequests**: Cleans up expired swap requests
- **validateUnreadCounts**: Maintenance function for message counters

## API Route Patterns

Next.js API routes live in `src/app/api/` and follow the App Router conventions. Routes use Firebase Admin SDK for Firestore operations, validate requests, and return JSON responses. Stripe webhooks verify signatures before processing events. Email routes call SendGrid's API to dispatch transactional messages.
