# Trip Summary and Trip History

Implements SCRUM-215 and SCRUM-309.

After confirming **End Trip**, the driver sees the saved trip summary. Completing the last stop opens the same summary automatically. Completion replaces the Active Trip screen only after the Firestore write succeeds. **Back to Home** resets the driver navigation to the Home tab. A failed save leaves the active trip and its completed stops available for retry.

Both roles can open **Settings → Trip History** and select a completed journey to see its read-only summary. The list refreshes when focused, supports pull-to-refresh, and handles loading, empty and retryable error states. Drivers see trips they drove. Passengers see trips for communities they belonged to at departure, including trips after they leave that community.

## Saved trip data

New `trips/{id}` documents retain the existing driver, community, date, shift and timestamp fields, and add:

| Field | Purpose |
| --- | --- |
| `plannedStops` | Original ordered pickup/drop-off route, preserved on resume |
| `participantIds` | Community member IDs at departure, including absent passengers |
| `totalStopsPlanned` | Number of physical stops in that route |
| `passengersPlanned` | Number of distinct passengers scheduled for pickup |
| `completedStops` | Existing per-stop pickup/drop-off log |
| `summary` | Planned/completed stops, planned/collected/missed passengers and duration in seconds |

Completion writes `status: 'completed'`, `endedAt`, the complete stop log and summary totals in one document update. Collected passengers are distinct IDs in completed pickup logs. Missed passengers are scheduled passengers without a completed pickup; drop-offs never count as additional collected passengers.

History uses single-field queries on `driverId` or `participantIds`, filters completed trips and sorts by end time in the app. No new composite indexes are needed. The detail view also checks that the signed-in account can view the completed record. Backend Firestore rules must permit those queries; live backend rules are outside this repository.

## Older trips

Existing completed trips still display their recorded start/end times, duration, completed stops and collected passengers. Missing planned totals and missed-passenger counts display **Not recorded** or **—**. The app does not invent those values.

Older documents have no historical membership snapshot. The passenger fallback searches their current communities and displays only trips whose pickup/drop-off logs prove participation. Membership of absent passengers, or membership after leaving an old community, cannot be reconstructed from those older documents. New trips preserve this information in `participantIds`.

## Validation

```sh
npm ci
npm test
npx tsc --noEmit
npx expo-doctor@latest
npm run test:expo-go
npx expo export --platform android --platform ios --output-dir .expo/trip-validation-export --max-workers 2
```

The test suite covers summary calculations, mixed pickup/drop-off stops, early endings, historical passenger access, legacy records, read failures, resumed routes, duplicate taps and failed/retried completion writes.

`test:expo-go` starts a temporary Metro server explicitly in Expo Go mode, checks SDK compatibility, requests Android and iOS manifests and their development bundles, verifies both screens are bundled, and stops its own server. This is an automated compatibility/bundling check. It does not simulate phone interaction or writes against live Firestore. The production export separately verifies Android and iOS Hermes bundles.

Maps configuration is inherited from the existing app. Supply `GOOGLE_MAPS_API_KEY` locally to test map directions; the trip summary and history screens do not add native modules or require a development build.
