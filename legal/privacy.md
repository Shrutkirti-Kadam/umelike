# Privacy Policy

**umelike** · Working draft · 15 September 2026

> Draft for legal review. This version is aligned to the current umelike system and the P7D4 privacy follow-up migration. It is not legal advice. Before publication, replace every bracketed placeholder, confirm the contact inboxes work, and have qualified counsel review it.

---

## The short version

- We collect the information needed to run a dating service, keep it safe, and operate your account.
- Other members do not receive your full real name. They see your chosen display name, or your first name if you have not set one.
- Location is stored only after being rounded to two decimal places, and other members receive a derived distance or neighbourhood rather than your stored coordinates.
- You can request a copy of core account data and you can delete your account. Account deletion has a 14-day restoration period before permanent purge.
- We do not sell your personal data or share it with data brokers.

---

## 1. Who is responsible for your data

umelike is operated by **[developer/legal entity name — must match the Google Play listing]**.

Privacy contact: **privacy@umelike.in**

Before publication, confirm that this mailbox can receive and answer messages.

---

## 2. What we collect

### Account and sign-in information

We process your email address to create and operate your account, sign you in, and send account-related messages. If you choose Google sign-in, authentication information needed for that sign-in is also processed by Google and Supabase. Your sign-in email is not shown to other members.

### Your profile

We store information you provide for your profile and matching experience, including your real name, optional display name, date of birth or age information, gender, orientation, relationship goal, bio, prompts and answers, interests, neighbourhood, and profile photos.

Your full real name and private account fields are not sent to other members. Public profile information can include your display name — or your first name if you have not set a display name — age, photos, bio, prompts, interests, neighbourhood, verification status, and other profile information used by the current profile experience.

### Dating preferences and settings

We store preferences such as age range, maximum distance, who you are interested in, neighbourhood, relationship preferences, and account settings. These are used to operate matching and account behaviour and are not exposed as another member's private settings.

### Approximate location

If location is available to umelike, the server stores latitude and longitude rounded to two decimal places. Other members receive a derived distance or neighbourhood rather than your stored coordinates.

You can stop future location access through the controls made available by your device and by umelike. Before publication, verify the exact in-app location-control wording against the final Preferences screen.

### Timezone

We store your timezone so daily limits can reset according to your local day. Your timezone is not shown to other members.

### Activity status

If **Show Last Active Status** is enabled, umelike stores a private raw activity timestamp and exposes only a coarse activity bucket such as "Active now" or "Active today" where the feature allows it. Turning the setting off removes the activity record and also stops reciprocal activity visibility.

### Activity on umelike

We process service activity such as likes, passes, matches, messages, rewinds, Discover refreshes, blocks, reports, and related timestamps or counters required to operate those features.

### Selfie verification

If you choose Selfie Verification, we store a verification selfie in private storage for human review. It is not shown on your profile. The current system schedules the verification selfie for deletion 30 days after review; the verification outcome may remain on your account.

### Device and diagnostic information

For push notifications, we store a device push token associated with your account.

If **Send diagnostics** is enabled, diagnostic events may include your account ID and app context used to investigate crashes or reliability problems. umelike's diagnostic flow is designed not to include message bodies, profile photos, or stored location coordinates in those reports.

### Subscription and purchase information

UmeLike contains subscription infrastructure for Platinum. Real Google Play purchasing is not currently enabled in the present build. If paid Platinum subscriptions are enabled, Google Play will process the payment and umelike may receive purchase tokens, order/subscription status, and entitlement information; umelike does not receive your payment-card details from Google Play.

---

## 3. What other members can see

| Other members may see | They should not receive from umelike |
|---|---|
| Your display name, or your first name if no display name is set | Your full real name |
| Public profile fields such as age, photos, bio, prompts, interests and neighbourhood | Your sign-in email |
| A derived distance or neighbourhood when location is used | Your stored coordinates |
| A coarse activity status if both sides' settings allow it | Your raw activity timestamp or timezone |
| Whether your profile is verified | Your verification selfie |
| Public profile information needed for Discover, Likes and existing matches | Your private preferences and account settings |

UmeLike enforces this separation in the database as well as in the Flutter interface. Public profile reads use a restricted public-profile path, while the underlying profile row containing private fields is owner-only for ordinary authenticated users.

---

## 4. How we use your information

We use personal data to:

- create, authenticate, and operate your account;
- show eligible profiles and run matching features;
- deliver messages, typing state, matches, and push notifications;
- enforce blocks, unmatches, limits, match expiry, and other service rules;
- review reports and optional selfie-verification submissions;
- detect a previously deleted account returning when safety reports existed;
- operate membership entitlements and, if enabled, Google Play subscriptions;
- diagnose crashes and reliability problems when diagnostics are enabled; and
- comply with applicable legal, safety, security, and fraud-prevention obligations.

We do not sell personal data or share it with data brokers.

---

## 5. Service providers

UmeLike uses third-party providers to operate the service. The final published version must match the providers actually in production.

Current or planned providers include:

- **Supabase** — authentication, PostgreSQL database services, Realtime, and file storage.
- **Resend** — transactional authentication email delivery, including sign-in codes.
- **Google** — optional Google sign-in; Firebase Cloud Messaging for push delivery; Firebase Crashlytics when diagnostics are enabled; and Google Play for subscriptions if paid Platinum is enabled.
- **[website hosting provider]** — hosting for the public privacy, terms, and account-deletion website. Replace this placeholder with the actual production host before publication.

Each provider processes data according to its own terms and privacy commitments. If UmeLike changes processors, this policy should be updated accordingly.

---

## 6. Security and access controls

UmeLike uses technical controls intended to limit who can access personal data, including:

- authenticated Supabase access and row-level security;
- an owner-only base profile table for private profile fields;
- a restricted public-profile view for fields another member is allowed to receive;
- private storage for verification selfies;
- server-side matching, block, and relationship checks before public-profile data is returned; and
- server-side RPCs for sensitive actions such as export, deletion, restoration, verification, and quota enforcement.

No system can promise absolute security. If we discover a security incident that requires notification under applicable law, we will handle it accordingly.

---

## 7. How long we keep information

| Data | Current retention behaviour |
|---|---|
| Active account and profile | Kept while the account exists, then subject to the 14-day deletion grace period |
| Verification selfie | Scheduled for deletion 30 days after review |
| Silent match after it ends | Removed 30 days after the match ends |
| Raw activity timestamp | Kept while Last Active is enabled; removed when that setting is turned off or the account is purged |
| Successful export audit row | Retained as an operational/rate-limit record; a final retention period should be set before launch |
| Firebase Crashlytics crash data | Firebase states that Crashlytics crash stack traces and associated identifiers are retained for 90 days before deletion begins |
| Safety reports involving a deleted account | Retained after account deletion for safety and abuse-prevention purposes; a final retention period should be set with counsel |
| Deleted-account safety tombstone | Historical account UUID, one-way email hash, deletion time, and report count are retained for returning-account safety checks; real name, age, and original account-created time are not retained after the P7D4 privacy follow-up |

Before launch, UmeLike should adopt explicit retention periods for safety reports, deleted-account tombstones, and export audit rows rather than leaving them open-ended.

---

## 8. Downloading your account data

**Settings → Download My Data** requests a JSON copy of core account data such as your account record, profile, photo metadata, approximate stored location, membership state, matches, message history, reports you filed, verification history, device-token metadata, and deletion state.

A successful self-service export is limited to once every rolling 24 hours.

The self-service export is not described as a copy of every internal safety, moderation, security, or operational record. For a broader privacy-rights request, contact **privacy@umelike.in**.

---

## 9. Deleting your account

You can initiate deletion from the app. Once the external account site is deployed, you will also be able to initiate deletion at **https://umelike.in/delete-account** without reinstalling the app.

### Immediately after requesting deletion

- your profile is hidden;
- push tokens are removed;
- your account enters an inactive state; and
- new messages to or from the account are blocked.

### During the next 14 days

Your account is pending deletion and can be restored by signing in and choosing to restore it. The original deletion deadline is not extended by repeating the delete request.

### After the 14-day grace period

The purge removes the account's profile, photos, verification submission data, matches, messages, likes, passes, blocks, location, device tokens, entitlements, and authentication account after stored files have been removed.

### Information retained for safety

Reports involving the account intentionally survive deletion. UmeLike also keeps a minimal deleted-account safety record containing the historical account UUID, a one-way hash of the email address, deletion time, and number of reports against the account. This is used to help flag a returning account associated with prior safety reports.

We retain safety information only for legitimate safety, fraud-prevention, legal, or regulatory purposes as applicable. The final published policy should state a defined retention period approved by counsel.

---

## 10. Your choices and rights

Depending on where you live, applicable privacy law may give you rights to access information, correct it, request erasure, raise a grievance, or exercise other privacy rights.

Within UmeLike you can already:

- edit profile information and dating preferences;
- choose or clear your public display name;
- control Last Active, notifications, email preferences, and diagnostics;
- pause your profile;
- request a self-service account-data export; and
- request account deletion and restore it during the 14-day grace period.

For privacy requests that are not covered by the self-service controls, contact **privacy@umelike.in**. Where applicable, this includes requests under India's Digital Personal Data Protection framework and the GDPR.

---

## 11. Age

UmeLike is intended only for people aged 18 or older. If we determine that an account belongs to someone under 18, we may remove the account and associated data as required by our safety obligations and applicable law.

---

## 12. Changes to this policy

We may update this policy when the service, providers, or legal requirements change. The date at the top identifies the current version. Where applicable law requires additional notice or consent, we will provide it.

---

## 13. Contact

**[developer/legal entity name]**  
Privacy: **privacy@umelike.in**  
General support: **[support email to be confirmed]**  
Address: **[business/contact address required by counsel, if applicable]**
