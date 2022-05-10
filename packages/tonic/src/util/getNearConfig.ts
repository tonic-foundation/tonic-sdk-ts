// from https://github.com/near/near-cli/blob/20ec871185be8b163567e147dc909f1c7f383ca9/config.js
import { ConnectConfig } from 'near-api-js';

export type ConfigWithExplorerUrl = ConnectConfig & { explorerUrl?: string };

export function getNearConfig(env: string): ConfigWithExplorerUrl {
  let config: ConfigWithExplorerUrl;
  const headers = { 'x-requested-with': 'tonic-cli' };

  switch (env) {
    case 'production':
    case 'mainnet':
      config = {
        networkId: 'mainnet',
        nodeUrl:
          process.env.NEAR_CLI_MAINNET_RPC_SERVER_URL ||
          'https://rpc.mainnet.near.org',
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        headers,
        // helperAccount: 'near',
        explorerUrl: 'https://explorer.mainnet.near.org',
      };
      break;
    case 'development':
    case 'testnet':
      config = {
        networkId: 'testnet',
        nodeUrl:
          process.env.NEAR_CLI_TESTNET_RPC_SERVER_URL ||
          'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        headers,
        // helperAccount: 'testnet',
        explorerUrl: 'https://explorer.testnet.near.org',
      };
      break;
    case 'betanet':
      config = {
        networkId: 'betanet',
        nodeUrl:
          process.env.NEAR_CLI_BETANET_RPC_SERVER_URL ||
          'https://rpc.betanet.near.org',
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org',
        headers,
        // helperAccount: 'betanet',
        explorerUrl: 'https://explorer.betanet.near.org',
      };
      break;
    case 'guildnet':
      config = {
        networkId: 'guildnet',
        nodeUrl:
          process.env.NEAR_CLI_GUILDNET_RPC_SERVER_URL ||
          'https://rpc.openshards.io',
        walletUrl: 'https://wallet.openshards.io',
        headers,
        // helperUrl: 'https://helper.openshards.io',
        // helperAccount: 'guildnet',
      };
      break;
    case 'local':
    case 'localnet':
      config = {
        networkId: process.env.NEAR_CLI_LOCALNET_NETWORK_ID || 'local',
        nodeUrl:
          process.env.NEAR_CLI_LOCALNET_RPC_SERVER_URL ||
          process.env.NEAR_NODE_URL ||
          'http://localhost:3030',
        keyPath:
          process.env.NEAR_CLI_LOCALNET_KEY_PATH ||
          `${process.env.HOME}/.near/validator_key.json`,
        walletUrl:
          process.env.NEAR_WALLET_URL || 'http://localhost:4000/wallet',
        headers,
        helperUrl: process.env.NEAR_HELPER_URL || 'http://localhost:3000',
        // helperAccount: process.env.NEAR_HELPER_ACCOUNT || 'node0',
        explorerUrl: process.env.NEAR_EXPLORER_URL || 'http://localhost:9001',
      };
      break;
    case 'test':
    case 'ci':
      config = {
        networkId: 'shared-test',
        nodeUrl:
          process.env.NEAR_CLI_CI_RPC_SERVER_URL ||
          'https://rpc.ci-testnet.near.org',
        masterAccount: 'test.near',
        headers,
      };
      break;
    default:
      throw Error(
        `Unconfigured environment '${env}'. Can be configured in src/config.js.`
      );
  }

  return config;
}

export default getNearConfig;
