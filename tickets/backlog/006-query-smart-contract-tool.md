# TICKET-006: Implement query_smart_contract tool

**Status:** Backlog
**Priority:** P1 — High
**Agent:** typescript-pro
**Phase:** 2 (Smart Contracts)

## Description

Add a generic `query_smart_contract` tool for read-only smart contract queries:

1. Use `POST /v1/querySmartContract` endpoint
2. Accept contract index, input type, and input data
3. Parse and return the response
4. Document which contracts exist (QX=1, Quottery=2, Random=3, QUTIL=4, MLM=5)
5. Add helpful descriptions so the AI knows what contracts are available

## Acceptance Criteria

- [ ] Can query any Qubic smart contract by index
- [ ] Input validation for contract parameters
- [ ] Response formatted for readability
- [ ] Documentation of available contracts in tool description
- [ ] Unit tests with mocked responses
