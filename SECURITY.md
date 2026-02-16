# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes       |

## Reporting a Vulnerability

**DO NOT open a public GitHub issue for security vulnerabilities.**

Please use [GitHub's private vulnerability reporting](https://github.com/fyllepo/qubic-mcp/security/advisories/new) to report security issues.

Expected response time: **48 hours**.
Expected resolution time: **7 days** for critical issues.

## Security Design Principles

- This tool **NEVER** stores, logs, or transmits private keys or seeds
- All sensitive data is handled in-memory only
- No telemetry, analytics, or data collection that could leak wallet data
- All user inputs are validated and sanitized before processing
- Dependencies are audited regularly via `npm audit`
- All releases are published with npm provenance (Sigstore)

## Dependency Management

- We use `package-lock.json` to pin exact dependency versions
- Dependabot is enabled for automated security updates
- `npm audit` runs on every CI build and blocks on high-severity findings
