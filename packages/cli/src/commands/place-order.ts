import { Flags } from '@oclif/core';
import { OrderSide, OrderType } from '@tonic-foundation/tonic';
import BaseCommand, { FloatFlag } from '../base';


export const OrderTypeFlag = Flags.build<OrderType>({
  parse: async (s: string) => {
    if (s.toUpperCase() === 'LIMIT') {
      return 'Limit';
    }
    if (s.toUpperCase() === 'MARKET') {
      return 'Market';
    }
    if (s.toUpperCase() === 'POSTONLY') {
      return 'PostOnly';
    }

    throw new Error('Invalid order type');
  },
});

export default class PlaceOrder extends BaseCommand {
  static description = 'Place an order.';

  static examples = [
    `$ tonic place-order NEAR-ft:ft.examples.testnet \
    --direction buy \
    --price 100 \
    --post-only`,
  ];

  static flags = {
    ...BaseCommand.flags,

    type: Flags.enum<'limit' | 'market'>({
      options: ['limit', 'market'],
      char: 't',
      description: 'Order type',
      default: 'limit',
      required: true,
      parse: (s: string) => {
        if (s === 'limit') {
          return s as any; // oclif type issue
        }
        throw new Error(`${s} orders unimplemented`);
      },
    }),

    buy: Flags.boolean({
      description: 'Buy',
      exactlyOne: ['buy', 'sell'],
    }),

    sell: Flags.boolean({
      description: 'Sell',
      exactlyOne: ['buy', 'sell'],
    }),

    price: FloatFlag({
      char: 'p',
      description: 'Order price as a human-readable number, eg 1.23',
      required: true,
    }),

    quantity: FloatFlag({
      char: 'q',
      description: 'Order quantity as a human-readable number, eg 4.56',
      required: true,
    }),

    orderType: OrderTypeFlag({
      char: 't',
      description: 'Order type (market, limit, postonly)',
      default: 'Limit',
    }),

    ioc: Flags.boolean({
      default: false,
      exclusive: ['post-only'],
    }),
  };

  static args = [
    {
      name: 'market',
      description: 'Market ID',
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PlaceOrder);
    if (flags.type === 'market') {
      throw new Error('Market order not supported yet');
    }

    if (!flags.buy && !flags.sell) {
      throw new Error('Missing order direction (pass --buy or --sell)');
    }

    const { market: marketId } = args as { market: string };
    const market = await this.tonic.getMarket(marketId);

    this.log(`Sending transaction...`);

    const side: OrderSide = flags.buy ? 'Buy' : 'Sell';
    const { response, executionOutcome } = await market.placeOrder({
      limitPrice: flags.price,
      quantity: flags.quantity,
      orderType: flags.orderType,
      side,
    });

    this.logTransaction(executionOutcome);

    this.log(`Order ${response.id} placed`);
    // whatever
    console.log(
      Object.fromEntries(
        Object.keys(response).map((k) => {
          return [k, (response as any)[k].toString()] as const;
        })
      )
    );
  }
}
