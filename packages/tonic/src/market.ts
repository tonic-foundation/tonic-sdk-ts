import {
  bnToApproximateDecimal,
  decimalToBn,
  floorToBn,
} from '@tonic-foundation/utils';
import BN from 'bn.js';
import { prepareNewOrderV1 } from '.';
import { BatchActionV1, PrepareBatch } from './batch';
import { getTokenId } from './token';
import { Tonic } from './tonic';
import { L2Order, Orderbook, OrderSide, OrderType } from './types';
import {
  ActionV1,
  MarketViewV1,
  NewOrderParamsV1,
  TokenType,
} from './types/v1';

export interface NewOrderParams {
  orderType: OrderType;
  side: OrderSide;
  // Price as a human-readable number. Unused in market orders.
  limitPrice?: number;
  // Size of order as a human-readable number.
  quantity: number;
  maxSpend?: number;
  clientId?: number;
}

/** L2 Order with BN values converted to decimal numbers */
export type NumberL2Order = readonly [number, number];
export interface NumberOrderbook {
  asks: NumberL2Order[];
  bids: NumberL2Order[];
}

export function getMidmarketPriceNumber({
  bids,
  asks,
}: NumberOrderbook): number | undefined {
  if (asks.length && bids.length) {
    const bestAsk = asks[asks.length - 1][0];
    const bestBid = bids[0][0];
    return (bestAsk + bestBid) / 2;
  } else if (asks.length) {
    const bestAsk = asks[asks.length - 1][0];
    return bestAsk;
  } else if (bids.length) {
    const bestBid = bids[0][0];
    return bestBid;
  }
  return;
}

export class MarketBatchAction implements PrepareBatch {
  batch: BatchActionV1;

  constructor(private readonly market: Market) {
    this.batch = new BatchActionV1();
  }

  newOrder(params: NewOrderParams) {
    this.batch.newOrderV1(
      this.market.id,
      this.market.toNewOrderParamsV1(params)
    );
    return this;
  }

  cancelOrders(orderIds: string[]) {
    this.batch.cancelOrdersV1(this.market.id, orderIds);
    return this;
  }

  cancelAllOrders() {
    this.batch.cancelAllOrdersV1(this.market.id);
    return this;
  }

  prepare(): ActionV1[] {
    return this.batch.prepare();
  }
}

export class Market {
  readonly baseLotSize: number;
  readonly baseDecimals: number;
  readonly quoteLotSize: number;
  readonly quoteDecimals: number;

  constructor(
    private readonly tonic: Tonic,
    readonly id: string,
    private readonly _inner: MarketViewV1
  ) {
    this.baseLotSize = _inner.base_token.lot_size;
    this.baseDecimals = _inner.base_token.decimals;
    this.quoteLotSize = _inner.quote_token.lot_size;
    this.quoteDecimals = _inner.quote_token.decimals;
  }

  static async load(tonic: Tonic, id: string, contractId: string) {
    const view: MarketViewV1 = await tonic.account.viewFunction(
      contractId,
      'get_market',
      {
        market_id: id,
      }
    );

    if (!view) {
      throw new Error('market not found');
    }

    return new Market(tonic, id, view);
  }

  /**
   * @ignore
   */
  get inner(): MarketViewV1 {
    return this._inner;
  }

  /**
   * Base taker fee rate in basis points
   */
  get takerFeeBaseRate(): number {
    return this._inner.taker_fee_base_rate;
  }

  /**
   * Net taker fees accrued in the market (does not include maker/referrer
   * rebates)
   */
  get feesAccrued(): BN {
    return new BN(this._inner.fees_accrued);
  }

  /**
   * Base maker rebate rate in basis points
   */
  get makerRebateBaseRate(): number {
    return this._inner.maker_rebate_base_rate;
  }

  /**
   * Maximum number of allowed open orders per user account.
   */
   get maxOrdersPerAccount(): number {
    return this._inner.max_orders_per_account;
  }

  /**
   * Current number of open orders on the market (buys + sells).
   */
   get totalOpenOrders(): number {
    return this._inner.total_orders;
  }

  get baseTokenId(): string {
    return getTokenId(this._inner.base_token.token_type);
  }

  get quoteTokenId(): string {
    return getTokenId(this._inner.quote_token.token_type);
  }

  get baseTokenType(): TokenType {
    return this._inner.base_token.token_type;
  }

  get quoteTokenType(): TokenType {
    return this._inner.quote_token.token_type;
  }

  /**
   * Get minimum price tick as a human readable number.
   */
  get priceTick(): number {
    return this.priceBnToNumber(new BN(this.quoteLotSize));
  }

  /**
   * Get minimum quantity tick as a human readable number.
   */
  get quantityTick(): number {
    return this.quantityBnToNumber(new BN(this.baseLotSize));
  }

  /**
   * For internal use
   * @ignore
   */
  toNewOrderParamsV1(params: NewOrderParams): NewOrderParamsV1 {
    const order = {
      order_type: params.orderType,
      side: params.side,
      limit_price: params.limitPrice
        ? this.priceNumberToBn(params.limitPrice)
        : undefined,
      quantity: this.quantityNumberToBn(params.quantity),
      max_spend: params.maxSpend
        ? this.priceNumberToBn(params.maxSpend, false, false)
        : undefined,
      client_id:
        typeof params.clientId === 'undefined' ? null : params.clientId, // potentially 0
    };
    return prepareNewOrderV1(order);
  }

  async placeOrder(params: NewOrderParams) {
    return this.tonic.placeOrder(this.id, this.toNewOrderParamsV1(params));
  }

  /**
   * Same as Tonic.getOrderbook
   */
  async getOrderbookRaw(depth?: number): Promise<Orderbook> {
    return this.tonic.getOrderbook(this.id, depth);
  }

  /**
   * Return the orderbook with prices and quantities converted to human-readable numbers,
   * eg, an order for 0.1 BTC @ 54321.00 USDC will be returned as [54321, 01].
   */
  async getOrderbook(depth?: number): Promise<NumberOrderbook> {
    const orderbook = await this.tonic.getOrderbook(this.id, depth);
    return this.withNumberValues(orderbook);
  }

  /** @ignore */
  toNumberL2Order(order: L2Order): NumberL2Order {
    return [
      this.priceBnToNumber(order[0]),
      this.quantityBnToNumber(order[1]),
    ] as const;
  }

  /** @ignore */
  withNumberValues(orderbook: Orderbook): NumberOrderbook {
    // give access to `this` inside the mapped function
    const asks = orderbook.asks.map(this.toNumberL2Order, this);
    const bids = orderbook.bids.map(this.toNumberL2Order, this);

    return { bids, asks };
  }

  createBatchAction(): MarketBatchAction {
    return new MarketBatchAction(this);
  }

  /**
   * Given price as a number, return a decimal-padded BN optionally floored to
   * the nearest quote lot size.
   *
   * If round_trailing_decimals_up===true, the least
   * significant digit + trailing digits are rounded up their ceiling.
   */
  priceNumberToBn(price: number, floor = true, round_trailing_decimals_up = false): BN {
    let decimals = this.quoteDecimals;
    let priceBn = decimalToBn(price, decimals);

    if (round_trailing_decimals_up && decimals < 16) {
      // Compare BNs at the highest level of precision available
      // provided by 'number' type (16 digits after decimal point).
      let preciseBn = decimalToBn(price, 16);
      let power = new BN(10).pow(new BN((16 - decimals)));
      if (priceBn.mul(power).lt(preciseBn)) {
        priceBn = priceBn.add(new BN(1));
      }
    }

    if (floor) {
      return floorToBn(priceBn, new BN(this.quoteLotSize));
    }
    return priceBn;
  }

  /**
   * Given price as a number, return an equivalent BN of lots.
   */
  priceNumberToBnLots(price: number, floor = true): BN {
    const priceBn = this.priceNumberToBn(price, floor);
    return priceBn.div(new BN(this.quoteLotSize));
  }

  /**
   * Given price as a decimal-padded BN, return a decimal.
   */
  priceBnToNumber(price: BN, precision?: number): number {
    return bnToApproximateDecimal(price, this.quoteDecimals, precision);
  }

  /**
   * Given order size as a number, return a decimal-padded BN optionally floored
   * to the nearest base lot size.
   */
  quantityNumberToBn(quantity: number, floor = true): BN {
    const qtyBn = decimalToBn(quantity, this.baseDecimals);
    if (floor) {
      return floorToBn(qtyBn, new BN(this.baseLotSize));
    }
    return qtyBn;
  }

  /**
   * Given order size as a number, return an equivalent BN of lots.
   */
  quantityNumberToBnLots(quantity: number, floor = true): BN {
    const qtyBn = this.quantityNumberToBn(quantity, floor);
    return qtyBn.div(new BN(this.baseLotSize));
  }

  /**
   * Given quantity as a decimal-padded BN, return a decimal.
   */
  quantityBnToNumber(quantity: BN, precision?: number): number {
    return bnToApproximateDecimal(quantity, this.baseDecimals, precision);
  }
}
