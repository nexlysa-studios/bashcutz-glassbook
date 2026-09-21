# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## Supabase setup (bookings + admin)

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql` from this repo.
3. In Supabase Auth, create an admin user (email/password).
4. Add these vars to `.env`:

```sh
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Restart the dev server.

Notes:
- Bookings, blocked days, and blocked time slots now persist in Supabase (not localStorage).
- Admin login now uses Supabase Auth email/password.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Newsletter setup

The newsletter frontend calls Supabase Edge Functions; Resend is never called from the browser. Apply the migration, store the Resend credentials as Supabase secrets, and deploy the three newsletter functions:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set RESEND_API_KEY="re_xxxxx"
supabase secrets set RESEND_FROM_EMAIL="BashCutz <updates@bashcutz.co.za>"
supabase secrets set PUBLIC_SITE_URL="https://bashcutz.co.za"
supabase secrets set NEWSLETTER_SITE_URL="https://bashcutz.co.za"
supabase functions deploy newsletter-subscribe --no-verify-jwt
supabase functions deploy newsletter-unsubscribe --no-verify-jwt
supabase functions deploy send-newsletter
```

`newsletter-subscribe` and `newsletter-unsubscribe` are intentionally public preference endpoints and perform their own validation. `send-newsletter` keeps JWT verification enabled and also verifies the user and authenticated-admin RLS access inside the function.

Do not create a `VITE_RESEND_API_KEY` variable locally or in Netlify. If one was previously configured, remove it and rotate that Resend key because `VITE_` values are browser-visible.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
