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

For reproducible testing, pin a commit:

```bash
npx --yes github:davidgasquez/filecoin-pin-upload#<commit-sha> <file-or-folder>
```

Example:

```bash
npx --yes github:davidgasquez/filecoin-pin-upload /tmp/filecoin-pin-hello.txt
```

Do not use this default configuration for production uploads. Anyone running the
repo without env overrides uses the same public Calibration demo wallet/session
key configured in `pin-upload.mjs`.

Default uploads use one copy on Calibration provider `2` (`ezpdpz-calib2`) so
the command completes without interactive provider selection.

## Agent usage

For prompts like "Read X and upload Y":

1. Read or fetch `X`.
2. Write the requested upload content `Y` to a temp file or folder.
3. Run:

```bash
npx --yes github:davidgasquez/filecoin-pin-upload <file-or-folder>
```

4. Return the `Root CID`, `IPFS in-browser link`, `IPFS gateway link`, `Piece
   CID`, and provider `Copy` URL from the command output.

The root [SKILL.md](./SKILL.md) contains the same concise workflow for agents
that support skills.

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

## Test

```bash
perl -e 'print "hello world\n" x 400' > /tmp/filecoin-pin-hello.txt
./pin-upload.mjs /tmp/filecoin-pin-hello.txt
```

Last verified result:

- Root CID: `bafkreigyqxs6tebz6rjuvvbam4sx5k5reixuwtkx5j36bklzojbwbyqpze`
- In-browser link: `https://bafkreigyqxs6tebz6rjuvvbam4sx5k5reixuwtkx5j36bklzojbwbyqpze.ipfs.inbrowser.link`
- Gateway link: `https://ipfs.io/ipfs/bafkreigyqxs6tebz6rjuvvbam4sx5k5reixuwtkx5j36bklzojbwbyqpze`
- Piece CID: `bafkzcibdt4mqr552kautfbdybkuqnwzwjjtvgwr5ahdemrigvi4d6lldtcvuoti5`
- Network: Calibration
