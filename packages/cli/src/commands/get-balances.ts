import { CliUx } from '@oclif/core';

import BaseCommand from '../base';

export default class GetBalances extends BaseCommand {
  static description = `Get user exchange balances`;

  static examples = [`$ tonic get-balances`];

  public async run() {
    const balanceMap = await this.tonic.getBalances();
    const balances = Object.keys(balanceMap).map((token) => ({
      token,
      amount: balanceMap[token].toString(),
    }));

    CliUx.Table.table(balances, {
      token: {
        header: 'Asset',
      },
      amount: {
        header: 'Native balance',
        minWidth: 10,
      },
    });
  }
}
