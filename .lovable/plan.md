

## Plan: Automated Emails on Speaker Application Submission

### What happens
When a speaker submits their application (status changes to "submitted"), two emails are sent automatically:
1. **Confirmation to the applicant** -- thanking them, summarizing their submission (name, session title, track), and letting them know what to expect next.
2. **Notification to admin (team@creatorcompany.co.uk)** -- with the applicant's details so you're immediately aware of new submissions.

### How it works

**Best approach: Database trigger + Edge Function**

A database trigger fires when a `speaker_applications` row is updated to `status = 'submitted'`. It calls a new edge function that sends both emails via Resend (already configured). This is the cleanest approach because:
- It works regardless of how the submission happens (front-end form, admin status change, future API)
- No changes needed to the front-end code
- Single source of truth

### Technical steps

1. **Create new edge function `notify-speaker-submission`**
   - Accepts `application_id` from the trigger webhook
   - Fetches the full application record using service role
   - Sends confirmation email to the applicant (branded, with submission summary)
   - Sends notification email to team@creatorcompany.co.uk (with applicant details + link to admin panel)
   - Uses Resend (already set up with `RESEND_API_KEY`)

2. **Create a database trigger + webhook**
   - Trigger on `speaker_applications` table: fires on UPDATE when `NEW.status = 'submitted'` and `OLD.status != 'submitted'`
   - Uses `pg_net` or a Supabase database webhook to call the edge function
   - Alternative (simpler): Use a Supabase database webhook configured via migration to POST to the edge function

3. **Actually, simplest reliable approach**: Call the edge function directly from the front-end `handleSubmit` in `CallForSpeakers.tsx` after successful submission. This avoids database webhook complexity.

   **Revised approach -- client-side call after submit:**
   - After the RPC `update_my_speaker_application` succeeds with status "submitted", invoke the new edge function passing the application data
   - The edge function doesn't need auth (applicant is anonymous), so set `verify_jwt = false` but validate with a shared approach
   - Edge function sends both emails

### Files to create/modify

- **Create** `supabase/functions/notify-speaker-submission/index.ts` -- sends both emails
- **Modify** `src/pages/CallForSpeakers.tsx` -- call the new function after successful submission
- **Update** `supabase/config.toml` -- add function config with `verify_jwt = false`

### Email content

**Applicant confirmation:**
- Subject: "Application Received - Festival of AI 2026"
- Body: Thank you, summary of session title/track, what happens next, deadline reminder

**Admin notification:**
- Subject: "New Speaker Application: [Name]"
- Body: Full applicant details, session info, link to admin panel at `https://festivalof.ai/admin/speaker-applications`

