#!/usr/bin/env python3
"""Exercise the production export adapter with the installed Capacitor JS types.

Run on macOS: python3 apps/web/scripts/check-healthkit-bridge.py
No device, credentials or personal Health samples are read.
"""
from pathlib import Path
import subprocess
import tempfile

web = Path(__file__).resolve().parents[1]
capacitor = (web / 'node_modules/@capacitor/ios/Capacitor/Capacitor/JSTypes.swift').read_text()
reader = (web / 'ios/App/App/HealthKitReader.swift').read_text()
# These are the actual installed protocol conformances and recursive converter.
# The intervening plugin-call APIs require UIKit; the converter itself is Foundation-only.
types = capacitor.split('public protocol JSStringContainer', 1)[0]
types += capacitor[capacitor.index('public enum JSTypes {}'):]
adapter = reader[reader.index('enum HealthKitBridgeJSON {'):]
core = sorted((web / 'ios/HealthKitCore/Sources/HealthKitCore').glob('*.swift'))
fixture = r'''
import Foundation

func roundTrip(_ data: Data) throws {
  let original = try JSONSerialization.jsonObject(with: data)
  // The old cast is the regression: Foundation nested containers fail JSValue conformance.
  precondition(!(original is JSObject))
  let bridged = try HealthKitBridgeJSON.object(data)
  let expected = try JSONSerialization.data(withJSONObject: original, options: [.sortedKeys])
  let actual = try JSONSerialization.data(withJSONObject: bridged, options: [.sortedKeys])
  precondition(actual == expected, "Bridge must preserve every nested field and sample")
}
let source = HealthSampleSource(bundleIdentifier: "test.watch", name: "Watch", version: "1",
  productType: "Watch6,18", deviceModel: nil, operatingSystemVersion: nil)
let start = Date(timeIntervalSince1970: 1_700_000_000.123)
let end = start.addingTimeInterval(1800)
let record = HealthWorkoutRecord(revision: 42,
  uuid: "12345678-1234-4234-8234-123456789abc", activityType: 37, sport: "RUNNING",
  start: start, end: end, activeDuration: 1700, distanceMeters: 5000,
  energyKilojoules: nil, elevationGainMeters: nil, source: source, timeZone: nil,
  externalUUID: nil, wasUserEntered: false, indoor: false,
  events: [HealthWorkoutEvent(type: 1, start: start.addingTimeInterval(60), end: start.addingTimeInterval(60))],
  channels: ["heartrate": [HealthWorkoutPoint(uuid: "sample", start: start, end: start,
    value: 120, source: source)]],
  route: [HealthWorkoutLocation(date: start, latitude: 45, longitude: 7, altitude: -2,
    horizontalAccuracy: 3, verticalAccuracy: 4)])
let encoder = JSONEncoder()
encoder.dateEncodingStrategy = .iso8601
try roundTrip(encoder.encode(record))
try roundTrip(HealthWorkoutUpload.body(record))
try roundTrip(Data(#"{"empty":{},"array":[],"nested":[{"null":null,"flag":false,"fraction":0.123}]}"#.utf8))
print("PASS: legacy cast reproduced; production bridge preserves raw workout, canonical upload, nested arrays/objects, nulls, booleans and numbers")
'''
with tempfile.TemporaryDirectory(prefix='openathlete-bridge-test-') as directory:
    temp = Path(directory)
    (temp / 'CapacitorTypes.swift').write_text(types)
    (temp / 'Bridge.swift').write_text('import Foundation\n' + adapter)
    (temp / 'main.swift').write_text(fixture)
    binary = temp / 'bridge-test'
    subprocess.run(['xcrun', 'swiftc', *map(str, core), str(temp / 'CapacitorTypes.swift'),
                    str(temp / 'Bridge.swift'), str(temp / 'main.swift'), '-o', str(binary)], check=True)
    subprocess.run([str(binary)], check=True)
