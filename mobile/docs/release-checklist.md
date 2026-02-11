# Ownly iOS Release Readiness Checklist

## Quality Gates (run from `mobile/`)

```bash
npm run typecheck
npm run lint
npm run test
npm run build:check
# or all-in-one:
npm run quality
```

## Internal/TestFlight Checklist

1. **Code health**
   - `npm run quality` passes on the release branch.
   - No uncommitted local changes.
2. **Push notifications**
   - Physical iPhone confirms permission prompt and token registration.
   - Push tap deep-links into the expected screen (message thread, listing, inventory item).
3. **Core flows smoke test (iOS simulator + device)**
   - Auth (sign in/out)
   - Inventory browse/detail
   - Marketplace list/detail/chat/transaction status updates
   - Settings notification center + push controls
4. **Safe-area / interaction polish**
   - Notch and home-indicator spacing validated on at least one small and one large iPhone simulator.
   - Native gestures and back navigation are working.
5. **Build artifacts**
   - `expo export --platform ios` completes without errors.
   - EAS/TestFlight build metadata prepared (version/build number, release notes).
