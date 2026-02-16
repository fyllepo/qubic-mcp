# TICKET-004: Implement get_transaction tool

**Status:** Backlog
**Priority:** P1 — High
**Agent:** typescript-pro
**Phase:** 1 (Foundation)

## Description

Finalize the `get_transaction` tool:

1. Verify the correct RPC endpoint and path for transaction lookup
2. Parse and format transaction details (source, dest, amount, tick, status)
3. Handle "not found" cases gracefully
4. Add tests

## Acceptance Criteria

- [ ] Returns formatted transaction details
- [ ] Handles not-found transactions with clear message
- [ ] Input validation for transaction ID format
- [ ] Unit tests passing
