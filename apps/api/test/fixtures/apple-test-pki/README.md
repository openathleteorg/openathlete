Throwaway certificate chain for tests only: a root, an intermediate with the
Apple WWDR extension (1.2.840.113635.100.6.2.1) and a leaf with the App Store
signing extension (1.2.840.113635.100.6.11.1). Tests sign StoreKit payloads
with `leaf-key.pem` and trust `root.der`, so the real verification code runs.
Nothing in production trusts this root.
