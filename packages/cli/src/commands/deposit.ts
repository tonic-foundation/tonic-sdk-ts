import { ftMetadata, NEAR_DECIMALS } from '@tonic-foundation/token';
import { decimalToBn } from '@tonic-foundation/utils';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';

import BaseCommand, { parseTokenId } from '../base';

export default class Deposit extends BaseCommand {
  static description = 'Deposit NEP-141 tokens or NEAR into the exchange.';

  static examples = [`$ tonic deposit ft.examples.testnet 100`];

  static args = [
    {
      name: 'tokenId',
      description: 'Contract ID of the token. Pass `NEAR` for native NEAR.',
      required: true,
      parse: parseTokenId,
    },
    {
      name: 'amount',
      description: 'Amount to deposit, eg, 0.1',
      required: true,
      parse: async (s: string) => {
        return parseFloat(s);
      },
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(Deposit);
    let { tokenId, amount } = args as { tokenId: string; amount: number };
    if (typeof tokenId !== 'string') {
      throw new Error('unreachable');
    }

    let outcome: FinalExecutionOutcome;
    if (tokenId.toUpperCase() === 'NEAR') {
      const res = await this.tonic.depositNear(
        decimalToBn(amount, NEAR_DECIMALS)
      );
      outcome = res.executionOutcome;
    } else {
      let tokenMetadata = await ftMetadata(this.account, tokenId);
      const res = await this.tonic.depositFt(
        tokenId,
        decimalToBn(amount, tokenMetadata.decimals),
        ''
      );
      outcome = res.executionOutcome;
    }

    this.log(`Deposited ${amount.toString()} ${tokenId}`);
    this.logTransaction(outcome);
  }
}
