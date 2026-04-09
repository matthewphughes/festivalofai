

## Call for Speakers - Full Implementation Plan

Modelled on the [TubeFest Website](/projects/fb647546-afc4-4f8a-8949-df39c460854a) speaker application system, adapted for Festival of AI.

### Overview

Create a multi-step speaker application form at `/speak`, a thank-you page at `/speaker-thanks`, an admin review page at `/admin/speaker-applications`, and add a "Become a Speaker" link to the footer.

---

### 1. Database: `speaker_applications` table + RPC functions

Create via migration:

- **Table** with columns: `id`, `session_id` (for anonymous draft tracking), `user_id` (nullable), `first_name`, `last_name`, `email`, `phone`, `address_line1/2`, `city`, `postal_code`, `website_url`, `youtube_url`, `linkedin_url`, `tiktok_url`, `instagram_url`, `session_title`, `session_description`, `profile_picture_url`, `profile_picture_original_url`, `bio`, `preferred_track` (e.g. "main", "workshop", "either"), `supporting_materials`, `additional_comments`, `admin_notes`, `status` (draft/submitted/reviewed/shortlist/accepted/rejected), `submitted_at`, `created_at`, `updated_at`
- **RLS policies**: Admins full access; authenticated users can view/update own; anonymous access only via RPC
- **3 security-definer RPC functions**: `create_speaker_application`, `get_my_speaker_application`, `update_my_speaker_application` -- these allow anonymous users to save/resume drafts using a localStorage session ID
- **Trigger** for `updated_at`, indexes on `status`, `user_id`, `session_id`

### 2. Landing page: `/speak` (BecomeASpeaker.tsx)

A marketing page (similar to TubeFest's) adapted for Festival of AI:
- **Countdown timer** to application deadline
- **Hero section**: "Become a Festival of AI Speaker" with CTA to `/call-for-speakers`
- **Benefits cards**: Reach attendees, network, professional recording, etc.
- **"What We're Looking For"** section describing session types relevant to AI (Main Stage, Workshop, Lightning Talk)
- **Speaker FAQs** accordion
- **CTA button** linking to the application form

### 3. Application form: `/call-for-speakers` (CallForSpeakers.tsx)

7-step multi-step form with progress bar:
1. **Contact Info** -- first name, last name, email, phone (all required)
2. **Address** -- address lines, city, postal code (required)
3. **Headshot & Bio** -- image upload to `speaker-images` storage bucket with crop dialog, bio textarea (required)
4. **Session Details** -- title, description, preferred track select (required)
5. **Social Links** -- website, YouTube, LinkedIn, TikTok, Instagram (optional)
6. **Final Details** -- supporting materials (speaking videos), additional comments
7. **Review & Submit** -- summary of all fields, submit button

Features:
- **Save & resume** via localStorage session ID + RPC functions (no login required)
- **Auto-save** on each "Next" step
- **Return link** shown after save so applicant can bookmark/copy
- **Validation** per step before advancing
- **On submit**: update status to "submitted", send confirmation email to applicant, send admin notification email

### 4. Thank you page: `/speaker-thanks` (SpeakerThanks.tsx)

Simple confirmation page with social media links for Festival of AI.

### 5. Admin page: `/admin/speaker-applications` (AdminSpeakerApplications.tsx)

- Table listing all applications with search/filter by status
- View application detail in dialog
- Update status (draft/submitted/reviewed/shortlist/accepted/rejected) with optional email notification
- Add admin notes
- Delete applications
- CSV export

### 6. Footer + routing updates

- Add "Become a Speaker" link to Footer.tsx (in the Quick Links section)
- Add routes: `/speak`, `/call-for-speakers`, `/speaker-thanks`, `/admin/speaker-applications`
- Add link in Admin.tsx dashboard

### Technical Details

- **Image upload**: Uses existing `speaker-images` storage bucket
- **RPC approach**: Security-definer functions bypass RLS for anonymous users, validated by `session_id` match -- same proven pattern from TubeFest
- **No login required**: Applicants don't need an account to apply; session ID in localStorage ties them to their draft
- **Preferred tracks**: Adapted to "main", "workshop", "lightning" instead of TubeFest's creator/business/AI stages

