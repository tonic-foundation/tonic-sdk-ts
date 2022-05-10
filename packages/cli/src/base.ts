import { Account, Near, keyStores } from 'near-api-js';
import { Command, Flags } from '@oclif/core';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { OutputFlags } from '@oclif/core/lib/interfaces';
import { homedir } from 'os';

import BN from 'bn.js';
import { Tonic } from '@tonic-foundation/tonic';

import {
  getNearConfig,
  ConfigWithExplorerUrl,
} from '@tonic-foundation/tonic/lib/util/getNearConfig';

const getKeystore = async () => {
  const HOME_DIR = homedir();
  const CREDENTIALS_DIR = '.near-credentials';
  const credentialsPath = require('path').join(HOME_DIR, CREDENTIALS_DIR);

  return new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
};

export default abstract class BaseCommand extends Command {
  static flags = {
    networkId: Flags.string({
      default: 'testnet',
      env: 'NEAR_ENV',
    }),
    accountId: Flags.string({
      env: 'NEAR_ACCOUNT_ID',
      required: true,
    }),
    contractId: Flags.string({
      env: 'TONIC_CONTRACT_ID',
      required: true,
    }),
  };

  account!: Account;

  globalFlags!: OutputFlags<typeof BaseCommand.flags>;

  tonic!: Tonic;

  connectConfig!: ConfigWithExplorerUrl;

  async init() {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand);
    this.globalFlags = flags;

    const connectConfig = getNearConfig(flags.networkId);
    this.connectConfig = connectConfig;

    const keyStore = await getKeystore();
    const near = new Near({ ...connectConfig, keyStore });
    const account = await near.account(flags.accountId);
    this.account = account;

    this.tonic = new Tonic(account, flags.contractId);
  }

  logTransaction(outcome: FinalExecutionOutcome) {
    const txId = outcome.transaction_outcome.id;
    this.log(`Transaction ID: ${txId}`);

    if (this.connectConfig.explorerUrl) {
      const explorerLink = `${this.connectConfig.explorerUrl}/transactions/${txId}`;
      this.log(`View in the explorer: ${explorerLink}`);
    }
  }
}

export const BNflag = Flags.build<BN>({
  parse: async (s) => new BN(s),
});

export const FloatFlag = Flags.build<number>({
  parse: async (s) => {
    const v = parseFloat(s);
    if (isNaN(v)) {
      throw new Error(`${s} is not a number`);
    }
    return v;
  },
});

export const TokenIdFlag = Flags.build<string>({
  parse: parseTokenId,
});

export async function parseTokenId(s: string): Promise<string> {
  if (s.toUpperCase() === 'NEAR') {
    return 'NEAR';
  }
  return s;
}
