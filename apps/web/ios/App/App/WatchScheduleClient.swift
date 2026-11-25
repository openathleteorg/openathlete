import Foundation
import WatchScheduleCore

/// The token and the account/instance it was minted for. Keeping the scope on
/// the credential means a token can never be replayed against another
/// instance, even if a provider keeps one around after a switch.
struct WatchScheduleCredential: Equatable, Sendable {
    let scope: AccountScope
    let accessToken: String
    let expiresAt: Date?

    init(scope: AccountScope, accessToken: String, expiresAt: Date?) {
        self.scope = scope
        self.accessToken = accessToken
        self.expiresAt = expiresAt
    }
}

protocol WatchScheduleCredentialProviding {
    /// Returns a fresh token for this exact scope, or nil when the session is
    /// no longer authenticated. Never reuse an old account's token.
    func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential?
}

/// URLSession transport for the own-calendar snapshot.
///
/// Wire contract, from `apps/web/src/api/event/event.api.ts`:
/// - `GET /event?startDate=…&endDate=…`, without `coach` or `athleteId`: the
///   bearer token already scopes it to the signed-in athlete's own calendar,
///   including sessions a coach planned for them;
/// - `GET /event/:eventId` only when a calendar row has no workout;
/// - `GET /training-zone/athlete/:athleteId` for that same athlete.
///
/// Security:
/// - the bearer token is only attached to a request whose origin (scheme,
///   host, port) is the credential's instance origin;
/// - redirects to another origin are refused instead of followed, so the
///   header is never replayed to a third party;
/// - cookies and cached responses are disabled, so an account switch cannot
///   read the previous account's response;
/// - cleartext HTTP is only accepted on loopback, where the iOS simulator
///   reaches a local API.
final class WatchScheduleClient: NSObject, ScheduleTransport {
    private let credentialProvider: any WatchScheduleCredentialProviding
    private let now: () -> Date
    private let session: URLSession

    /// Credentials expire slightly early so a request does not start with a
    /// token that will be rejected before it reaches the API.
    private static let credentialLeeway: TimeInterval = 30

    init(
        credentialProvider: any WatchScheduleCredentialProviding,
        configuration: URLSessionConfiguration = .ephemeral,
        now: @escaping () -> Date = Date.init
    ) {
        self.credentialProvider = credentialProvider
        self.now = now

        let configuration = configuration.copy() as! URLSessionConfiguration
        // The snapshot is account- and instance-scoped; no shared cookies or
        // cached calendar may survive an account switch.
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(
            configuration: configuration,
            delegate: WatchScheduleRedirectGuard(),
            delegateQueue: nil
        )
        super.init()
    }

    deinit {
        session.finishTasksAndInvalidate()
    }

    // MARK: - ScheduleTransport

    func listEvents(
        scope: AccountScope,
        from: Date,
        to: Date
    ) async throws -> [CalendarEventInput] {
        // No `coach` and no `athleteId`: `coach=false` keeps this to the
        // signed-in athlete, and `athleteId` is ignored in that mode. Sending
        // the coach's currently viewed athlete would read a foreign calendar.
        try await get(
            scope: scope,
            path: "/event",
            queryItems: [
                URLQueryItem(name: "startDate", value: Self.isoString(from)),
                URLQueryItem(name: "endDate", value: Self.isoString(to)),
            ]
        )
    }

    func eventDetail(
        scope: AccountScope,
        eventId: Int
    ) async throws -> CalendarEventInput {
        guard eventId > 0 else {
            throw ScheduleTransportError.invalidURL
        }
        return try await get(scope: scope, path: "/event/\(eventId)")
    }

    func trainingZones(scope: AccountScope) async throws -> [ZoneInput] {
        try await get(
            scope: scope,
            path: "/training-zone/athlete/\(scope.athleteId)"
        )
    }

    // MARK: - Requests

    private func get<Response: Decodable>(
        scope: AccountScope,
        path: String,
        queryItems: [URLQueryItem] = []
    ) async throws -> Response {
        let credential = try await credential(for: scope)
        let url = try makeURL(scope: scope, path: path, queryItems: queryItems)
        guard let origin = RequestOrigin(url) else {
            throw ScheduleTransportError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(
            "Bearer \(credential.accessToken)",
            forHTTPHeaderField: "Authorization"
        )
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        // Never let a proxy or a previous account's body answer this read.
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            if Task.isCancelled {
                throw CancellationError()
            }
            throw ScheduleTransportError.transportFailure(status: nil)
        } catch {
            throw ScheduleTransportError.transportFailure(status: nil)
        }

        guard let http = response as? HTTPURLResponse else {
            throw ScheduleTransportError.invalidResponse
        }
        // The redirect delegate refuses other origins; this also catches a
        // cached or rewritten final URL before decoding.
        guard let finalURL = http.url, RequestOrigin(finalURL) == origin else {
            throw ScheduleTransportError.invalidResponse
        }

        switch http.statusCode {
        case 200..<300:
            break
        case 401:
            throw ScheduleTransportError.unauthorized
        case 403, 404:
            throw ScheduleTransportError.eventNotFound
        default:
            throw ScheduleTransportError.transportFailure(
                status: http.statusCode
            )
        }

        do {
            return try ScheduleWireCoding.decoder().decode(
                Response.self,
                from: data
            )
        } catch {
            throw ScheduleTransportError.invalidResponse
        }
    }

    private func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential {
        let credential: WatchScheduleCredential?
        do {
            credential = try await credentialProvider.credential(for: scope)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as ScheduleTransportError {
            throw error
        } catch {
            throw ScheduleTransportError.transportFailure(status: nil)
        }

        // Missing means the app session ended; never fall back to a cached
        // token or the previously selected instance.
        guard let credential else {
            throw ScheduleTransportError.unauthorized
        }
        guard credential.scope == scope else {
            throw ScheduleTransportError.scopeMismatch
        }
        guard !credential.accessToken
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .isEmpty
        else {
            throw ScheduleTransportError.unauthorized
        }
        if let expiresAt = credential.expiresAt,
           expiresAt <= now().addingTimeInterval(Self.credentialLeeway) {
            throw ScheduleTransportError.credentialExpired
        }
        return credential
    }

    private func makeURL(
        scope: AccountScope,
        path: String,
        queryItems: [URLQueryItem]
    ) throws -> URL {
        guard var components = URLComponents(
            url: scope.instanceURL,
            resolvingAgainstBaseURL: false
        ),
            let scheme = components.scheme?.lowercased(),
            components.host != nil
        else {
            throw ScheduleTransportError.invalidURL
        }
        guard scheme == "https"
            || (scheme == "http" && Self.isLoopback(components.host))
        else {
            throw ScheduleTransportError.insecureOrigin
        }

        // The instance may live under a path (for example `/api`), so append
        // rather than replacing the base path.
        var basePath = components.path
        if basePath.hasSuffix("/") {
            basePath.removeLast()
        }
        components.path = basePath + path
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        components.fragment = nil

        guard let url = components.url else {
            throw ScheduleTransportError.invalidURL
        }
        return url
    }

    private static func isoString(_ date: Date) -> String {
        Date.ISO8601FormatStyle(includingFractionalSeconds: true)
            .format(date)
    }

    private static func isLoopback(_ host: String?) -> Bool {
        guard let host = host?.lowercased() else {
            return false
        }
        return host == "localhost"
            || host == "127.0.0.1"
            || host == "::1"
    }
}

// MARK: - Redirects

/// The scheme, host and explicit-or-default port of a URL.
private struct RequestOrigin: Equatable {
    let scheme: String
    let host: String
    let port: Int?

    init?(_ url: URL) {
        guard let scheme = url.scheme?.lowercased(),
              let host = url.host?.lowercased()
        else {
            return nil
        }
        self.scheme = scheme
        self.host = host
        if let port = url.port {
            self.port = port
        } else if scheme == "https" {
            self.port = 443
        } else if scheme == "http" {
            self.port = 80
        } else {
            self.port = nil
        }
    }
}

/// Refuses cross-origin redirects instead of letting URLSession follow them.
/// The bearer token is re-attached only to a same-origin redirect, so a 30x to
/// another host can neither receive the header nor be treated as a response.
private final class WatchScheduleRedirectGuard: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        guard let originalURL = task.originalRequest?.url,
              let originalOrigin = RequestOrigin(originalURL),
              let newURL = request.url,
              RequestOrigin(newURL) == originalOrigin
        else {
            // A nil request returns the redirect response to the caller; it
            // is never followed with the Authorization header.
            completionHandler(nil)
            return
        }

        var redirected = request
        if let authorization = task.originalRequest?
            .value(forHTTPHeaderField: "Authorization") {
            redirected.setValue(
                authorization,
                forHTTPHeaderField: "Authorization"
            )
        }
        completionHandler(redirected)
    }
}
