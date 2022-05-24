import { getNearConfig } from '@tonic-foundation/config';
import { keyStores, Near } from 'near-api-js';
import { homedir } from 'os';
import { Tonic } from '../src';

const NEAR_ACCOUNT_ID = requireEnv('NEAR_ACCOUNT_ID');
const TONIC_CONTRACT_ID = requireEnv('TONIC_CONTRACT_ID');
const MARKET_ID = requireEnv('MARKET_ID');

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

/**
 * This example cancels all open orders and places 60 new ones.
 */
async function main() {
  const account = await getAccount();
  const tonic = new Tonic(account, TONIC_CONTRACT_ID);

  /**
   * Example 1: Batch operations in a single market
   *
   * In this example, we cancel all open orders in a market and replace them
   * with new ones atomatically.
   */
  console.log('Fetching market');
  const market = await tonic.getMarket(MARKET_ID);

  console.log(market);
  console.log(market.inner);
}

main();
