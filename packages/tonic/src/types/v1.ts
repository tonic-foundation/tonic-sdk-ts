/**
 * These are views as returned by the orderbook-v1 contract.
 */
import BN from 'bn.js';

/**
 * "NEAR" (for native NEAR) or token contract ID with a prefix (for FT/MFTs)
 *
 * for FT, the prefix is "ft:", eg, "ft:usdc.example"
 * for MFT, the prefix is "mft:", eg, "mft:usdc.example"
 */
export type TokenId = 'NEAR' | PrefixedTokenId;
/**
 * Token ID
 */
export type PrefixedTokenId = `ft:${string}`;

/**
 * Batch action
 */
export type ActionV1 =
  | NewOrderActionV1
  | CancelOrdersActionV1
  | CancelAllOrdersActionV1;

export interface NewOrderActionV1 {
  action: 'NewOrder';
  params: {
    market_id: string;
    params: NewOrderParamsV1;
  };
}

export interface CancelOrdersActionV1 {
  action: 'CancelOrders';
  params: {
    market_id: string;
    order_ids: string[];
  };
}

export interface CancelAllOrdersActionV1 {
  action: 'CancelAllOrders';
  params: {
    market_id: string;
  };
}

/**
 * Result of a batch action
 */
export type ActionResultV1 =
  | { cancelled: string[] }
  | { placed: OrderResultV1 };

/**
 * Represents the immediate outcome of placing an order.
 */
export type OrderOutcomeV1 =
  /**
   * Order was completely filled
   */
  | 'Filled'
  /**
   * Order was partially filled. The rest may be open or cancelled depending on
   * order settings.
   */
  | 'PartialFill'
  /**
   * The order was completely cancelled. Nothing was filled.
   */
  | 'Cancelled'
  /**
   * The order was not processable by the matching engine. This can occur when
   * placing a PostOnly order that would cross the spread.
   */
  | 'Rejected'
  /**
   * The order was posted to the order in its full amount. Nothing was filled or
   * cancelled.
   */
  | 'Posted';

/**
 * @ignore
 */
export type OrderSideV1 = 'Buy' | 'Sell';
/**
 * @ignore
 */
export type OrderTypeV1 = 'Limit' | 'PostOnly' | 'Market';

/**
 * On-chain data type
 */
export interface SwapParamsV1 {
  type: 'Swap';
  market_id: string;
  side: OrderSideV1;
  min_output_token?: BN;
}

/**
 * On-chain data type
 */
export interface OrderResultV1 {
  /**
   * Order ID
   */
  id: string;

  /**
   * Order outcome
   */
  outcome: OrderOutcomeV1;

  /**
   * Amount of base token immediately traded
   */
  base_fill_quantity: BN;

  /**
   * Amount of quote token immediately traded
   */
  quote_fill_quantity: BN;

  /**
   * Amount of base quantity open
   */
  open_quantity: BN;

  /**
   * Amount of base quantity cancelled due to self-trade
   */
  base_cancelled_quantity: BN;
}

export type FTMessage = { "action": "Swap", params: SwapParamsV1[] } | never;

/**
 * On-chain data type.
 *
 * @ignore
 */
export interface CreateMarketV1Params {
  base_token: TokenId;
  quote_token: TokenId;
  base_token_lot_size: string;
  quote_token_lot_size: string;
  taker_fee_base_rate: number;
  maker_rebate_base_rate: number;
}

/**
 * On-chain data type. Client applications should import NewOrderParams instead.
 */
export interface NewOrderParamsV1 {
  limit_price: BN | string | undefined;
  quantity: BN | string;
  max_spend?: BN | string;
  side: OrderSideV1;
  order_type: OrderTypeV1;
  client_id: number | null;
  referrer_id?: string;
}

/**
 * On-chain data type
 *
 * @ignore
 */
export interface OrderbookViewV1 {
  bids: L2OpenLimitOrderV1[];
  asks: L2OpenLimitOrderV1[];
}

/**
 * On-chain data type
 *
 * @ignore
 */
export interface OpenLimitOrderV1 {
  id: string;
  limit_price: string;
  open_qty: string;
  original_qty: string;
  timestamp: number;
  side: OrderSideV1;
  client_id: number | null;
}

/**
 * On-chain data type
 *
 * Limit orders as returned by the get_market view.
 *
 * @ignore
 */
export interface L2OpenLimitOrderV1 {
  /**
   * Limit price with decimals
   */
  limit_price: string;

  /**
   * Open quantity with decimals
   */
  open_quantity: string;
}

/**
 * On-chain data type
 *
 * @ignore
 */
export interface MarketViewV1 {
  id: string;
  base_token: TokenInfo;
  quote_token: TokenInfo;
  orderbook: OrderbookViewV1;
  maker_rebate_base_rate: number;
  taker_fee_base_rate: number;
  fees_accrued: string;
  max_orders_per_account: number;
  total_orders: number;
}

/**
 * On-chain data type, should never be seen by an implementer.
 *
 * TODO: remove when that's the case
 *
 * @ignore
 */
export interface TokenInfo {
  token_type: TokenType;
  lot_size: number;
  decimals: number;
}

/**
 * On-chain data type, should never be seen by an implementer.
 *
 * TODO: remove when that's the case
 *
 * @ignore
 * @deprecated
 */
export type TokenType =
  | { type: 'near' }
  | {
    type: 'ft';
    account_id: string;
  }
  | {
    type: 'mft';
    account_id: string;
    subtoken_id: string;
  };
