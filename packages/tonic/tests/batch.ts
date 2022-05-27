import assert from 'assert';
import { BN } from 'bn.js';
import { Market } from '../src/market';
import { MarketViewV1 } from '../src/types/v1';

describe('batch operation tests', () => {
  it('generates batch actions', () => {
    // this is just a typecheck
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
        quantity: i * 0.01,
        limitPrice: 40000 + 100 * i,
        orderType: 'Limit',
        side: 'Sell',
      });
      batch.newOrder({
        quantity: i * 0.01,
        limitPrice: 40000 + 100 * i,
        orderType: 'Limit',
        side: 'Sell',
      });
    }

    JSON.stringify(batch.prepare(), null, 2);
  });

  it('converts price numbers to BNs correctly', () => {
    const market = new Market(null as any, 'market-id', {
      base_token: {
        decimals: 8,
        lot_size: 100,
        token_type: {
          type: 'FungibleToken',
          account_id: 'wbtc.near',
        },
      },
      quote_token: {
        decimals: 6,
        lot_size: 100,
        token_type: {
          type: 'FungibleToken',
          account_id: 'usdc.near',
        },
      },
    } as unknown as MarketViewV1);

    const price = 12.0004101600640255;

    // Without rounding up or flooring to quote lot size, the
    // expected behavior is just to return price*(10^decimals).
    assert.equal(
      market.priceNumberToBn(price, false).toString(),
      new BN('12000410').toString()
    );

    // With floor===true, return value floored to nearest
    // quote lot size (100).
    assert.equal(
      market.priceNumberToBn(price, true).toString(),
      new BN('12000400').toString()
    );

    // With rounding up and no flooring, the trailing
    // digits get rounded up.
    assert.equal(
      market.priceNumberToBn(price, false, true).toString(),
      new BN('12000411').toString()
    );
  });
});
