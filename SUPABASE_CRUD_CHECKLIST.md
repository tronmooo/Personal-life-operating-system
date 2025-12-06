# Supabase CRUD Verification Checklist

Use this checklist after any Supabase-related change to confirm core data flows still work. Each item references the primary UI surface and the backing table/domain.

## Authentication
- [ ] Sign in with a valid user (NextAuth + Supabase session)
- [ ] Sign out and sign back in to ensure auth tokens refresh

## Domains (`domains` table)
- [ ] Create a new item in a domain (e.g., Health, Home) via the Command Center or domain page and confirm it appears after reload
- [ ] Edit an existing domain item and verify the update persists after refresh
- [ ] Delete a domain item and confirm it is removed from Supabase (check via Supabase dashboard or API route)

## Tasks (`tasks` table)
- [ ] Add a task from the Command Center quick add dialog
- [ ] Toggle task completion and ensure status persists across refresh
- [ ] Delete a task and confirm it no longer appears after reload

## Habits (`habits` table)
- [ ] Create a habit and verify it shows in the Command Center habit list after reload
- [ ] Toggle habit completion; confirm streak/last completed updates
- [ ] Delete a habit and verify removal

## Bills (`bills` table)
- [ ] Add a bill in the Utilities area and ensure it appears in both Utilities page and Supabase
- [ ] Update bill amount/status and confirm persistence
- [ ] Delete a bill and verify it is removed from the list and database

## Events (`events` table)
- [ ] Add an event (e.g., appointment) and confirm it displays in relevant widgets
- [ ] Update event details and confirm persistence
- [ ] Delete the event and ensure it is removed

## Smart Documents (`documents` table)
- [ ] Upload or attach a document (e.g., via document upload component)
- [ ] Confirm metadata (expiration date, domain) appears in UI and Supabase
- [ ] Delete a document record and ensure alerts/Command Center update accordingly

## Analytics (`analytics_events` table)
- [ ] Trigger an analytics event (e.g., interact with a Command Center card)
- [ ] Confirm data appears on `/analytics` or via Supabase dashboard

## Realtime Sync
- [ ] Perform a Supabase change in another tab and confirm Command Center updates (requires `subscribeToAllChanges` working)
- [ ] Perform a change via the app and confirm Supabase console reflects it

## Edge Sync Functions
- [ ] Run `sync-all-data` function (if applicable) and confirm no errors in logs
- [ ] Run direct sync helper (if used) and spot-check counts

## Error Handling & Loading States
- [ ] Disconnect network and perform an action; ensure user-friendly error displays
- [ ] Reconnect and ensure the UI recovers without stale data

Record the date and initials after completing the checklist:

- **Date:** __________
- **Tester:** __________
