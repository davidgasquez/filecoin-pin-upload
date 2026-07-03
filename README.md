# Filecoin Pin Upload CLI 🧷

Small test CLI for uploading a file or folder through the same Calibration
testnet flow used by `https://pin.filecoin.cloud`.

This repo is for testing and demos only. By default it uses Calibration testnet
and the public scoped demo credentials from `pin.filecoin.cloud`.

## Quickstart

Clone and:

```bash
./pin-upload.mjs <file-or-folder>
```

Optional:

```bash
./pin-upload.mjs <file-or-folder> --copies 2
./pin-upload.mjs <file-or-folder> --ipni
```

Env overrides:

```bash
WALLET_ADDRESS=0x... SESSION_KEY=0x... RPC_URL=https://... ./pin-upload.mjs ./file.txt
```

## Run from GitHub

```bash
npx --yes github:davidgasquez/filecoin-pin-upload <file-or-folder>
```

Do not use this default configuration for production uploads. Anyone running the
repo without env overrides uses the same public Calibration demo wallet/session
key configured in `pin-upload.mjs`.

Default uploads use one copy on Calibration provider `2` (`ezpdpz-calib2`) so
the command completes without interactive provider selection.

## CIDs and links

Use the `Root CID` for IPFS gateway links:

```text
https://<root-cid>.ipfs.inbrowser.link
https://ipfs.io/ipfs/<root-cid>
```

Do not use the `Piece CID` in an IPFS gateway URL. The `Piece CID` identifies
the Filecoin/PDP piece and is used with the provider retrieval URL printed in
the `Copy: ... url=...` line.

The CLI prints both links after a successful upload:

```text
Root CID: bafk...
IPFS in-browser link: https://bafk....ipfs.inbrowser.link
IPFS gateway link: https://ipfs.io/ipfs/bafk...
Piece CID: bafkz...
```

For command-line verification, use the `ipfs.io` link. `inbrowser.link` serves
a browser service-worker shell to non-browser clients such as `curl`.
