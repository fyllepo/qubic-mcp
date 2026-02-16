# TICKET-005: Implement get_token_price tool

**Status:** Backlog
**Priority:** P1 — High
**Agent:** typescript-pro
**Phase:** 1 (Foundation)

## Description

Finalize the `get_token_price` tool:

1. Verify CoinGecko API works for Qubic (ID: `qubic-network`)
2. Format price data nicely (price, 24h change, market cap)
3. Handle rate limiting from CoinGecko (free tier limits)
4. Consider caching to avoid hitting rate limits
5. Add tests with mocked CoinGecko responses

## Acceptance Criteria

- [ ] Returns QUBIC price in USD with 24h change and market cap
- [ ] Handles CoinGecko rate limiting gracefully
- [ ] Formatted for human readability
- [ ] Unit tests passing
