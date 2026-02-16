# TICKET-002: Implement get_tick_info tool

**Status:** Backlog
**Priority:** P0 — Critical
**Agent:** typescript-pro
**Phase:** 1 (Foundation)

## Description

Finalize the `get_tick_info` tool:

1. Verify RPC `/v1/tick-info` response format
2. Format response for LLM readability (current tick, epoch, timestamp)
3. Handle network errors gracefully
4. Add unit tests with mocked responses

## Acceptance Criteria

- [ ] Returns current tick number, epoch, and related metadata
- [ ] Formatted for human readability
- [ ] Network errors handled gracefully
- [ ] Unit tests passing
