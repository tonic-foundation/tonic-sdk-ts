import { NEAR_DECIMALS, ftMetadata } from '@tonic-foundation/token';
import { TokenId } from '@tonic-foundation/tonic';
import { decimalToBn } from '@tonic-foundation/utils';
import BN from 'bn.js';
import BaseCommand, { parseTokenId } from '../base';

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw exchange balances.';

  static examples = [`$ tonic withdraw NEAR 0.1`];

  static flags = {
    ...BaseCommand.flags,
  };

  static args = [
    {
      name: 'tokenId',
      description:
        'Contract ID of the token to withdraw. Pass `NEAR` for native NEAR.',
      required: true,
      parse: parseTokenId,
    },
    {
      name: 'amount',
      description: 'Amount to withdraw',
      required: true,
      parse: async (s: string) => parseFloat(s),
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(Withdraw);
    const { tokenId: rawTokenId, amount: rawAmount } = args as {
      tokenId: string;
      amount: number;
    };

    let tokenId: TokenId;
    if (rawTokenId === 'NEAR') {
      tokenId = rawTokenId;
    } else if (rawTokenId.startsWith('ft:')) {
      tokenId = rawTokenId as TokenId;
    } else {
      tokenId = `ft:${rawTokenId}`;
    }

    let amount: BN;
    if (tokenId === 'NEAR') {
      amount = decimalToBn(rawAmount, NEAR_DECIMALS);
    } else {
      let tokenMetadata = await ftMetadata(this.account, tokenId);
      amount = decimalToBn(rawAmount, tokenMetadata.decimals);
    }

    const { executionOutcome, response } = await this.tonic.withdraw(
      tokenId,
      amount
    );

    this.log(`Withdrew ${args.amount} ${args.tokenId}`, response);
    this.logTransaction(executionOutcome);
  }
}
