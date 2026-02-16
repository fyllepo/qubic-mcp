# TICKET-012: Design write operations (transactions) with safety

**Status:** Backlog
**Priority:** P2 — Medium
**Agent:** general-purpose (research), typescript-pro (implementation)
**Phase:** 4 (Write Operations)

## Description

Design and implement transaction creation/signing with maximum safety:

1. **Research**: How does the MCP spec handle destructive operations? (annotations, confirmations)
2. **Design**: Create a multi-step confirmation flow:
   - `create_transaction` builds unsigned tx and shows details
   - `sign_transaction` requires explicit user seed input (NEVER stored)
   - `broadcast_transaction` submits to network only after confirmation
3. **Implement**: With tool annotations marking these as destructive
4. **Test**: Extensively on testnet before enabling for mainnet

## Security Requirements

- Seeds MUST be passed per-call, never stored in config or memory between calls
- All transaction details MUST be displayed for user confirmation
- Tools MUST be annotated as destructive operations
- Testnet-only flag for initial rollout

## Acceptance Criteria

- [ ] Security design document reviewed
- [ ] Create/sign/broadcast flow works on testnet
- [ ] Seeds are never persisted
- [ ] Tools annotated correctly per MCP spec
- [ ] Confirmation prompts shown before any on-chain action
