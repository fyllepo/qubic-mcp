# TICKET-007: Implement get_qx_orderbook tool

**Status:** Backlog
**Priority:** P2 — Medium
**Agent:** typescript-pro
**Phase:** 2 (Smart Contracts)

## Description

Add a `get_qx_orderbook` tool for querying the QX decentralized exchange:

1. Research the QX smart contract query interface
2. Implement orderbook retrieval for a given asset pair
3. Format bid/ask data in a readable table format
4. Add parameters for asset selection

## Acceptance Criteria

- [ ] Returns orderbook with bid/ask prices and quantities
- [ ] Formatted as a readable table
- [ ] Supports different asset pairs on QX
- [ ] Error handling for invalid pairs
- [ ] Unit tests passing
