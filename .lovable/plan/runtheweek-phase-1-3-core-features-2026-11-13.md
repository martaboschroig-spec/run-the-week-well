# RunTheWeek — Phase 1 (3 core features)

## What you'll be able to do
- Sign up / sign in with email and password. The first person creates a household, which starts with the example family already filled in (Sarah – Mom, Michael – Dad, Grandma – Caregiver; Emma 12, Leo 9, Sophie 6). You can edit or delete any of them.
- Each adult in Family can have an email. When that person signs up with the same email, they are linked to their family member automatically ("I am Dad"). Adults without an account still get assigned tasks.
- Full create, edit, delete for children, adults, activities and "what to bring" items (with checkboxes). Everything stays after reloading.

## Screens (English, mobile first)
- **Schedule** (home): Day / Week (default) / Month. Week groups by day with "17 activities · 14 covered · 3 need attention". Month is a clean calendar; tap a day to open it. Needs Attention section on top, or a big calm "Everything's covered ✓ / Your week is covered" moment.
- **My Tasks**: Today / This Week / This Month / All, as a personal agenda: time, child, activity, Drop-off/Pickup, place, [Request change]. Shows "Waiting for Mom" on pending ones.
- **Activities** list + **Add / Edit activity** (child, name, date, start/end, place, one-time or weekly on chosen weekdays until an optional end date, drop-off, pickup, bring items).
- **Family**: adults and children, each child with a soft color; tap an adult to see "Dad's responsibilities" (today, upcoming, this month: 12 · 7 drop-offs · 5 pickups).
- **Notifications** (bell with count): "Dad needs your help. Can you pick up Emma from soccer?" [Accept] [Can't do it]; decline notice back to requester; history of past changes (Dad → Mom · Accepted · Nov 12).
- **Settings**: household name, your profile, sign out.
- Navigation: bottom bar on mobile (Schedule, My Tasks, Activities, Family) + bell + "+ Add activity"; slim sidebar on desktop.

## Business rules (enforced on the server)
- Requesting a change never moves the responsibility. Pending/declined/cancelled keep the original person; only Accept moves it, in one atomic step, keeping history.
- Only the proposed person can accept/decline; only the requester can cancel; one pending request per responsibility.
- Needs attention: missing drop-off, missing pickup, pending request ("Waiting for Mom"), declined request, same adult in overlapping activities ("Dad is needed in two places at the same time."). Each item has an action (Assign someone / Resolve / View request).
- All data is private to the household.

## Look and feel
Warm off-white background, dark text, one friendly muted teal brand color, soft green / amber / soft red for covered / waiting / attention, soft lavender / blue / coral child colors. Modern humane sans-serif (Plus Jakarta Sans), generous spacing, soft corners, large tap targets, bottom sheets on mobile. No gradients, glow, dashboards or AI styling.

## Technical details
- Lovable Cloud: auth (email/password), Postgres with RLS scoped by household membership.
- Tables: households, family_members (household_id, name, role_label, email, user_id nullable), children (household_id, name, age, color), activities (child_id, name, start_date, start_time, end_time, location, recurrence: none|weekly, weekdays int[], until_date), activity_items (activity_id, label, checked, position), activity_assignments (activity_id, kind dropoff|pickup, member_id; unique per activity+kind), reassignment_requests (assignment_id, from_member, to_member, requested_by, status, message, created_at, responded_at), notifications (recipient_member_id, request_id, type, read_at). Child/activity are derived via FKs, not duplicated.
- Occurrences of recurring activities are expanded on the server for a date range (no extra table).
- Postgres functions (security definer, membership-checked) for request / accept / decline / cancel and for linking new users by email; household creation seeds the example family.
- Server functions compute schedule occurrences, My Tasks, needs-attention and covered counts; React only renders and calls them. TanStack Query with invalidation after mutations.
- Vitest tests for the pure rules: overlap detection, recurrence expansion, needs-attention classification.
