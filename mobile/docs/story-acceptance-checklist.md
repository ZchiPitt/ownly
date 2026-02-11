# Ownly iOS Story Acceptance Checklist (US-001 ~ US-027)

> Scope: iOS only (Expo React Native). Primary verification surface is iOS Simulator + physical iPhone for push/camera realism.

## Environment pre-check
- [ ] `cd mobile && npm install`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build:check`
- [ ] `npx expo start --ios` launches app in Simulator

---

## US-001 Bootstrap Expo iOS app workspace
- Steps: launch app via Expo in Simulator.
- Expected: app boots successfully, no startup crash.

## US-002 Supabase client + env for mobile
- Steps: run app with and without required env values.
- Expected: valid env runs; missing env shows clear startup/config error.

## US-003 Mobile auth session persistence
- Steps: sign in, terminate app, relaunch.
- Expected: session persists and user remains authenticated.

## US-004 Login / Signup / Reset screens
- Steps: validate all auth forms with invalid + valid inputs.
- Expected: validation shown; successful auth routes into app shell.

## US-005 iOS-native navigation shell
- Steps: switch all tabs and open/close stack screens.
- Expected: tab + stack flow is native, back behavior is correct.

## US-006 Inventory list with pagination
- Steps: scroll inventory with sufficient records.
- Expected: list paginates and app shows loading/empty/error states correctly.

## US-007 Inventory sort + filters
- Steps: apply each sort and category/location filters.
- Expected: result set changes consistently with selected controls.

## US-008 Item detail read view
- Steps: open item from list.
- Expected: photo + metadata render with safe fallback values.

## US-009 Item form (create/edit)
- Steps: open create and edit forms, try invalid and valid values.
- Expected: validations fire; fields behave consistently in both modes.

## US-010 Item mutations (create/update/favorite/delete)
- Steps: create item, edit item, favorite toggle, soft delete.
- Expected: data persists and list/detail reflect new state.

## US-011 Camera + photo library picker
- Steps: test camera and library flows with permissions allowed/denied.
- Expected: graceful denied messaging and image preview before upload.

## US-012 Mobile image processing pipeline
- Steps: process large image and HEIC sample.
- Expected: image is resized/compressed, thumbnail generated, HEIC handled.

## US-013 Upload + analyze-image edge function
- Steps: upload from Add flow and trigger AI analysis.
- Expected: upload succeeds, analyze result/timeout/error states handled.

## US-014 Single-item quick add
- Steps: analyze image with one detection and use quick add.
- Expected: one-tap save creates item with AI metadata.

## US-015 Multi-item batch save
- Steps: analyze image with multiple detections; batch save and sequential edit.
- Expected: selected detections save successfully and share source batch id.

## US-016 Manual fallback when AI fails
- Steps: simulate AI failure path.
- Expected: retry + manual-entry paths work and temp upload cleanup runs on cancel.

## US-017 Search screen text query
- Steps: query by name/category/location keywords.
- Expected: debounced search returns matches and navigates to item detail.

## US-018 Marketplace feed + listing detail
- Steps: open marketplace feed and listing detail pages.
- Expected: active listings load with complete loading/empty/error handling.

## US-019 My listings management
- Steps: create/edit/remove listings, switch active/sold/reserved states.
- Expected: lifecycle transitions persist and UI updates immediately.

## US-020 Saved listings
- Steps: save/unsave from feed/detail, relaunch app.
- Expected: saved state remains consistent across restart.

## US-021 Marketplace messages/chat
- Steps: open chat, send messages, verify unread/read updates.
- Expected: conversations and chat state update correctly.

## US-022 Transaction status flow
- Steps: execute pending/accepted/completed/cancelled transitions with buyer/seller roles.
- Expected: permission checks enforced; listing status + notification records updated.

## US-023 In-app notifications center
- Steps: open notifications list, mark as read, tap to navigate.
- Expected: unread/read status works; deep-link routing lands on related screen.

## US-024 Expo Push permission + token registration
- Steps: grant/deny permission, refresh token registration.
- Expected: push token is stored/synced for signed-in user.

## US-025 Core marketplace push delivery
- Steps: trigger inquiry/message/transaction events.
- Expected: push payload received; foreground/background tap routes correctly.

## US-026 iOS-native visual system polish
- Steps: inspect core screens for spacing/typography/cells/segmented controls/safe-area behavior.
- Expected: UI matches iOS-native style and interactions feel consistent.

## US-027 Quality gates + release readiness
- Steps: run `npm run quality`, review release checklist.
- Expected: all quality gates pass; release checklist is complete and actionable.

---

## Sign-off template
- Reviewer:
- Date:
- Simulator device + iOS version:
- Physical iPhone model + iOS version (for camera/push):
- Pass count:
- Fail count:
- Blockers:
