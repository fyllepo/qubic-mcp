# TICKET-003: Implement get_network_status tool

**Status:** Backlog
**Priority:** P1 — High
**Agent:** typescript-pro
**Phase:** 1 (Foundation)

## Description

Finalize the `get_network_status` tool:

1. Determine the correct RPC endpoint for network status/health
2. Include computor count, network health indicators
3. Format nicely for LLM consumption
4. Add tests

## Acceptance Criteria

- [ ] Returns meaningful network health information
- [ ] Includes computor count, current epoch, network throughput if available
- [ ] Error handling for network failures
- [ ] Unit tests passing
