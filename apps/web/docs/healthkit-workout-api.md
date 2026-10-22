# HealthKit workout import API

The iOS client, shared contract and backend are consolidated on `feature/healthkit-sync`. See the [client guide](healthkit-ios-preview.md) and [review status](healthkit-pr-review.md). This is a draft integration with explicit deletion and ambiguity-resolution limits.

## Endpoint and ownership

Send one original workout to `POST /activity-import/healthkit`, relative to the
selected instance's API base. For example, this is
`https://train.example.org/api/activity-import/healthkit`. Authenticate with the
existing session bearer token. The server derives the athlete from the signed-in
user, including when the user also coaches other athletes. A supplied athlete
or user ID is rejected; a coach without their own athlete profile receives 403.

`GET /instance` advertises `healthkitWorkoutImport` with `protocolVersion: 1`,
`maxSamples: 100000`, and `maxBodyBytes: 20971520`. Check this before uploading to an older instance. Local previews can be read
without a compatible backend and never upload as a side effect.

This imports an ordinary calendar activity with the instance's existing activity
visibility and processing rules. The native app must obtain separate consent
for workouts, associated measurements and routes, and for copying them to the
selected server. The endpoint does not implement the broader health-connection,
background delivery or raw daily-measurement proposal.

## Request contract

The authoritative validation and TypeScript types are in
[`import-healthkit-workout.dto.ts`](../../../libs/shared/src/types/dtos/core/import-healthkit-workout.dto.ts).
Unknown properties, incompatible units, non-finite values, unordered timestamps
and invalid intervals are rejected. Omit unreadable channels rather than sending
zero values or empty sample arrays.

```json
{
  "protocolVersion": 1,
  "workoutUuid": "11111111-1111-4111-8111-111111111111",
  "revision": 1,
  "name": "Morning run",
  "sport": "RUNNING",
  "startDate": "2026-10-20T08:00:00Z",
  "endDate": "2026-10-20T09:00:00Z",
  "elapsedDuration": { "value": 3600, "unit": "s" },
  "activeDuration": { "value": 3500, "unit": "s" },
  "distance": { "value": 10000, "unit": "m" },
  "energy": { "value": 1800, "unit": "kJ" },
  "source": {
    "bundleIdentifier": "com.apple.health",
    "name": "Apple Watch",
    "version": "1",
    "deviceType": "Watch",
    "recordingKind": "single",
    "original": true,
    "indoor": false
  },
  "streams": {
    "heartrate": {
      "unit": "bpm",
      "samples": [
        { "timestamp": "2026-10-20T08:00:00Z", "value": 120 },
        { "timestamp": "2026-10-20T08:00:01Z", "value": 121 }
      ]
    },
    "route": {
      "unit": "degrees",
      "samples": [
        {
          "timestamp": "2026-10-20T08:00:00Z",
          "latitude": 50.0,
          "longitude": 8.0
        },
        {
          "timestamp": "2026-10-20T08:00:01Z",
          "latitude": 50.0001,
          "longitude": 8.0001
        }
      ]
    }
  },
  "events": [
    { "type": "PAUSE", "timestamp": "2026-10-20T08:20:00Z" },
    { "type": "RESUME", "timestamp": "2026-10-20T08:21:40Z" }
  ],
  "laps": [
    {
      "startDate": "2026-10-20T08:00:00Z",
      "endDate": "2026-10-20T09:00:00Z",
      "name": "Lap 1"
    }
  ]
}
```

`workoutUuid` is the original HealthKit UUID, normalized to lowercase and scoped
to the authenticated athlete and `APPLE_HEALTH`. It is independent of Strava and
Garmin IDs. `revision` is a positive monotonic integer persisted by the client
for that UUID. Retransmit the same payload/revision after a failure. Increment
only when the original recording changes; never assign a fresh UUID to a retry.

Required fields are the protocol, UUID, revision, name, sport, start/end,
elapsed duration and source. Source requires bundle identifier, name and
`original`; do not mark mirrored third-party copies as original Watch recordings.
Device type and version are optional. Arbitrary metadata and device serial
numbers are not accepted. Single-sport workouts use OpenAthlete's `SPORT_TYPE`.
Multisport parents are rejected; a separately recorded leg uses
`recordingKind: "multisport_leg"` and `parentWorkoutUuid`. Overlapping legs are
not automatically merged with another recording.

Optional streams are `heartrate` (`bpm`), `watts` (`W`), `cadence` (`rpm`),
cumulative `distance` (`m`), `altitude` (`m`, including negative elevations), and
`route` (`degrees`). Each has independent timestamps, strictly increasing and
inside the workout. At most 100,000 samples are accepted **across all channels**.
Durations use seconds, distance/elevation gain meters, and energy kilojoules;
convert HealthKit units once on the phone. Elapsed duration must agree with
start/end instants within one second and span at most seven days. Active duration
cannot exceed elapsed duration. Pause/resume events must alternate in order;
laps must be ordered and nonoverlapping. Each list is capped at 1,000 entries.

The JSON body is limited to 20 MB for this route. Upload history as separate
workout requests, not one unbounded batch. Request persistence and reconciliation
are synchronous; derived activity processing is asynchronous.

## Acknowledgements and retries

The endpoint returns HTTP 201 with a durable source receipt:

```json
{
  "receiptId": 17,
  "revision": 1,
  "status": "enriched",
  "eventActivityId": 42,
  "eventId": 51,
  "processing": "queued"
}
```

| Status         | Meaning                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| `created`      | A new canonical calendar activity was saved.                                                 |
| `matched`      | A new source/revision was attached without changing canonical data.                          |
| `enriched`     | A matching activity gained usable fields, channels or laps.                                  |
| `unchanged`    | An already acknowledged revision was replayed without changing it.                           |
| `needs_review` | The recording is retained without creating another counted activity; canonical IDs are null. |

A revision reused with a different payload returns HTTP 409
`ACTIVITY_SOURCE_REVISION_CONFLICT`. Immutable revision observations also prevent
an older retry from rolling back newer data. `receiptId` remains stable across
revisions. `processing: "queued"` acknowledges dispatch, not completion of
records, training-load or other derived calculations. `not_required` means this
request did not need another dispatch.

If enqueueing fails, the committed source remains marked pending and the HTTP
request fails. Retry the identical request: it reuses the canonical activity and
the same queue job ID. Processing jobs for this endpoint suppress new AI feedback
and activity push notifications. Normal processing may retry after a worker
failure; derived data belongs to the one canonical activity rather than being
added as another workout.

`GET /activity-import/healthkit/receipts/:receiptId` returns the owner's current
revision, canonical IDs, dispatch state and possible candidate activity IDs.
It does not return raw source observations or report processing completion.
Other athletes receive 404. Pending ambiguous sources remain held on subsequent
uploads; a review UI and explicit resolution endpoint are follow-up work.

## Matching and enrichment

HealthKit, Strava and Garmin summary/file imports use one reconciliation service.
Transactions serialize cooperating imports per athlete before matching, including
concurrent requests and either provider arrival order. `ActivitySource` has a
unique `(athleteId, provider, externalId)` identity and immutable observations for
each accepted revision. The migration backfills legacy provider references and
snapshots without deleting activities or rewriting their relationships. The
legacy primary reference also has scoped uniqueness instead of global bare-ID
uniqueness. Suunto and Polar retain their existing import paths with scoped
lookups and primary-ID constraints; they do not yet participate in shared
enrichment.

Matching requires compatible normalized sports and substantially overlapping UTC
recording intervals. A unique strong candidate has start/end differences within
2% of elapsed duration, bounded to 5–60 seconds, and distance within 5% or 100 m
when both distances exist. Overlap alone is insufficient. Partial recordings,
multiple candidates and overlapping same-provider IDs are held for review.
Back-to-back sessions and different sports remain separate. Existing duplicates
already stored as two canonical activities are not automatically collapsed.

Missing scalar fields and complete timestamp-aligned channels can be added.
For conflicting heart-rate, power and cadence observations owned by this importer,
prefer an original recording, then valid aligned temporal coverage and resolution,
with provider name as a stable tie-breaker. Per-field/channel hashes retain
provenance and prevent replacing values changed by the user. Legacy conflicting
values without that provenance are preserved. Distance, speed, timing and routes
remain on the canonical timeline; conflicting kinematic quantities are not mixed,
summed or averaged. Route gaps remain gaps.

The source channels align by exact UTC instants, never array position. The initial
canonical timeline uses the HealthKit channel with the most samples. An incomplete
numeric channel is retained in the raw source rather than interpolated or padded
with zeros. Sparse independent channels may therefore remain unavailable in
canonical charts even though their original observations are preserved. Scalar
heart-rate/cadence/power summaries currently use sample means, not a reconstructed
continuous signal. Existing titles, descriptions, RPE, feedback and planned-session
links are preserved; a source description fills only an empty description.

New Garmin imports use UTC epoch timestamps without applying the device's local
offset. Previously imported timestamps are preserved; historical activities with
incorrect timestamps may need correction before they can match. Garmin files add
streams/laps to their source and pass through the same reconciliation path, so a
late FIT callback cannot overwrite Watch sensor channels blindly.

All accepted payloads and revisions remain in PostgreSQL for future inspection
and resolution policies. Their storage is not a new public raw-health read API,
and these tables are not added to MCP tools or AI prompts. Absent channels and
absent workouts never request deletion. Explicit source detachment, HealthKit
deletion synchronization and review resolution remain separate work. Manual
native reading/upload and opt-in native background uploads are implemented;
iOS controls background execution and delivery timing.

## Verification

Use a disposable PostgreSQL database for the HTTP/integration suite
`healthkit-workout-import.int-spec.ts`. It exercises authentication, ownership,
unit validation, stable retries/revisions, both provider arrival orders, concurrent
imports, ambiguous receipts, UTC alignment, queue failure recovery, preserved
edits/training links, larger JSON bodies and legacy adoption. Synthetic recordings
are used; no private HealthKit or provider account data is required.
