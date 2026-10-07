# Mobile releases

The iOS and Android apps are the web build wrapped by Capacitor. They are published by the same `vX.Y.Z` tag as the Docker images:

| Step | Trigger | Where it goes |
| --- | --- | --- |
| Unsigned build of both apps | A pull request or push to `main` that touches the native projects (`.github/workflows/mobile.yml`) | Nowhere, it only checks they build |
| Signed build, uploaded for testing | Pushing a `vX.Y.Z` tag (`.github/workflows/release.yml`) | TestFlight (internal testers) and the Google Play testing track |
| Public release | Running **Mobile promote** from the Actions tab (`.github/workflows/mobile-promote.yml`) | App Store review and Google Play production |
| Tester feedback | Every hour (`.github/workflows/store-feedback.yml`) | Issues in a private repository |

Everything runs through fastlane lanes in `apps/web/fastlane/Fastfile`, which you can also run by hand (see [Running lanes locally](#running-lanes-locally)).

## Versions

The tag is the only place a mobile version is set (`apps/web/scripts/mobile-version.ts`):

| Tag | Android `versionName` | iOS version | Build number (both stores) |
| --- | --- | --- | --- |
| `v1.4.2-rc.3` | `1.4.2-rc.3` | `1.4.2` | `10400203` |
| `v1.4.2` | `1.4.2` | `1.4.2` | `10400299` |

Build numbers always grow with the version, and a pre-release sorts before its stable release. Pre-release tags need a number (`-rc.1` to `-rc.98`), minor versions stop at 99 and patches at 999.

A store refuses a build number it already has. To ship a fix to testers, push a new tag (`v1.4.2-rc.4`); don't move an existing tag.

Release notes come from the `feat` and `fix` commits since the previous tag (`apps/web/scripts/release-notes.ts`).

## One-time setup

Mobile releases stay off until the `MOBILE_RELEASES` variable is `true`, so forks and self-hosted mirrors never try to publish. Set the secrets and variables below, then turn it on. All commands run from the repository root with an authenticated `gh`.

### Apple

1. **App Store Connect API key.** In App Store Connect, open Users and Access → Integrations → App Store Connect API, and create a team key with the **Admin** role (fastlane renews the provisioning profile, which needs access to certificates). Download the `.p8` file; Apple only lets you download it once.
   ```bash
   gh secret set ASC_KEY_ID --body "<Key ID>"
   gh secret set ASC_ISSUER_ID --body "<Issuer ID>"
   gh secret set ASC_KEY_P8 < AuthKey_XXXXXXXXXX.p8
   ```
2. **Distribution certificate.** In Xcode → Settings → Accounts → Manage Certificates, create an **Apple Distribution** certificate if you have none. In Keychain Access, export it with its private key as a `.p12` file, with a password.
   ```bash
   base64 -i distribution.p12 | gh secret set IOS_DISTRIBUTION_CERTIFICATE_BASE64
   gh secret set IOS_DISTRIBUTION_CERTIFICATE_PASSWORD --body "<p12 password>"
   ```
3. **Firebase config.**
   ```bash
   base64 -i apps/web/ios/App/App/GoogleService-Info.plist | gh secret set GOOGLE_SERVICE_INFO_PLIST_BASE64
   ```

The provisioning profile needs no secret: each build downloads it, and creates it again when it expires.

### Google Play

1. **Upload key.** Use the keystore that signed the builds already on Google Play (Play App Signing keeps the app signing key; this is only the upload key).
   ```bash
   base64 -i upload-keystore.jks | gh secret set ANDROID_KEYSTORE_BASE64
   gh secret set ANDROID_KEYSTORE_PASSWORD --body "<keystore password>"
   gh secret set ANDROID_KEY_ALIAS --body "<key alias>"
   gh secret set ANDROID_KEY_PASSWORD --body "<key password>"
   ```
2. **Service account.** In Google Cloud, create a service account in any project and download a JSON key. Enable the Google Play Android Developer API in that project. In the Play Console, open Users and permissions, invite the service account's email, and give it, for the OpenAthlete app: *Release to production, exclude devices, and use Play App Signing*, *Release apps to testing tracks*, and *Reply to reviews* (needed to read them).
   ```bash
   gh secret set PLAY_SERVICE_ACCOUNT_JSON < service-account.json
   ```
3. **Firebase config.**
   ```bash
   base64 -i apps/web/android/app/google-services.json | gh secret set GOOGLE_SERVICES_JSON_BASE64
   ```

### Variables

The web bundle inside the apps is built in CI, so it needs the same `VITE_*` settings as the hosted web app (see `apps/web/.env.example`). They are public once the app ships, so they are variables, not secrets.

```bash
gh variable set VITE_FIREBASE_API_KEY --body "..."      # and the other VITE_FIREBASE_*,
gh variable set VITE_ERROR_MONITORING_DSN --body "..."  # VITE_PUBLIC_POSTHOG_*, VITE_WEB_URL,
                                                        # VITE_WEBSITE_URL... as on Vercel
gh variable set PLAY_TRACK --body "alpha"   # Play track for test builds: internal (default) or alpha (closed testing)
gh variable set MOBILE_RELEASES --body "true"
```

Until the app has been published on Google Play once, the Play Console only accepts draft releases: set `PLAY_RELEASE_STATUS` to `draft` and roll the release out by hand in the console. Delete the variable afterwards.

### Tester feedback

Feedback is filed into a **private** repository, because TestFlight screenshots can show a tester's own data. Tester emails and names are never copied.

1. Create a private repository, for example `openathleteorg/store-feedback`.
2. Create a fine-grained personal access token limited to that repository, with **Issues: read and write**.
   ```bash
   gh variable set STORE_FEEDBACK_REPO --body "openathleteorg/store-feedback"
   gh secret set STORE_FEEDBACK_TOKEN --body "<token>"
   ```

TestFlight screenshots and crash reports reuse the App Store Connect key. Google Play reviews reuse the service account; the API only returns reviews of the production app from the last 7 days. Testers of a Google Play testing track send feedback privately in the Play Console, which no API exposes.

To act on a feedback issue, transfer it to the public repository (issue menu → Transfer) once it holds nothing private.

## Releasing

1. Push the tag, as for any release (see the `release` skill). The **Release** workflow uploads both apps next to the Docker images.
2. iOS: the build reaches internal TestFlight testers once Apple has processed it (about 15 minutes), with the release notes as *What to Test*. Android: it reaches the `PLAY_TRACK` testers within minutes.
3. Once it is tested, run **Mobile promote** from the Actions tab with the tag. Android goes to production right away. iOS is submitted for review, and you release it from App Store Connect once it is approved (automatic release is off).

## Running lanes locally

You need Ruby 3.4 (`brew install ruby`), Xcode 26 or later for iOS, and Java 21 with the Android SDK for Android.

```bash
cd apps/web
bundle install
bundle exec fastlane android check          # what CI runs on native changes
bundle exec fastlane ios check
RELEASE_TAG=v1.4.2 bundle exec fastlane ios release   # same environment variables as CI
```

The release lanes read the secrets above as environment variables (`ANDROID_KEYSTORE_BASE64`, `ASC_KEY_P8`...), and the `VITE_*` values from your shell. They refuse to run while `apps/web/.env` exists, since Vite would bake its development values (a localhost API) into the app: move it aside first. Locally, `ios release` signs with the distribution certificate already in your login keychain.

To preview tester feedback without filing anything:

```bash
STORE_FEEDBACK_REPO=openathleteorg/store-feedback STORE_FEEDBACK_TOKEN=$(gh auth token) \
  ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_P8="$(cat AuthKey.p8)" \
  node apps/web/scripts/store-feedback.ts --dry-run
```

## Troubleshooting

| Error | Cause |
| --- | --- |
| `Version code ... has already been used` / `The bundle version must be higher` | The tag was released already. Push a new one. |
| `Only releases with status draft may be created on draft app` | The app was never published: set `PLAY_RELEASE_STATUS=draft` (see above). |
| `No profile for team ... matching ...` / certificate errors | The `.p12` is missing its private key, or the certificate was revoked. Export it again. |
| `Invalid Swift Support` / SDK version rejected | The runner's Xcode is older than Apple's minimum. Pick another `runs-on` image in `release.yml`. |
| The iOS app quits at launch, logging `UIScene life cycle is required` | Since the iOS 27 SDK, apps must use scenes. Keep `ios/App/App/SceneDelegate.swift` and the scene manifest in `Info.plist`. |
