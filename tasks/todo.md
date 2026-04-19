# Phase 7: Online Multiplayer

## Task 29: Firebase Presence Service

- **Dependencies:** Task 4, Task 5 (done)
- **Test targets:** `FirebasePresenceService` — mock RTDB; `usePresence` — mount behavior
- Impl
- Test

## Task 30: OnlineCounter (Live Data)

- **Dependencies:** Task 29, Task 24
- **Test targets:** `OnlineCounter` — render with count prop / smoke with mocked hook
- Impl
- Test

## Task 31: Firebase Queue & Game Services

- **Dependencies:** Task 4, Task 5
- **Test targets:** pure helpers / transaction pairing logic extracted if needed
- Impl
- Test

## Task 32: useOnlineGame

- **Dependencies:** Task 31, Task 10
- **Test targets:** mapping Firestore doc → store state (pure function tests)
- Impl
- Test

## Task 33: Matchmaking Page & Flow

- **Dependencies:** Task 31, Task 32, Task 6
- **Test targets:** `Matchmaking.test.tsx`
- Impl
- Test

## Task 34: Online Random E2E Wiring

- **Dependencies:** Task 32, Task 33, Task 15
- **Test targets:** extend Game / useOnlineGame tests where practical
- Impl
- Test

## Task 35: Play with Friend

- **Dependencies:** Task 34, Task 31
- **Test targets:** `FriendLobby.test.tsx`
- Impl
- Test

---

# Phase 8: Polish & Hardening

## Task 36: Firestore Security Rules

- **Dependencies:** Task 31 (done)
- **Test targets:** `firebaseJson.test.ts` (rules path wiring)
- [x] Impl
- [x] Test

## Task 37: Edge Cases & Error States

- **Dependencies:** Task 34 (done)
- **Test targets:** `GameBoard.test.tsx` (interaction lock); `subscribeRtdbConnected.test.ts`
- [x] Impl
- [x] Test

## Task 38: Accessibility & Reduced-Motion Audit

- **Dependencies:** Task 12, 13, 15 (done)
- **Test targets:** extend existing component tests; CSS reduced-motion coverage
- [x] Impl
- [x] Test

## Task 39: Performance Audit & Bundle Optimization

- **Dependencies:** Task 28, 34 (done)
- **Test targets:** build output / lazy route smoke via `App` integration
- [x] Impl
- [x] Test

_Note: Deploy rules with `firebase deploy --only firestore:rules` when ready. Lighthouse FCP should be verified manually in DevTools._