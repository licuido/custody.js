---
"custody": major
---

### Breaking: Unified XRPL intent API with `proposeIntent()`

The 13 per-transaction-type methods on `custody.xrpl` (`sendPayment`, `createTrustline`, `depositPreauth`, `clawback`, `mpTokenAuthorize`, `offerCreate`, `accountSet`, `ticketCreate`, `batch`, `mpTokenIssuanceCreate`, `mpTokenIssuanceSet`, `mpTokenIssuanceDestroy`) have been replaced by a single `proposeIntent()` method that accepts a discriminated union on the `type` field.

**Before:**

```typescript
await custody.xrpl.sendPayment({
  Account: "rSender...",
  amount: "100",
  destination: { address: "rDest...", type: "Address" },
})
```

**After:**

```typescript
await custody.xrpl.proposeIntent({
  Account: "rSender...",
  operation: {
    type: "Payment",
    amount: "100",
    destination: { address: "rDest...", type: "Address" },
  },
})
```

New XRPL transaction types are supported automatically when the OpenAPI spec is regenerated — no new SDK method required.

### Other changes

- `XrplService` now accepts an `XrplPorts` interface for I/O dependencies, enabling simpler testing with in-memory adapters instead of mock-heavy setups.
- `DomainResolverService` has been removed. Its domain resolution and user validation logic is now internal to the HTTP port adapter.
- `rawSign`, `rawSignAndWait`, `rawSignInnerBatch`, `rawSignInnerBatchAndWait`, and `getPublicKey` are unchanged.
- `Core_XrplOperation` and `XrplPorts` are now exported from the package.
- `DomainResolveOptions` is no longer exported (use `domainId` in `XrplIntentOptions` instead). `DomainUserReference` remains exported.
