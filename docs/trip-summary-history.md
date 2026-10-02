# Trip Summary and Trip History

Implements SCRUM-215 and SCRUM-309.

After confirming **End Trip**, the driver sees the saved trip summary. Completing the last stop opens the same summary automatically. Completion replaces the Active Trip screen only after the Firestore write succeeds. **Back to Home** resets the driver navigation to the Home tab. A failed save leaves the active trip and its completed stops available for retry.

Both roles can open **Settings → Trip History** and select a completed journey to see its read-only summary. The screen loads on first focus and preserves the list when returning from a summary. Pull-to-refresh keeps the list visible, including after a refresh failure, and supports retry. Locally completing a trip triggers a fresh query on reopening history. Account, role or summary-ID changes invalidate the relevant cached result. Drivers see trips they drove. Passengers see new trips for communities they belonged to at departure, including trips after they leave that community.

## Saved trip data

New `trips/{id}` documents use `schemaVersion: 2`, retain the existing driver, community, date, shift and timestamp fields, and add only IDs and aggregate counts:

| Field | Purpose |
| --- | --- |
| `plannedStopIds`, `plannedPassengerIds` | Original stop and scheduled pickup IDs, preserved on resume |
| `participantIds` | Community member IDs at departure, including absent passengers |
| `totalStopsPlanned` | Number of physical stops in that route |
| `passengersPlanned` | Number of distinct passengers scheduled for pickup |
| `completedStopIds`, `collectedPassengerIds` | Distinct completed stops and collected passenger IDs |
| `summary` | Planned/completed stops, planned/collected/missed passengers and duration in seconds |

The full ordered route, passenger names, pickup/drop-off coordinates and detailed completion log live in `trips/{id}/private/route`, accessible only to the owning driver under the supplied replacement rules. Creation, progress and completion batch the shared record and private route writes atomically. A failed batch does not publish partial progress. Collected passengers are distinct IDs in completed pickup logs. Missed passengers are scheduled passengers without a completed pickup; drop-offs never count as additional collected passengers.

History queries completed trips by `driverId` or by `schemaVersion: 2` and `participantIds`, orders by `endedAt` descending in Firestore, and fetches the newest 50. Active-trip lookup filters by driver, date, shift and active/pending status. The required composite indexes are in `firestore.indexes.json`. The detail view also checks account access.

## Firebase setup required before release

The live rules supplied during review allow anyone to read/write all documents until December 31, 2026. A private subcollection alone cannot protect route data under those rules. This change supplies `firestore.rules`, which restricts trips to their driver or historical members of completed schema-v2 trips, restricts private routes to their driver, and requires bounded list queries. Shared writes reject legacy route fields and preserve historical membership. The broad temporary rule excludes the entire `trips` subtree so it cannot override these restrictions. Other collections retain the supplied temporary policy.

These replacement rules and indexes are **local files, not deployed changes**. Before releasing the application, the Firebase project owner must publish the replacement rules in **Firestore Database → Rules** and provision the indexes from `firestore.indexes.json` in **Firestore Database → Indexes**, or deploy both through Firebase CLI. Do not keep the original broad `/{document=**}` allow alongside the new trip rules. The emulator validates permissions and actual application queries; it does not verify production index provisioning.

## Older trips

Existing completed trips still display their recorded start/end times, duration, completed stops and collected passengers. Missing planned totals and missed-passenger counts display **Not recorded** or **—**. The app does not invent those values.

Drivers retain access to their older completed trips. Passenger history deliberately excludes legacy documents because they can contain other passengers' names and coordinates; Firestore cannot hide individual fields during a document read. There is no per-community legacy query that could expose these fields or make modern history fail. Older active trips are migrated on driver resume: their original route and log move into the private document and the legacy public fields are deleted in the same batch. Missing historical membership cannot be reconstructed; new trips preserve it in `participantIds`.

## Validation

```sh
npm ci
npm test
npm run test:rules
npx tsc --noEmit
npx expo-doctor@latest
npx expo export --platform android --platform ios --output-dir .expo/trip-validation-export --max-workers 2
```

The app test suite covers summary calculations, mixed pickup/drop-off stops, early endings, historical passenger access, legacy records, read failures, resumed routes, duplicate taps, failed/retried completion writes and cached refresh behavior. The rules suite requires Java 21+ and runs against the isolated `demo-trip-review` emulator project, never the live Firebase project. It exercises the actual repository queries/writes and verifies member, driver, anonymous and private-route permissions.

The reusable Expo Go smoke-test script is maintained on a separate tooling branch as requested in review. Automated validation here checks Expo Doctor, SDK compatibility, Android/iOS Expo Go manifests and development bundles, including both new screens. It does not simulate phone interaction or writes against live Firestore. The production export separately verifies Android and iOS Hermes bundles.

Maps configuration is inherited from the existing app. Supply `GOOGLE_MAPS_API_KEY` locally to test map directions; the trip summary and history screens do not add native modules or require a development build.
