---
name: filecoin-pin-upload
description: Use when the user asks to read, fetch, generate, or prepare content and upload it to IPFS/Filecoin for testing, "upload this file and give me the CID", or "pin this output". Runs the Filecoin Pin Upload test CLI and returns the root CID and gateway links.
---

# Filecoin Pin Upload

Use this for test uploads only. The CLI uses Calibration testnet and public
scoped demo credentials from `pin.filecoin.cloud` unless the user provides env
overrides.

## Workflow

1. Read or generate the requested content.
2. Write the exact upload artifact to a temp file or folder.
3. Run:

```bash
npx --yes github:davidgasquez/filecoin-pin-upload <file-or-folder>
```

4. Return these fields from CLI output:
   - `Root CID`
   - `IPFS in-browser link`
   - `IPFS gateway link`
   - `Piece CID`
   - provider `Copy` URL

## Gotchas

- Use the `Root CID` for IPFS gateway links.
- Do not put the `Piece CID` in an IPFS gateway URL.
- For command-line verification, use `https://ipfs.io/ipfs/<root-cid>`.
- `https://<root-cid>.ipfs.inbrowser.link` is intended for browsers and may return a service-worker shell to `curl`.
