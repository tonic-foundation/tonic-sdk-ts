import { Flags } from '@oclif/core';
import { storageDeposit } from '@tonic-foundation/storage';
import { BN } from 'bn.js';

import BaseCommand, { parseTokenId } from '../base';

export default class CreateMarket extends BaseCommand {
  static description = 'Create a market.';

  static examples = [`$ tonic create-market NEAR ft.examples.testnet 100 100`];

  static flags = {
    ...BaseCommand.flags,
    'skip-storage-base': Flags.boolean({
      description: 'Skip storage deposit for market in the base token contract',
      default: false,
    }),
    'skip-storage-quote': Flags.boolean({
      description:
        'Skip storage deposit for market in the quote token contract',
      default: false,
    }),
  };

  static args = [
    {
      name: 'base',
      description:
        'Contract ID of the base token. Pass `NEAR` for native NEAR.',
      required: true,
      parse: parseTokenId,
    },
    {
      name: 'quote',
      description: 'Contract ID of quote token. Pass `NEAR` for native NEAR.',
      required: true,
      parse: parseTokenId,
    },
    {
      name: 'baseLotSize',
      description: 'Minimum order quantity step size.',
      required: true,
    },
    {
      name: 'quoteLotSize',
      description: 'Minimum price step size.',
      required: true,
    },
    {
      name: 'takerFeeBaseRate',
      description: 'Base rate for the taker fee in bps',
      required: true,
    },
    {
      name: 'makerRebateBaseRate',
      description: 'Base rate for the maker rebate in bps',
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CreateMarket);

    this.log('Creating market');
    const { executionOutcome, response: marketId } =
      await this.tonic.createMarket({
        baseTokenId: args.base,
        quoteTokenId: args.quote,
        baseTokenLotSize: new BN(args.baseLotSize).toString(),
        quoteTokenLotSize: new BN(args.quoteLotSize).toString(),
        takerFeeBaseRate: parseInt(args.takerFeeBaseRate),
        makerRebateBaseRate: parseInt(args.makerRebateBaseRate),
      });
    this.log(`Created market ${marketId}`);
    this.logTransaction(executionOutcome);

    if (!flags['skip-storage-base'] && args.base !== 'NEAR') {
      this.log(
        `Performing storage deposit for ${this.globalFlags.contractId} in ${args.base}`
      );
      this.logTransaction(
        (
          await storageDeposit(this.account, args.base, {
            accountId: this.globalFlags.contractId,
            registrationOnly: true,
            amount: 0.1,
          })
        ).executionOutcome
      );
    }
    if (!flags['skip-storage-quote'] && args.quote !== 'NEAR') {
      this.log(
        `Performing storage deposit for ${this.globalFlags.contractId} in ${args.quote}`
      );
      this.logTransaction(
        (
          await storageDeposit(this.account, args.quote, {
            accountId: this.globalFlags.contractId,
            registrationOnly: true,
            amount: 0.1,
          })
        ).executionOutcome
      );
    }
  }
}
