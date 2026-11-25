import XCTest

@testable import WatchScheduleCore

final class WorkoutMapperTests: XCTestCase {
    // MARK: - Inputs

    private func step(
        _ type: String,
        duration: String? = "TIME",
        value: Double? = 60,
        targets: [WorkoutTargetInput] = [],
        repeatBlock: RepeatBlockInput? = nil,
        order: Int = 0,
        name: String? = nil
    ) -> WorkoutStepInput {
        WorkoutStepInput(
            orderIndex: order,
            stepType: type,
            name: name,
            durationType: duration,
            durationValue: value,
            targets: targets,
            repeatBlock: repeatBlock
        )
    }

    private func repeatBlock(
        _ repetitions: Int,
        _ children: [WorkoutStepInput],
        kind: String? = nil,
        intervalSeconds: Int? = nil,
        timeCapSeconds: Int? = nil
    ) -> RepeatBlockInput {
        RepeatBlockInput(
            repetitions: repetitions,
            kind: kind,
            intervalSeconds: intervalSeconds,
            timeCapSeconds: timeCapSeconds,
            childSteps: children
        )
    }

    private func target(
        _ type: String,
        min: Double? = nil,
        max: Double? = nil,
        value: Double? = nil,
        metric: String? = nil
    ) -> WorkoutTargetInput {
        WorkoutTargetInput(
            targetType: type,
            targetMin: min,
            targetMax: max,
            targetValue: value,
            metricType: metric
        )
    }

    private func event(
        _ steps: [WorkoutStepInput],
        sport: String = "CYCLING",
        athleteId: Int? = 7,
        name: String = "Threshold ride"
    ) -> TrainingEventInput {
        TrainingEventInput(
            eventId: 3001,
            athleteId: athleteId,
            sport: sport,
            name: name,
            workout: EventWorkoutInput(steps: steps)
        )
    }

    private func zone(
        _ id: Int,
        athlete: Int = 7,
        type: String = "POWER",
        index: Int = 0,
        values: [(min: Double, max: Double, sports: [String])]
    ) -> ZoneInput {
        ZoneInput(
            trainingZoneId: id,
            athleteId: athlete,
            type: type,
            index: index,
            values: values.map {
                ZoneValueInput(min: $0.min, max: $0.max, sports: $0.sports)
            }
        )
    }

    // MARK: - Result helpers

    private func plan(
        _ result: MappingResult,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> PlanInput? {
        guard case .plan(let plan) = result else {
            XCTFail("expected a plan, got \(result)", file: file, line: line)
            return nil
        }
        return plan
    }

    private func reason(
        _ result: MappingResult,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> UnsupportedReason? {
        guard case .unsupported(let reason) = result else {
            XCTFail("expected an unsupported reason, got \(result)", file: file, line: line)
            return nil
        }
        return reason
    }

    private func powerRange(_ target: PlannedTarget?) -> ClosedRange<Double>? {
        guard let target, target.metric == .power else { return nil }
        return target.range
    }

    // MARK: - Zones and targets

    func testOwnerCyclingPowerZoneBecomesPowerAlert() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [
            zone(42, athlete: 7, type: "POWER", values: [(210, 245, ["CYCLING"])]),
        ]

        guard let plan = plan(mapPrescription(event, zones: zones)),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(target.metric, .power)
        let mappedPowerRange = powerRange(target)
        XCTAssertEqual(mappedPowerRange, 210...245)
        XCTAssertEqual(target.zoneId, 42)
    }

    func testAnotherOwnersZoneIsNotUsed() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [
            zone(42, athlete: 8, type: "POWER", values: [(210, 245, ["CYCLING"])]),
        ]

        XCTAssertEqual(
            reason(mapPrescription(event, zones: zones)),
            .zoneOwnerMismatch
        )
    }

    func testAnotherSportsZoneValueIsNotUsed() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [
            zone(42, athlete: 7, type: "POWER", values: [(300, 350, ["RUNNING"])]),
        ]

        XCTAssertEqual(
            reason(mapPrescription(event, zones: zones)),
            .zoneSportMismatch
        )
    }

    func testSportSpecificZoneValueWinsOverTheAllSportsDefault() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [
            zone(42, athlete: 7, type: "POWER", values: [
                (190, 210, []),
                (210, 245, ["CYCLING"]),
            ]),
        ]

        guard let plan = plan(mapPrescription(event, zones: zones)),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(powerRange(target), 210...245)
    }

    func testSlowerPaceBecomesTheLowerSpeedBound() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 9)]),
        ], sport: "RUNNING")
        let zones = [
            zone(9, athlete: 7, type: "PACE", values: [(4.0, 4.5, ["RUNNING"])]),
        ]

        guard let plan = plan(mapPrescription(event, zones: zones)),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(target.metric, .speed)
        // 4:00 min/km is faster than 4:30 min/km, so 4:30 is the lower speed.
        XCTAssertEqual(target.lowerBound, 1000 / (4.5 * 60), accuracy: 1e-9)
        XCTAssertEqual(target.upperBound, 1000 / (4.0 * 60), accuracy: 1e-9)
        XCTAssertLessThan(target.lowerBound, target.upperBound)
    }

    func testZoneEditChangesTheResolvedRange() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])

        let before = zone(42, athlete: 7, type: "POWER", values: [(200, 230, ["CYCLING"])])
        let after = zone(42, athlete: 7, type: "POWER", values: [(210, 245, ["CYCLING"])])

        guard let beforePlan = plan(mapPrescription(event, zones: [before])),
              let afterPlan = plan(mapPrescription(event, zones: [after])),
              let beforeTarget = beforePlan.blocks.first?.steps.first?.target,
              let afterTarget = afterPlan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(powerRange(beforeTarget), 200...230)
        XCTAssertEqual(powerRange(afterTarget), 210...245)
        XCTAssertEqual(afterTarget.zoneId, 42)
    }

    func testZoneWithoutBoundsIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [zone(42, athlete: 7, type: "POWER", values: [])]

        XCTAssertEqual(
            reason(mapPrescription(event, zones: zones)),
            .missingZoneBounds
        )
    }

    func testZoneTargetWithoutAZoneIdentifierIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE")]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .zoneIdMissing
        )
    }

    func testUnknownZoneIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 404)]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .zoneNotFound
        )
    }

    func testZoneWithAnUnknownTypeIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ])
        let zones = [
            zone(42, athlete: 7, type: "CADENCE", values: [(85, 95, ["CYCLING"])]),
        ]

        XCTAssertEqual(
            reason(mapPrescription(event, zones: zones)),
            .zoneTypeMismatch
        )
    }

    func testDirectHeartRateRangeIsKept() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("HEARTRATE", min: 140, max: 160)]),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(target.metric, .heartRate)
        XCTAssertEqual(target.range, 140...160)
        XCTAssertNil(target.zoneId)
    }

    func testDirectPaceRangeIsStoredInMetresPerSecondAndOrdered() {
        // Reversed on purpose: the bounds still describe one speed range.
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("PACE", min: 4.2, max: 3.3)]),
        ], sport: "RUNNING")

        guard let plan = plan(mapPrescription(event, zones: [])),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(target.metric, .speed)
        XCTAssertEqual(target.lowerBound, 3.3, accuracy: 1e-9)
        XCTAssertEqual(target.upperBound, 4.2, accuracy: 1e-9)
    }

    func testDirectCadenceRangeIsKept() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("CADENCE", min: 85, max: 95)]),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])),
              let target = plan.blocks.first?.steps.first?.target
        else { return }

        XCTAssertEqual(target.metric, .cadence)
        XCTAssertEqual(target.range, 85...95)
    }

    func testTargetWithoutBoundsIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("POWER")]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .missingTargetValue
        )
    }

    func testRelativeTargetIsUnsupported() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [
                target("POWER", min: 0.9, max: 1.05, metric: "FTP_CYCLING"),
            ]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .relativeTarget
        )
    }

    func testUnsupportedTargetTypeIsRejected() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("RPE", value: 7)]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .unsupportedTarget
        )
    }

    func testMultipleSimultaneousTargetsAreRejected() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [
                target("POWER", min: 210, max: 245),
                target("HEARTRATE", min: 140, max: 160),
            ]),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .multipleTargets
        )
    }

    func testOpenTargetAddsNoAlert() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("OPEN")]),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])),
              let step = plan.blocks.first?.steps.first
        else { return }

        XCTAssertNil(step.target)
    }

    // MARK: - Goals and structure

    func testWarmupWorkRestAndCooldownKeepTheirOrderAndGoals() {
        let event = event([
            step("WARMUP", value: 600, order: 0),
            step("INTERVAL_REST", value: 120, order: 2),
            step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 1000, order: 1),
            step("COOLDOWN", value: 300, order: 3),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])) else { return }

        XCTAssertEqual(plan.title, "Threshold ride")
        XCTAssertEqual(plan.sport, .cycling)
        XCTAssertEqual(plan.location, .unspecified)
        XCTAssertEqual(plan.warmup?.goal, .time(seconds: 600))
        XCTAssertEqual(plan.blocks.count, 1)
        XCTAssertEqual(plan.blocks.first?.repetitions, 1)
        XCTAssertEqual(plan.blocks.first?.steps.map(\.purpose), [.work, .recovery])
        XCTAssertEqual(plan.blocks.first?.steps.map(\.stepType), [
            "INTERVAL_ACTIVE", "INTERVAL_REST",
        ])
        XCTAssertEqual(plan.blocks.first?.steps.first?.goal, .distance(metres: 1000))
        XCTAssertEqual(plan.blocks.first?.steps.last?.goal, .time(seconds: 120))
        XCTAssertEqual(plan.cooldown?.goal, .time(seconds: 300))
    }

    func testFourRepeatsOfOneHundredMetresWithTwentySecondRests() {
        let event = event([
            step("WARMUP", value: 300, order: 0),
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(4, [
                step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 100, order: 0),
                step("INTERVAL_REST", value: 20, order: 1),
            ]), order: 1),
            step("COOLDOWN", value: 300, order: 2),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])),
              let block = plan.blocks.first
        else { return }

        XCTAssertEqual(plan.blocks.count, 1)
        XCTAssertEqual(block.repetitions, 4)
        XCTAssertEqual(block.steps.first?.goal, .distance(metres: 100))
        XCTAssertEqual(block.steps.last?.goal, .time(seconds: 20))
        XCTAssertEqual(block.steps.map(\.purpose), [.work, .recovery])
    }

    func testFourYardRepeatsStayCanonicalMetres() {
        // Task 1 stores 100 yd as 91.44 m. The mapper must not infer a unit
        // and must not restore 100.
        let event = event([
            step("WARMUP", value: 300, order: 0),
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(4, [
                step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 91.44, order: 0),
                step("INTERVAL_REST", value: 20, order: 1),
            ]), order: 1),
            step("COOLDOWN", value: 300, order: 2),
        ], sport: "SWIMMING")

        guard let plan = plan(mapPrescription(event, zones: [])),
              let block = plan.blocks.first
        else { return }

        XCTAssertEqual(plan.sport, .swimming)
        XCTAssertEqual(plan.location, .pool)
        XCTAssertEqual(block.repetitions, 4)
        XCTAssertEqual(block.steps.first?.goal, .distance(metres: 91.44))
        XCTAssertEqual(block.steps.last?.goal, .time(seconds: 20))
    }

    func testOpenTimeAndDistanceGoals() {
        let event = event([
            step("WARMUP", duration: "OPEN", value: nil, order: 0),
            step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 2500, order: 1),
            step("COOLDOWN", value: 240, order: 2),
        ])

        guard let plan = plan(mapPrescription(event, zones: [])) else { return }

        XCTAssertEqual(plan.warmup?.goal, .open)
        XCTAssertEqual(plan.blocks.first?.steps.first?.goal, .distance(metres: 2500))
        XCTAssertEqual(plan.cooldown?.goal, .time(seconds: 240))
    }

    func testAWorkoutWithoutExecutableStepsIsRejected() {
        let event = event([step("WARMUP", value: 300, order: 0)])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .noExecutableSteps
        )
    }

    func testNestedRepeatsAreRejected() {
        let nested = repeatBlock(2, [
            step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 100),
        ])
        let event = event([
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(3, [
                step("REPEAT", duration: "OPEN", value: nil, repeatBlock: nested, order: 0),
                step("INTERVAL_REST", value: 30, order: 1),
            ])),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .nestedRepeats
        )
    }

    func testRepeatWithoutChildStepsIsRejected() {
        let event = event([
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(3, [])),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .emptyRepeat
        )
    }

    func testRepeatStepWithoutABlockIsRejected() {
        let event = event([
            step("REPEAT", duration: "OPEN", value: nil),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .repeatWithoutBlock
        )
    }

    func testZeroRepetitionsAreRejected() {
        let event = event([
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(0, [
                step("INTERVAL_ACTIVE", value: 60),
            ])),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .invalidRepetitions
        )
    }

    func testEmomRepeatKindIsRejected() {
        let event = event([
            step("REPEAT", duration: "OPEN", value: nil, repeatBlock: repeatBlock(5, [
                step("INTERVAL_ACTIVE", value: 30),
            ], kind: "EMOM", intervalSeconds: 60)),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .unsupportedRepeatKind
        )
    }

    func testCaloriesGoalIsRejected() {
        let event = event([
            step("INTERVAL_ACTIVE", duration: "CALORIES", value: 300),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .unsupportedDurationType
        )
    }

    func testZeroDistanceIsRejected() {
        let event = event([
            step("INTERVAL_ACTIVE", duration: "DISTANCE", value: 0),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .invalidDurationValue
        )
    }

    func testUnsupportedSportIsRejected() {
        let event = event([
            step("INTERVAL_ACTIVE", value: 60),
        ], sport: "ROWING")

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .unsupportedSport
        )
    }

    func testUnknownStepTypeIsRejected() {
        let event = event([
            step("FARTLEK", value: 60),
        ])

        XCTAssertEqual(
            reason(mapPrescription(event, zones: [])),
            .unsupportedStepType
        )
    }

    func testMissingOwnerIsRejectedBeforeZonesAreResolved() {
        let event = event([
            step("INTERVAL_ACTIVE", targets: [target("ZONE", value: 42)]),
        ], athleteId: nil)
        let zones = [
            zone(42, athlete: 7, type: "POWER", values: [(210, 245, ["CYCLING"])]),
        ]

        XCTAssertEqual(
            reason(mapPrescription(event, zones: zones)),
            .missingAthlete
        )
    }

    // MARK: - Wire shapes

    func testDecodesTheCalendarDetailAndZoneResponses() throws {
        let eventJSON = """
        {
          "eventId": 3001,
          "athleteId": 7,
          "type": "TRAINING",
          "startDate": "2026-11-25T07:00:00.000Z",
          "endDate": "2026-11-25T08:00:00.000Z",
          "name": "Threshold ride",
          "sport": "CYCLING",
          "description": "",
          "workout": {
            "workoutId": 3201,
            "eventTrainingId": 3001,
            "steps": [
              {
                "workoutStepId": 3301,
                "orderIndex": 0,
                "stepType": "WARMUP",
                "name": "Warmup",
                "notes": null,
                "durationType": "TIME",
                "durationValue": 600,
                "durationTarget": null,
                "targets": [],
                "repeatBlock": null
              },
              {
                "workoutStepId": 3302,
                "orderIndex": 1,
                "stepType": "REPEAT",
                "name": null,
                "notes": null,
                "durationType": "OPEN",
                "durationValue": null,
                "durationTarget": null,
                "targets": [],
                "repeatBlock": {
                  "workoutRepeatId": 3401,
                  "repetitions": 3,
                  "kind": "REPEAT",
                  "intervalSeconds": null,
                  "timeCapSeconds": null,
                  "stepId": 3302,
                  "childSteps": [
                    {
                      "workoutStepId": 3303,
                      "orderIndex": 0,
                      "stepType": "INTERVAL_ACTIVE",
                      "name": "Threshold",
                      "notes": "",
                      "durationType": "TIME",
                      "durationValue": 480,
                      "durationTarget": null,
                      "targets": [
                        {
                          "workoutStepTargetId": 3501,
                          "targetType": "ZONE",
                          "targetMin": null,
                          "targetMax": null,
                          "targetValue": 42,
                          "metricType": null
                        }
                      ],
                      "repeatBlock": null
                    },
                    {
                      "workoutStepId": 3304,
                      "orderIndex": 1,
                      "stepType": "INTERVAL_REST",
                      "name": null,
                      "notes": "",
                      "durationType": "TIME",
                      "durationValue": 180,
                      "durationTarget": null,
                      "targets": [],
                      "repeatBlock": null
                    }
                  ]
                }
              },
              {
                "workoutStepId": 3305,
                "orderIndex": 2,
                "stepType": "COOLDOWN",
                "name": null,
                "notes": "",
                "durationType": "TIME",
                "durationValue": 300,
                "durationTarget": null,
                "targets": [],
                "repeatBlock": null
              }
            ]
          }
        }
        """

        let zonesJSON = """
        [
          {
            "trainingZoneId": 42,
            "name": "Threshold",
            "description": "",
            "index": 3,
            "type": "POWER",
            "color": "#EF4444",
            "athleteId": 7,
            "values": [
              {
                "trainingZoneValueId": 4201,
                "min": 210,
                "max": 245,
                "sports": ["CYCLING"]
              }
            ],
            "createdAt": "2026-01-01T00:00:00.000Z",
            "updatedAt": "2026-01-01T00:00:00.000Z"
          }
        ]
        """

        let decoder = JSONDecoder()
        let event = try decoder.decode(
            TrainingEventInput.self,
            from: Data(eventJSON.utf8)
        )
        let zones = try decoder.decode([ZoneInput].self, from: Data(zonesJSON.utf8))

        guard let plan = plan(mapPrescription(event, zones: zones)),
              let block = plan.blocks.first
        else { return }

        XCTAssertEqual(plan.title, "Threshold ride")
        XCTAssertEqual(plan.sport, .cycling)
        XCTAssertEqual(plan.warmup?.goal, .time(seconds: 600))
        XCTAssertEqual(plan.cooldown?.goal, .time(seconds: 300))
        XCTAssertEqual(block.repetitions, 3)
        XCTAssertEqual(block.steps.first?.goal, .time(seconds: 480))
        XCTAssertEqual(block.steps.last?.goal, .time(seconds: 180))
        XCTAssertEqual(powerRange(block.steps.first?.target), 210...245)
        XCTAssertEqual(block.steps.first?.target?.zoneId, 42)
    }
}
