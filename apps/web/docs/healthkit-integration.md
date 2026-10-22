# Apple Health integration: architecture and scope

The integration reads the iPhone HealthKit store and optionally copies selected data to the user's OpenAthlete instance. Watch measurements arrive through the existing iPhone Health store; no Watch app or Garmin Body Battery integration is added.

## Implemented data

| Measurement | Read/preview | Server import |
| --- | --- | --- |
| HRV | Apple's SDNN, milliseconds; original samples/source/timestamps retained locally | Daily mean as distinct `HRV_SDNN`, never relabelled RMSSD |
| Resting heart rate | bpm, most recent daily sample | `HR_REST` |
| Sleep | Original categories and intervals; union of asleep intervals, main episode assigned to wake date | Main sleep duration in hours as `SLEEP_DURATION` |
| Weight | kg, latest daily sample | `WEIGHT` |
| Body fat | percent, latest daily sample | `BODY_FAT` |
| Respiratory rate, oxygen, wrist temperature | Read/preview with original units and source | Not uploaded in this protocol |
| Sleep stages | Core/deep/REM/unspecified/awake preview | Not uploaded in this protocol |
| Watch workouts | Original Watch recordings, optional HR/power/cadence and route; pauses/laps | One normal calendar activity, matched/enriched against Strava/Garmin |

Muscle mass, bone mass and body-water percentage are not invented from other measurements. They are excluded because this implementation has no corresponding HealthKit field. The installed iOS 27.1 SDK contains no public sleep-score HealthKit identifier; the app does not synthesize or claim to import Apple's sleep score.

Raw daily samples retain UUID, start/end instants, unit, source revision and available device/time-zone metadata in the protected local cache. The daily-summary endpoint stores the date bucket, type, value, explicit unit, time zone, sample count and `APPLE_HEALTH` provenance. **It does not upload the original measurement timestamps/source revisions or individual sleep intervals.** Full sample-level server provenance requires a separate contract and is not complete here.

## Components

- `ios/HealthKitCore` contains testable Foundation models, aggregation, atomic protected persistence and deterministic workout encoding. Original measurement definitions remain separate.
- `HealthKitReader.swift` bridges read-only previews, session binding, consent and manual-sync exclusion. Nested JSON uses Capacitor's recursive converter.
- `HealthKitAutomaticSync.swift` owns Keychain credentials, observer delivery, bounded native uploads, receipts and retry state. No JavaScript background timer is required.
- Web settings request explicit scoped consent. `/dashboard/sync` provides normal sync/file-import actions. Manual transports pin the selected server/account and stop on session changes.
- `POST /metric/import` validates bounded daily summaries and updates only Apple Health-owned rows. Manual/provider entries take precedence.
- `POST /activity-import/healthkit` validates the shared v1 DTO. Per-athlete transaction locks serialize source identity and matching. Source IDs are scoped by athlete/provider; immutable revisions reject conflicting reuse.
- Matching/enrichment is shared by Apple Health, Strava and Garmin. A unique strong match attaches a source to one canonical activity; missing channels/fields can be enriched while existing user edits remain protected. Ambiguous matches stay uncounted with `needs_review`. Source observations preserve independent timestamps even when canonical channels cannot align without interpolation.
- Derived processing is queued with an idempotent source/revision key; a durable pending flag survives enqueue failure. Account deletion cascades source records/observations. Account export streams raw source payloads only on explicit stream opt-in.

The provider refactor, scoped uniqueness migration, optional Firebase/self-hosted startup fixes and login body-parser regression fix are dependencies of this flow, not independent feature additions. Existing Polar/Suunto code only receives the identity/provenance changes required by the new uniqueness key.

## Deliberate limits and open requirements

1. **Deletion propagation:** anchored HealthKit deletions remove local records and recompute local summaries. There is no server tombstone/detach API. A fully deleted day/workout can therefore remain on the server. Account deletion is a different operation and is covered. Do not infer a destructive server deletion from an absent query result.
2. **Ambiguous activities:** the receipt endpoint exposes candidates, but no resolution action/UI exists. Ordinary clear matches need no user choice; ambiguous recordings must not be advertised as fully imported.
3. **Background timing:** observer delivery is opportunistic, and a native attempt is bounded. Real-device acceptance must establish eventual progress on large histories and after lock/network/token interruptions.
4. **Raw measurement fidelity on the server:** only daily summaries are sent. Respiratory/oxygen/temperature and sleep-stage server storage need an explicitly versioned shared schema, permission/selection updates and deletion ownership before implementation.
5. **Release privacy:** maintainers must review Health-data visibility, coaching/AI/export uses, privacy policy and App Store disclosures. Opt-in upload to a server is not a blanket approval for unrelated data use.

See [setup and operation](healthkit-ios-preview.md), [workout contract](healthkit-workout-api.md), and [review evidence](healthkit-pr-review.md).
