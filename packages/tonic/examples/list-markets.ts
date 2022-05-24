import { getNearConfig } from '@tonic-foundation/config';
import { keyStores, Near } from 'near-api-js';
import { homedir } from 'os';
import { Tonic } from '../src';

const NEAR_ACCOUNT_ID = requireEnv('NEAR_ACCOUNT_ID');
const TONIC_CONTRACT_ID = requireEnv('TONIC_CONTRACT_ID');

function requireEnv(name: string) {
  const val = process.env[name];
  if (!val?.length) {
    throw new Error('Missing environment variable ' + val);
  }
  return val;
}

async function getKeystore() {
  const HOME_DIR = homedir();
  const CREDENTIALS_DIR = '.near-credentials';
  const credentialsPath = require('path').join(HOME_DIR, CREDENTIALS_DIR);

  return new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
}

async function getAccount() {
  const nearConfig = getNearConfig('testnet');
  const keyStore = await getKeystore();
  const near = new Near({ ...nearConfig, keyStore });
  return near.account(NEAR_ACCOUNT_ID);
}

async function main() {
  const account = await getAccount();
  const tonic = new Tonic(account, TONIC_CONTRACT_ID);

  const markets = await tonic.listMarkets();

  console.log(JSON.stringify(markets, null, '  '));
}

main();
