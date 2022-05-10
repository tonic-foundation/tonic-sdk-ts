import { Market } from '../src/market';
import { MarketViewV1 } from '../src/types/v1';

describe('Market tests', () => {
  it('generates batch actions', () => {
    const market = new Market(null as any, 'market-id', {
      base_token: {
        decimals: 8,
        lot_size: 1,
        token_type: {
          type: 'FungibleToken',
          account_id: 'wbtc.near',
        },
      },
      quote_token: {
        decimals: 6,
        lot_size: 1,
        token_type: {
          type: 'FungibleToken',
          account_id: 'usdc.near',
        },
      },
    } as unknown as MarketViewV1);

    const batch = market.createBatchAction();
    batch.cancelAllOrders();
    for (let i = 0; i < 30; i++) {
      batch.newOrder({
        maxQuantity: i * 0.01,
        limitPrice: 40000 + 100 * i,
        orderType: 'Limit',
        side: 'Sell',
      });
      batch.newOrder({
        maxQuantity: i * 0.01,
        limitPrice: 40000 + 100 * i,
        orderType: 'Limit',
        side: 'Sell',
      });
    }

    console.log(JSON.stringify(batch.prepare(), null, 2));
  });
});
