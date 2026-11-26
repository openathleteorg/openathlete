import Capacitor

/// Registers the plugins that live in the app target instead of a Capacitor
/// npm package. `WatchSchedule` bridges WorkoutKit and the settings section.
class AppBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WatchSchedulePlugin())
    }
}
