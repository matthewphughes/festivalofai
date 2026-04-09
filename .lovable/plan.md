

## Add "Convert to Speaker" to Admin Speaker Applications

Based on the TubeFest implementation, add a "Convert to Speaker" button that appears when an application's status is set to "accepted", which creates a speaker profile and a session from the application data.

### Changes

**1. Update `src/pages/AdminSpeakerApplications.tsx`**

Add a `convertToSpeakerMutation` that:
- Builds a full name and slug from the application
- Checks for duplicate speaker slugs
- Inserts a new row into `speakers` table with: name, slug, bio, image_url, website_url, youtube_url, linkedin_url, instagram_url, tiktok_url, years (`[2026]`), display_order (0)
- If `session_title` exists, inserts a new row into `sessions` table with: title, description, track (null for admin to assign), event_year (2026), speaker_name, speaker_id (linking to new speaker)
- On success, invalidates queries and closes dialog

Add a "Convert to Speaker" button next to the status dropdown in the detail dialog, visible only when `status === 'accepted'`.

Add a status indicator row in the dialog showing the current status badge alongside the dropdown and convert button, styled with a background panel (matching TubeFest's layout).

**2. No database changes needed** — the `speakers` and `sessions` tables already have the required columns, and admin RLS policies already allow inserts.

