# umelike

A dating-site MVP: warm landing page → Google sign-in → rich onboarding →
profile. Profiles include age eligibility, identity and dating preferences,
intentions, bio, interests, prompts, direct photo uploads, location radius, and a
completion indicator. Built with Next.js 14 (App Router), Tailwind, Auth.js v5
(Google only), and Prisma + Postgres.

## Run it locally

**1. Install**

```bash
npm install
```

**2. Google sign-in** (the one manual step)

1. Go to [Google Cloud Console](https://console.cloud.google.com) →
   *APIs & Services → Credentials → Create credentials → OAuth client ID*.
2. Application type: **Web application**.
3. Authorized JavaScript origin: `http://localhost:3000`
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret.

**3. Environment**

```bash
cp .env.example .env
```

Fill in:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 2
- `AUTH_SECRET` — run `openssl rand -base64 32`
- `DATABASE_URL` — any Postgres. A [Supabase](https://supabase.com)
  project's *Connect → Connection string → URI* drops straight in
  (use the **Session** pooler string for local dev). Local Postgres or
  Neon work identically.

**4. Database**

```bash
npm run db:migrate   # creates tables (first run: name the migration "init")
```

**5. Go**

```bash
npm run dev          # http://localhost:3000
```

Sign in with Google → land on onboarding (name pre-filled from Google)
→ save → profile page shows "Profile saved."

Profile photos are selected directly from the device, resized in the browser,
and saved with the profile in Postgres. No image-hosting links are needed.

## Where things live

```
src/
  auth.ts                     Auth.js config — Google is the only provider
  app/page.tsx                Landing (hero + glow + CTA)
  app/onboarding/page.tsx     Onboarding & edit-profile (same form)
  app/profile/page.tsx        Profile summary + sign out
  app/api/auth/[...nextauth]/ OAuth route handler
  actions/profile.ts          Server action: validate + upsert profile
  components/OnboardingForm   Client form with inline field errors
  components/GlowBackdrop     The signature golden-hour glow
  lib/validation.ts           Zod rules (shared source of truth)
  lib/prisma.ts               Prisma client singleton
prisma/schema.prisma          Auth.js models + Profile
```

## Design tokens

| Token | Hex | Use |
|---|---|---|
| ivory | `#FBF6EE` | page background |
| blush | `#F3E6DD` | cards |
| berry | `#A2596B` | primary accent |
| berry-deep | `#8A4A5B` | hover/pressed |
| gold | `#D9A05B` | highlights, focus rings |
| plum | `#322230` | text |
| mauve | `#6E5A66` | secondary text |

Type: **Fraunces** (variable, SOFT axis) for display · **Inter** for body.
One signature motion: the drifting glow on the landing hero (frozen under
`prefers-reduced-motion`). Everything else fades quietly.

## Decisions to review

**Address → city + postal code (changed from the brief, flagged).**
The form collects city + postal code instead of a full street address.
That's enough for distance-based matching later, and it means a leak or
misuse never exposes anyone's front door — for a dating product the
downside risk of exact addresses outweighs any current need. If you want
the full address anyway, it's a three-line change: uncomment
`streetAddress` in `prisma/schema.prisma`, add the rule in
`src/lib/validation.ts`, add the field in
`src/components/OnboardingForm.tsx`, then `npm run db:migrate`.

**Phone = private, verification-only.** Stored, never rendered on any
public surface; the profile page labels it "Private". Wire it to an SMS
verification step later without changing the schema.

**Sessions ride in a JWT** (users/accounts persist via the Prisma
adapter). No DB hit per request, and no session table to prune. Swap
`session: { strategy: "jwt" }` in `src/auth.ts` if you'd rather have
revocable database sessions.

## Next steps this sets up

- Phone verification (Twilio Verify or similar) against the stored number
- Geocode city + postal → lat/lng for distance matching
