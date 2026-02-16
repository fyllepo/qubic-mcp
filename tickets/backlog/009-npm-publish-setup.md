# TICKET-009: npm publish and distribution setup

**Status:** Backlog
**Priority:** P1 — High
**Agent:** general-purpose
**Phase:** 1 (Foundation)

## Description

Prepare for npm publishing:

1. Verify package.json metadata is complete and correct
2. Test `npm pack --dry-run` to verify published contents
3. Set up npm provenance in CI workflow
4. Test that `npx mcp-server-qubic` works end-to-end
5. Create GitHub release workflow (tag-based)
6. Verify the bin entry works correctly

## Acceptance Criteria

- [ ] `npm pack` produces clean package with only dist/, LICENSE, README
- [ ] `npx mcp-server-qubic` starts the server correctly
- [ ] CI publishes on git tag with provenance
- [ ] GitHub release created automatically
