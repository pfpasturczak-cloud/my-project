# Visora — Setup Guide

Follow these steps in order. Don't skip ahead.

---

## Step 1 — Supabase database

1. Log into [supabase.com](https://supabase.com) and open your project
2. Go to **SQL Editor** → **New query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run**
5. You should see no errors. Tables are now created.

---

## Step 2 — Make yourself admin

Still in the SQL Editor, run this (replace with your actual email):

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'pfpasturczak@gmail.com';
```

You need to register first (Step 6) before this will work. Come back to this.

---

## Step 3 — Get your Supabase keys

Go to **Settings → API** in your Supabase project. You need:

- **Project URL** — looks like `https://xxxx.supabase.co`
- **anon public key** — safe to expose in the browser
- **service_role key** — keep this secret, never commit it

---

## Step 4 — Get your Resend key

1. Log into [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key

For the FROM email — you need a verified domain in Resend.
If you don't have one yet, use `onboarding@resend.dev` for testing.

---

## Step 5 — Set environment variables in Netlify

1. Go to your Netlify site → **Site configuration → Environment variables**
2. Add each of these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `RESEND_API_KEY` | Your Resend API key |
| `NEXT_PUBLIC_SITE_URL` | `https://pasturczak.netlify.app` |
| `RESEND_FROM_EMAIL` | Your verified from address |

---

## Step 6 — Replace the old files and deploy

Your GitHub repo currently has `index.html`, `gallery.html`, and a `/media` folder.
We're replacing all of that with this Next.js project.

**Do this:**

1. Delete everything from your GitHub repo (keep the repo itself)
2. Upload all the files from this project into the root of the repo
3. The structure should look like this at the root:

```
my-project/
├── src/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── middleware.js
├── netlify.toml
└── .gitignore
```

4. Netlify will auto-detect the Next.js build and deploy

> ⚠️ Do NOT commit `.env.local` — environment variables go in Netlify only.

---

## Step 7 — Add the Netlify Next.js plugin

In Netlify → **Plugins** → search for **Essential Next.js** and install it.
This handles serverless functions, image optimisation, etc.

---

## Step 8 — Register and set yourself as admin

1. Visit your live site
2. Click **Client Portal** → **Register here**
3. Create your account with `pfpasturczak@gmail.com`
4. Go back to Supabase SQL Editor and run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'pfpasturczak@gmail.com';
```

5. Log out and back in — you'll now land on the Admin panel

---

## Step 9 — Upload gallery media

1. Go to Supabase → **Storage** → `gallery` bucket
2. Upload your images and videos directly here
3. They'll appear on the public gallery page automatically

---

## What each URL does

| URL | What it is |
|-----|------------|
| `/` | Home page |
| `/gallery` | Public gallery |
| `/auth/login` | Client login |
| `/auth/register` | Client registration |
| `/dashboard` | Client project list |
| `/projects/new` | Submit a new project |
| `/projects/[id]` | Project detail + deliverables |
| `/admin` | Admin job queue |
| `/admin/jobs/[id]` | Job detail + status + upload |

---

## Troubleshooting

**Gallery shows nothing** — Check the `gallery` bucket exists in Supabase Storage and has files in it.

**Login fails** — Check your Supabase URL and anon key in Netlify environment variables.

**Email not sending** — Check your Resend API key and that the FROM email is verified in Resend.

**Admin panel redirects to dashboard** — Make sure you ran the UPDATE query to set your role to admin.
