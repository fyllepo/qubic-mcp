# TICKET-001: Implement get_balance tool

**Status:** Backlog
**Priority:** P0 — Critical
**Agent:** typescript-pro
**Phase:** 1 (Foundation)

## Description

Finalize and test the `get_balance` tool. The skeleton exists but needs:

1. Verify the Qubic RPC response format matches what we parse
2. Format the response nicely for LLM consumption (human-readable, not just raw JSON)
3. Handle edge cases: address not found, zero balance, network timeout
4. Add unit tests with mocked RPC responses
5. Add integration test that hits testnet

## Acceptance Criteria

- [ ] Tool returns formatted balance info (balance in QU, epoch, tick)
- [ ] Invalid addresses return helpful error messages
- [ ] Network errors are caught and reported cleanly
- [ ] Tests cover success, invalid address, not found, and network error cases
- [ ] Works with MCP Inspector
