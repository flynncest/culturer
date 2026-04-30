# Culturers Platform

Employee engagement automation platform built with Next.js 14, Supabase, Resend, and Kie.ai.

## Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) account
- A [Resend](https://resend.com) account
- A [Kie.ai](https://kie.ai) account (for AI video generation)
- A [Vercel](https://vercel.com) account (for deployment + cron jobs)

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd culturer-platform
npm install
```

### 2. Set up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Alternatively, use the Supabase CLI:
   ```bash
   npx supabase db push
   ```
4. Create a user for dashboard login:
   - Go to **Authentication → Users → Invite user**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `RESEND_API_KEY` | Resend → API Keys |
| `KIE_API_KEY` | Kie.ai → Settings → API Key |
| `CRON_SECRET` | Generate a random string: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your production URL |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## CSV Import Format

Upload a CSV with these columns (all optional except email):

```csv
type,first_name,last_name,email,company_name,package,birth_date,start_date,renewal_date
employee,Jane,Smith,jane@acme.com,Acme Corp,growth,1990-06-15,2022-03-01,
client,John,Doe,john@corp.com,Corp Inc,enterprise,,,2025-09-01
prospect,Alice,Brown,alice@startup.io,Startup,,,,
```

- `type`: `employee` | `client` | `prospect`
- `birth_date`, `start_date`, `renewal_date`: ISO format `YYYY-MM-DD`
- `package`: free text (e.g. `growth`, `enterprise`, `treat_outreach`, `conversion_landing`)

## Automation Flows

| Trigger type | Who | What happens |
|---|---|---|
| `birthday` | Anyone with birth_date | Email + Runway video via kie.ai |
| `anniversary` | Employees with start_date | Email + Veo3 video via kie.ai |
| `renewal` | Clients with renewal_date | Email + Runway video |
| `onboarding` | New employees | Welcome email with quiz link |
| `outreach` (treat_outreach) | Prospects | Personalised treat email |
| `outreach` (conversion_landing) | Prospects | AI-generated landing page + email |

## Deploying to Vercel

### 1. Push to GitHub

```bash
git remote add origin https://github.com/your-username/culturer-platform.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 3. Add environment variables

In Vercel → Settings → Environment Variables, add all variables from `.env.local`, setting `NEXT_PUBLIC_APP_URL` to your production Vercel URL.

### 4. Cron jobs

The `vercel.json` file configures the daily cron to run at 08:00 UTC. The endpoint internally uses Amsterdam timezone to process triggers for the correct calendar day.

### 5. Deploy

```bash
vercel --prod
```

## Architecture

```
app/
├── (dashboard)/          # Protected dashboard (requires auth)
│   ├── layout.tsx        # Auth check + nav
│   └── page.tsx          # Server component, fetches data
├── api/
│   ├── import/           # CSV import endpoint
│   ├── actions/          # Manual trigger firing
│   ├── quiz/             # Public quiz submission
│   ├── webhooks/kie/     # Kie.ai video callbacks
│   └── cron/daily/       # Daily automation runner
├── quiz/[token]/         # Public quiz page
├── p/[slug]/             # Public landing pages
└── login/                # Authentication

components/
├── DashboardClient.tsx   # Main dashboard UI (client component)
└── QuizForm.tsx          # Quiz form (client component)

lib/
├── actions.ts            # Core automation logic
├── prompts.ts            # AI prompt templates
└── supabase/
    ├── server.ts         # Server-side Supabase client
    └── client.ts         # Browser Supabase client
```

## Security notes

- All dashboard/API routes (except `/quiz/*`, `/p/*`, `/api/quiz`, `/api/webhooks/kie`) require a valid Supabase session
- The daily cron endpoint is protected by `CRON_SECRET` via Bearer token
- RLS is enabled on all tables; service role key is only used server-side
- Quiz links are single-use (locked after submission)
