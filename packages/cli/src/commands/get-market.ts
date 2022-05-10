import { BN } from 'bn.js';
import { CliUx } from '@oclif/core';

import BaseCommand from '../base';
import {
  getMidmarketPriceNumber,
  NumberL2Order,
} from '@tonic-foundation/tonic/lib/market';
import { ftOrNativeNearMetadata } from '@tonic-foundation/token';

export default class GetMarket extends BaseCommand {
  static description = `Get information about a market by ID`;

  static examples = [`$ tonic get-market 1746518450595387872`];

  static args = [
    {
      name: 'marketId',
      description: 'Market ID',
      required: true,
    },
  ];

  public async run() {
    const { args } = await this.parse(GetMarket);

    const market = await this.tonic.getMarket(args.marketId);
    const orderbook = await market.getOrderbook(8);
    const [baseToken, quoteToken] = await Promise.all([
      ftOrNativeNearMetadata(this.account, market.baseTokenId),
      ftOrNativeNearMetadata(this.account, market.quoteTokenId),
    ]);
    const baseSymbol = baseToken.symbol;
    const quoteSymbol = quoteToken.symbol;

    CliUx.Table.table(
      [
        {
          pair: `${baseSymbol}/${quoteSymbol}`,
          chartingSupport: '',
          baseSymbol,
          quoteSymbol,
          baseTick: market.baseLotSize,
          quoteTick: market.quoteLotSize,
          midmarketPrice: getMidmarketPriceNumber(orderbook),
          ...orderbook,
        },
      ],
      {
        pair: {
          header: 'Pair',
        },
        baseTick: {
          header: `Quantity min tick`,
          get: ({ baseSymbol }) => {
            return `${market.quantityBnToNumber(
              new BN(market.baseLotSize)
            )} ${baseSymbol}`;
          },
        },
        quoteTick: {
          header: `Price min tick`,
          get: ({ quoteSymbol }) => {
            console.log('getting price tick');
            return `${market.priceBnToNumber(
              new BN(market.quoteLotSize)
            )} ${quoteSymbol}`;
          },
        },
        midmarketPrice: {
          header: 'Current price',
          get: ({ midmarketPrice: p }) =>
            p ? `${p} ${quoteSymbol}/${baseSymbol}` : 'No orders',
        },
        asks: {
          header: 'Asks',
          get: ({ asks }) =>
            ordersToString([...asks].reverse(), baseSymbol, quoteSymbol),
        },
        bids: {
          header: 'Bids',
          get: ({ bids }) => ordersToString(bids, baseSymbol, quoteSymbol),
        },
      }
    );
  }
}

function ordersToString(
  orders: NumberL2Order[],
  baseSymbol: string,
  quoteSymbol: string
): string {
  return orders
    .map(
      ([price, quantity]) =>
        `${quantity} ${baseSymbol} @ ${price} ${quoteSymbol}`
    )
    .join('\n');
}
