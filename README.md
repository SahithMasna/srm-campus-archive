# SRM Campus Visual Archive

A verified, student-powered visual map of SRM University-AP campus life. Students sign in
with their SRM email, upload photos tagged to a real campus location and date, and the
campus map becomes the way everyone browses them.

Built as: **Next.js 14** (App Router) · **Supabase** (auth, Postgres, storage) ·
**Leaflet** over Esri satellite imagery · **sharp** for EXIF stripping and watermarking.

---

## What actually works

| | |
|---|---|
| **Sign-in** | 6-digit code emailed to the student. Non-`@srmap.edu.in` addresses are rejected in the browser, in the API, in a database trigger, and in row-level security. Four layers, because the first three can be bypassed. |
| **Upload** | Photo + location + date + category + caption. EXIF (including GPS) is stripped, the long edge is capped at 2000px, and a `srm archive · @handle` watermark is burned in before anything is stored. |
| **Map** | Real satellite imagery of the campus with a street toggle. Each pin carries its live photo count and opens that location's photos. |
| **Time machine** | Last 12 months, with per-month counts. |
| **Downloads** | The uploader's choice is enforced server-side. The storage bucket is private and every image is served through a 1-hour signed URL, so there is no permanent link to pass around. |
| **Reports** | Any student can report a photo. It lands in `/admin`. |
| **Moderation** | Moderators remove or keep. Removal is a soft delete — the file survives, so a mistake is reversible in SQL. |

**What it does not do:** stop screenshots. Nothing can. The watermark makes a reposted
photo traceable and the report queue makes removal fast; that is the honest limit, and the
upload dialog says so to the student in plain words.

---

## Setup — about 20 minutes

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com). Choose the region closest to you (Mumbai or Singapore).
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. This creates the tables, the domain lock, row-level security, and the private `photos` storage bucket.
3. Go to **Authentication → Providers → Email** and turn **Confirm email** ON. Supabase sends the 6-digit code automatically.
4. Go to **Authentication → URL Configuration** and add your site URL (`http://localhost:3000` now, your Vercel URL later).

> Supabase's built-in mailer is rate-limited to a few messages an hour — fine for testing,
> not for a launch. Before you open it to the batch, add an SMTP provider under
> **Project Settings → Authentication → SMTP**. Resend and Brevo both have free tiers.
> Better still, ask the university IT team for permission to send through the SRM domain.

### 2. Local run

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

The three Supabase values are in **Project Settings → API**. Put your own email in
`ADMIN_EMAILS` so you can reach `/admin`.

Open http://localhost:3000, sign in with your SRM email, and check the code in your inbox.

### 3. Make yourself a moderator

After your first sign-in, run this in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true where email = 'you@srmap.edu.in';
```

### 4. Deploy

Push the repo to GitHub, then import it at [vercel.com](https://vercel.com). Paste the
same four environment variables into Vercel's project settings and deploy. Add the Vercel
URL back into Supabase's **URL Configuration**.

---

## Fix the campus pins first

`lib/locations.js` has eleven campus locations placed by eye around the verified campus
centre (16.46321, 80.50640). Correcting them takes five minutes and makes the whole thing
feel real:

1. Open Google Maps and find SRM University-AP.
2. Right-click the actual building. The first menu item is the coordinate pair — click to copy.
3. Paste into `lat` / `lng`.

Add or remove locations freely. Keep `id` stable once photos exist against it, since that
string is what the database stores.

---

## Where the V2 items from the pitch would go

| Feature | Where |
|---|---|
| Auto-tagging (suggest a category) | `app/api/photos/route.js`, after the `sharp` step — send the buffer to a vision model, pre-fill `category`. |
| Duplicate detection | Store a perceptual hash alongside `width`/`height` in `photos`; compare on upload. |
| Face blur | Same place as the watermark — detect, then `sharp.blur()` the regions before compositing. |
| Event pages | A `events` table and an `event_id` column on `photos`. |
| Club accounts | A `clubs` table plus a `club_id` on `profiles`. |

The pitch's own principle holds: ship the archive, then layer the AI on.

---

## Before you open it to the batch

Three things worth doing that are not code:

1. **Talk to the university.** Anything using the SRM name and SRM email addresses should have a faculty or student-affairs sign-off. Take the deck.
2. **Write a one-page rule.** What can be posted, what gets removed, who decides. Link it from the upload dialog.
3. **Name two moderators, not one.** A queue with a single owner stops moving during exams.
