HELIUS / cNFT fixes checklist

1) Image loading
   - Problem: next/image remotePatterns may not include some public image hostnames so images fail to load.
   - Plan: detect external image domains and either add them to next.config.ts or fallback to <img> when remote not allowed.

2) Wallet signing (client should sign)
   - Problem: mint or other cNFT operations appear to be done purely via Helius API without wallet popup. On-chain fractionalize instructions must be signed by the user's wallet.
   - Plan: audit hooks that call Helius/construct transactions (mint, fractionalize). Ensure any on-chain instruction that requires payer/signature uses the wallet adapter (signTransaction/signAllTransactions) and not server-side keypairs.

Progress:
- Added server-side proxy endpoints `/api/helius/proxy` and `/api/helius/mint` that use server env `HELIUS_API_KEY` (or fallback to NEXT_PUBLIC for development).
- Updated `use-mint-cnft.ts` to call `/api/helius/mint` so the client doesn't include the API key in network requests.

Next steps:
- Ensure fractionalize transaction build uses the wallet adapter to `signTransaction` and `sendTransaction` (not yet implemented; current fractionalize code simulates transaction). Implement actual transaction construction using Anchor/IDL and request wallet signature.

3) Helius API key exposure
   - Problem: API key visible in Network tab; quota can be abused.
   - Plan: move sensitive Helius calls to a server-side API route (Next.js API or serverless function) so the API key is kept server-side where possible. Where client-side calls are required, configure domain restrictions in Helius dashboard and rotate the key.

Notes:
- I'll start by auditing signing and minting code paths and then propose minimal changes for the image issue.
