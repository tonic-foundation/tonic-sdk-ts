import { CliUx } from '@oclif/core';
import BaseCommand from '../base';

export default class GetOpenOrders extends BaseCommand {
  static description = `Get open orders in a market.`;

  static examples = [`$ tonic get-open-orders $MARKET_ID`];

  static args = [
    {
      name: 'marketId',
      description: 'Market ID',
      required: true,
    },
  ];

  public async run() {
    const { args } = await this.parse(GetOpenOrders);
    const orders = await this.tonic.getOpenOrders(args.marketId);
    const market = await this.tonic.getMarket(args.marketId);

    const bids = orders
      .filter((o) => o.side === 'Buy')
      .sort((a, b) => a.limitPrice.cmp(b.limitPrice));
    const asks = orders
      .filter((o) => o.side === 'Sell')
      .sort((a, b) => b.limitPrice.cmp(a.limitPrice));
    const sortedOrders = [...asks, ...bids];

    const formatted = sortedOrders.map((o) => {
      return {
        id: o.id,
        open_quantity: market.quantityBnToNumber(o.remainingQuantity),
        original_quantity: market.quantityBnToNumber(o.originalQuantity!),
        limit_price: market.priceBnToNumber(o.limitPrice),
        side: o.side,
        client_id: o.clientId,
      };
    });

    CliUx.Table.table(formatted, {
      id: {
        header: 'Order ID',
      },
      side: {
        header: 'Side',
      },
      limit_price: {
        header: 'Price',
      },
      original_quantity: {
        header: 'Original quantity',
      },
      open_quantity: {
        header: 'Open quantity',
      },
      client_id: {
        header: 'ClientID',
      },
    });
  }
}
