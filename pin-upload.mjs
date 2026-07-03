#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { Readable } from 'node:stream';

import { AddPiecesPermission, CreateDataSetPermission, fromSecp256k1 } from '@filoz/synapse-core/session-key';
import { calibration, Synapse } from '@filoz/synapse-sdk';
import { cleanupTempCar, createCarFromPath } from 'filecoin-pin/core/unixfs';
import { executeUpload } from 'filecoin-pin/core/upload';
import pino from 'pino';
import { createClient, custom, getAddress, http } from 'viem';

const DEFAULT_WALLET_ADDRESS = '0x44f08D1beFe61255b3C3A349C392C560FA333759';
const DEFAULT_SESSION_KEY = '0x416dc827726298c032acf086ddf45c1de79b8e62f3af2ffe0377afe08862deb3';
const DEFAULT_RPC_URL = 'https://api.calibration.node.glif.io/rpc/v1';
const DEFAULT_PROVIDER_ID = 2n;
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const REQUIRED_PERMISSIONS = [CreateDataSetPermission, AddPiecesPermission];

function ipfsInBrowserLink(cid) {
  return `https://${cid}.ipfs.inbrowser.link`;
}

function ipfsGatewayLink(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

function usage() {
  console.error('Usage: pin-upload <file-or-folder> [--copies n] [--ipni]');
  console.error('');
  console.error('Env overrides: WALLET_ADDRESS, SESSION_KEY, RPC_URL');
}

function parseArgs(argv) {
  const options = { copies: 1, ipni: false, path: undefined };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--copies') {
      const raw = argv[++i];
      const copies = Number(raw);
      if (!Number.isInteger(copies) || copies < 1) throw new Error('--copies must be a positive integer');
      options.copies = copies;
    } else if (arg === '--ipni') {
      options.ipni = true;
    } else if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (options.path == null) {
      options.path = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (options.path == null) throw new Error('Missing file or folder path');
  return options;
}

async function createSynapse() {
  const walletAddress = getAddress(process.env.WALLET_ADDRESS ?? DEFAULT_WALLET_ADDRESS);
  const sessionKey = process.env.SESSION_KEY ?? DEFAULT_SESSION_KEY;
  const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
  const transport = http(rpcUrl);

  const scopedKey = fromSecp256k1({
    privateKey: sessionKey,
    root: walletAddress,
    chain: calibration,
    transport,
  });

  await scopedKey.syncExpirations(REQUIRED_PERMISSIONS);
  if (!scopedKey.hasPermissions(REQUIRED_PERMISSIONS)) {
    throw new Error('Session key lacks CreateDataSet/AddPieces permission');
  }

  const resolved = transport({ chain: calibration, retryCount: 0 });
  const client = createClient({
    account: walletAddress,
    chain: calibration,
    key: 'synapse-client',
    name: 'Synapse Client',
    pollingInterval: 15_000,
    transport: custom({ request: resolved.request }),
  });

  return new Synapse({
    client,
    sessionClient: scopedKey.client,
    source: 'filecoin-pin',
    withCDN: false,
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = options.path;
  const sourceStat = await stat(source);
  const logger = pino({ level: process.env.LOG_LEVEL ?? 'silent' });
  const synapse = await createSynapse();

  let carPath;
  try {
    console.log(`Packing ${sourceStat.isDirectory() ? 'folder' : 'file'}: ${source}`);
    const car = await createCarFromPath(source, { isDirectory: sourceStat.isDirectory(), logger });
    carPath = car.carPath;
    const rootCid = car.rootCid.toString();

    const carStat = await stat(carPath);
    console.log(`Root CID: ${rootCid}`);
    console.log(`CAR size: ${carStat.size} bytes`);
    console.log('Uploading...');

    const uploadOptions = {
      copies: options.copies,
      ipniValidation: { enabled: options.ipni },
      logger,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      onProgress(event) {
        if (event.type === 'providerSelected') {
          console.log(`Provider: ${event.data.provider.id} (${event.data.provider.name})`);
        } else if (event.type === 'dataSetResolved') {
          console.log(`Dataset: ${event.data.dataSetId}`);
        } else if (event.type === 'stored') {
          console.log(`Stored piece: ${event.data.pieceCid}`);
        } else if (event.type === 'piecesAdded') {
          console.log(`Transaction: ${event.data.txHash}`);
        } else if (event.type === 'piecesConfirmed') {
          console.log(`Confirmed piece ids: ${event.data.pieceIds.join(', ')}`);
        }
      },
      pieceMetadata: { label: basename(source) },
    };
    if (options.copies === 1) uploadOptions.providerIds = [DEFAULT_PROVIDER_ID];

    const result = await executeUpload(synapse, Readable.toWeb(createReadStream(carPath)), car.rootCid, uploadOptions);

    console.log('');
    console.log('Upload complete');
    console.log(`Network: ${result.network}`);
    console.log(`Root CID: ${rootCid}`);
    console.log(`IPFS in-browser link: ${ipfsInBrowserLink(rootCid)}`);
    console.log(`IPFS gateway link: ${ipfsGatewayLink(rootCid)}`);
    console.log(`Piece CID: ${result.pieceCid}`);
    console.log(`Size: ${result.size} bytes`);
    console.log(`Complete: ${result.complete}`);
    for (const copy of result.copies) {
      console.log(
        `Copy: provider=${copy.providerId} dataset=${copy.dataSetId} piece=${copy.pieceId} url=${copy.retrievalUrl}`,
      );
    }
    if (result.failedAttempts.length > 0) {
      console.log(`Failed attempts: ${result.failedAttempts.length}`);
    }
  } finally {
    if (carPath != null) await cleanupTempCar(carPath, logger);
  }
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
