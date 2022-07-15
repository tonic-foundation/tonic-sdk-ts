import { BN } from 'bn.js';
import { CliUx, Flags } from '@oclif/core';

import BaseCommand from '../base';
import { ftOrNativeNearMetadata } from '@tonic-foundation/token';

export default class ListMarkets extends BaseCommand {
  static description = `List markets in the DEX contract`;

  static examples = [`$ tonic list-markets`];

  static flags = {
    ...BaseCommand.flags,
    offset: Flags.integer({
      description: 'Market ID offset',
      default: 0,
    }),
    limit: Flags.integer({
      description: 'Limit on number of markets returned',
      default: 100,
    }),
    includeInactive: Flags.boolean({
      description: 'Include inactive markets',
      default: false,
    }),
  };

  static args = [];

  public async getRow(marketId: string, index: number) {
    const market = await this.tonic.getMarket(marketId);
    const [baseToken, quoteToken] = await Promise.all([
      ftOrNativeNearMetadata(this.account, market.baseTokenId),
      ftOrNativeNearMetadata(this.account, market.quoteTokenId),
    ]);
    const baseSymbol = baseToken.symbol;
    const quoteSymbol = quoteToken.symbol;

    return {
      index,
      id: market.id,
      pair: `${baseSymbol}/${quoteSymbol}`,
      baseSymbol,
      quoteSymbol,
      baseToken: market.baseTokenId,
      quoteToken: market.quoteTokenId,
      baseTick: market.quantityBnToNumber(new BN(market.baseLotSize)),
      quoteTick: market.priceBnToNumber(new BN(market.quoteLotSize)),
    };
  }

  public async run() {
    const { flags } = await this.parse(ListMarkets);
    const allMarkets = await this.tonic.listMarkets(flags.offset, flags.limit);
    const markets = flags.includeInactive
      ? allMarkets
      : // TODO: bump SDK version to remove this
        // @ts-ignore
        allMarkets.filter((m) => m.state === 'Active');
    const rows = await Promise.all(
      markets.map((m, idx) => this.getRow(m.id, flags.offset + idx))
    );

    CliUx.Table.table(rows, {
      index: {
        header: 'Index',
      },
      id: {
        header: 'ID',
      },
      pair: {
        header: 'Pair',
      },
      baseTick: {
        header: `Quantity min tick`,
        get: ({ baseTick, baseSymbol }) => {
          return `${baseTick} ${baseSymbol}`;
        },
      },
      quoteTick: {
        header: `Price min tick`,
        get: ({ quoteTick, quoteSymbol }) => {
          return `${quoteTick} ${quoteSymbol}`;
        },
      },
    });
  }
}
