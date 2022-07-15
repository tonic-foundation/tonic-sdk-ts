import { getNearConfig } from '@tonic-foundation/config';
import { keyStores, Near } from 'near-api-js';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
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

function logTx(outcome: FinalExecutionOutcome) {
  const txId = outcome.transaction_outcome.id;
  console.log(`Transaction ID: ${txId}`);
  const explorerLink = `https://explorer.testnet.near.org/transactions/${txId}`;
  console.log(`View in the explorer: ${explorerLink}`);
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

  const batch = market.createBatchAction();

  // Cancel all orders in this market.
  batch.cancelAllOrders();

  for (let i = 1; i <= 25; i++) {
    batch.newOrder({
      quantity: 0.01,
      limitPrice: 100 - i,
      orderType: 'Limit',
      side: 'Buy',
    });
    batch.newOrder({
      quantity: 0.01,
      limitPrice: 100 + i,
      orderType: 'Limit',
      side: 'Sell',
    });
  }

  // Send the transaction. All open orders in the market will be cancelled and 60
  // new ones will be placed atomically.
  logTx((await tonic.executeBatch(batch)).executionOutcome);
}

main();
