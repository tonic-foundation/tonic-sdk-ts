import { Flags } from '@oclif/core';

import BaseCommand from '../base';

export default class StorageDeposit extends BaseCommand {
  static description = 'Deposit NEAR for storage staking with the DEX.';

  static examples = [`$ tonic storage-deposit 0.1`];

  static flags = {
    ...BaseCommand.flags,
    'registration-only': Flags.boolean({
      description: 'Deposit amount to open an account. Refund the excess.',
      default: false,
    }),
  };

  static args = [
    {
      name: 'amount',
      description:
        'Contract ID of the base token. Pass `NEAR` for native NEAR.',
      required: false,
    },
    {
      name: 'for',
      description: 'Account to deposit for',
      required: false,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageDeposit);
    if (!args.amount && !flags['registration-only']) {
      this.log('Specify amount or --registration-only. Try -h for help');
    }

    const amount = args.amount ? parseFloat(args.amount) : 0.1;

    const { executionOutcome } = await this.tonic.storageDeposit({
      amount,
      accountId: args.for,
      registrationOnly: !!flags['registration-only'],
    });

    this.log(`Registered account with the exchange`);
    this.logTransaction(executionOutcome);
  }
}
