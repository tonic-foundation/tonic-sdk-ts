import { decimalToBn, functionCallWithOutcome } from '@tonic-foundation/utils';
import { storageDeposit, StorageDepositArgs } from '@tonic-foundation/storage';
import { ftTransferCall } from '@tonic-foundation/token';
import BN from 'bn.js';
import { Account } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';
import { BatchActionV1, PrepareBatch } from './batch';
import { getContract, TonicContract } from './contract';
import { Market } from './market';
import { extractTokenContractId, toInternalTokenId } from './token';
import {
  ExchangeBalances,
  MarketId,
  OpenLimitOrder,
  OrderId,
  Orderbook,
  toOpenLimitOrder,
  toOrderBook,
} from './types';
import {
  CreateMarketV1Params,
  MarketViewV1,
  NewOrderParamsV1,
  OpenLimitOrderV1,
  OrderResultV1,
  OrderbookViewV1,
  SwapParamsV1,
  ActionResultV1,
  FTMessage,
} from './types/v1';
import { groupOrdersByPriceLevel } from './util';

const ONE_TGAS = new BN(Math.pow(10, 12));
const MAX_GAS = tgasAmount(300);
const NEAR_DECIMALS = 24;

function tgasAmount(tgas: number) {
  return new BN(tgas).mul(ONE_TGAS);
}

function nearAmount(amount: number) {
  return decimalToBn(amount, NEAR_DECIMALS);
}

type PartialBy<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type AnyExcept<T = any, E = never> = T extends E ? never : T;

export class Tonic {
  private _contract: TonicContract;

  constructor(readonly account: Account, readonly contractId: string) {
    this._contract = getContract(account, contractId);
  }

  get contract() {
    return this._contract;
  }

  /**
   * This function calls a change method, returning both the return value of the
   * call and the execution outcome. Provide the `contractId` property to call a
   * different contract, defaults to the Tonic DEX.
   *
   * Many use cases need transaction/receipt IDs after calling a change
   * method, which makes the NEAR SDK's Contract class unsuitable.
   * https://github.com/near/near-api-js/blob/c84aef6cc18fe5ac1063411c95283ba3130fa656/src/contract.ts#L145
   */
  private async functionCallWithOutcome<T = any>(
    params: PartialBy<FunctionCallOptions, 'contractId'>
  ) {
    return await functionCallWithOutcome<T>(this.account, {
      contractId: this.contractId,
      ...params,
    });
  }

  /**
   * Execute batch actions. See the example in the "examples" directory for more
   * information.
   */
  async executeBatch(batch: PrepareBatch) {
    return await this.functionCallWithOutcome<ActionResultV1[]>({
      methodName: 'execute',
      args: {
        actions: batch.prepare(),
      },
      gas: tgasAmount(300),
      attachedDeposit: new BN(1),
    });
  }

  /**
   * Deposit NEAR for storage staking. We recommend depositing 0.1 NEAR at a
   * time to give users some room to place orders.
   *
   * Pass `amount` as a decimal amount of NEAR to deposit, eg, 0.1.
   *
   * Passing `registrationOnly` causes deposit in excess of the minimum required
   * balance to be refunded. The minimum balance is computed at runtime, so it's
   * recommended to pass at least 0.01 NEAR to avoid issues.
   *
   * The account to deposit for can be specified with `accountId`. Omit it to
   * deposit for the caller's account.
   */
  async storageDeposit(params: StorageDepositArgs) {
    return await storageDeposit(this.account, this.contractId, params);
  }

  /**
   * Create a market
   */
  async createMarket(params: {
    baseTokenId: string;
    quoteTokenId: string;
    baseTokenLotSize: string;
    quoteTokenLotSize: string;
    takerFeeBaseRate: number;
    makerRebateBaseRate: number;
  }) {
    const base_token = toInternalTokenId(params.baseTokenId);
    const quote_token = toInternalTokenId(params.quoteTokenId);
    const args: CreateMarketV1Params = {
      base_token,
      quote_token,
      base_token_lot_size: params.baseTokenLotSize,
      quote_token_lot_size: params.quoteTokenLotSize,
      taker_fee_base_rate: params.takerFeeBaseRate,
      maker_rebate_base_rate: params.makerRebateBaseRate,
    };

    return await this.functionCallWithOutcome<MarketId>({
      methodName: 'create_market',
      args: { args },
      gas: MAX_GAS,
      attachedDeposit: nearAmount(0.1),
    });
  }

  /**
   * Place an order. This is a relatively low-level method that works with
   * lot-aware values. Client applications may use Market.placeOrder instead for
   * a higher-level interface.
   */
  async placeOrder(market_id: MarketId, order: NewOrderParamsV1) {
    const { response: r, executionOutcome } =
      await this.functionCallWithOutcome<OrderResultV1>({
        methodName: 'new_order',
        args: {
          market_id,
          order: prepareNewOrderV1(order),
        },
        gas: MAX_GAS,
      });

    return {
      response: {
        id: r.id,
        outcome: r.outcome,
        open_quantity: new BN(r.open_quantity),
        base_fill_quantity: new BN(r.base_fill_quantity),
        quote_fill_quantity: new BN(r.quote_fill_quantity),
        base_cancelled_quantity: new BN(r.base_cancelled_quantity),
      } as OrderResultV1,
      executionOutcome,
    };
  }

  /**
   * Cancel an order.
   */
  async cancelOrder(market_id: MarketId, order_id: OrderId) {
    return await this.functionCallWithOutcome<unknown>({
      methodName: 'cancel_order',
      args: { market_id, order_id },
      gas: tgasAmount(100),
    });
  }

  /**
   * Cancel multiple orders in a market. Use Tonic.executeBatch
   * to cancel orders in multiple markets.
   */
  async cancelOrders(marketId: MarketId, orderIds: OrderId[]) {
    const batch = new BatchActionV1();
    batch.cancelOrdersV1(marketId, orderIds);
    return await this.executeBatch(batch);
  }

  /**
   * Cancel all orders in a market.
   */
  async cancelAllOrders(market_id: MarketId) {
    return await this.functionCallWithOutcome<unknown>({
      methodName: 'cancel_all_orders',
      args: { market_id },
      gas: MAX_GAS,
    });
  }

  /**
   * Deposit NEP 141 tokens or native NEAR. For native NEAR, the `tokenId` must
   * be 'NEAR'.
   *
   * The amount must be decimal-aware, eg, to deposit 1 NEAR (24 decimals), use
   *
   * ```
   * import { decimalToBn } from '@tonic-foundation/utils';
   * // Deposit 1 NEAR
   * tonic.deposit('NEAR', decimalToBn(1, 24))
   * // Deposit 1 USDC
   * tonic.deposit('usdc.example.testnet', decimalToBn(1, 6))
   * ```
   */
  async deposit(tokenId: string, amount: BN) {
    if (tokenId.toUpperCase() === 'NEAR') {
      return await this.depositNear(amount);
    } else {
      return this.depositFt(tokenId, amount);
    }
  }

  /**
   * Deposit NEP-141 token.
   */
  async depositFt(
    tokenId: string,
    amount: BN,
    msg?: AnyExcept<FTMessage, string>
  ) {
    return await ftTransferCall(this.account, tokenId, {
      receiverId: this.contractId,
      amount,
      msg,
    });
  }

  async swap(tokenId: string, amount: BN, params: SwapParamsV1) {
    return await this.depositFt(tokenId, amount, params);
  }

  /**
   * Deposit native NEAR.
   */
  async depositNear(amount: BN) {
    return await this.functionCallWithOutcome({
      methodName: 'deposit_near',
      args: {},
      attachedDeposit: amount,
      gas: MAX_GAS,
    });
  }

  /**
   * Withdraw NEP 141 tokens or native NEAR. For native NEAR, the `tokenId` must
   * be 'NEAR'.
   *
   * The amount must be decimal-aware, eg,
   *
   * ```
   * import { decimalToBn } from '@tonic-foundation/utils';
   * // Withdraw 1 NEAR
   * tonic.withdraw('NEAR', decimalToBn(1, 24))
   * // Withdraw 1 USDC
   * tonic.withdraw('usdc.example.testnet', decimalToBn(1, 6))
   * ```
   */
  async withdraw(tokenId: string, amount: BN) {
    if (tokenId.toUpperCase() === 'NEAR') {
      return await this.withdrawNear(amount);
    } else {
      return this.withdrawFt(tokenId, amount);
    }
  }

  async withdrawFt(tokenId: string, amount: BN) {
    return this.functionCallWithOutcome({
      methodName: 'withdraw_ft',
      args: {
        token: tokenId,
        amount: amount.toString(),
      },
      gas: MAX_GAS,
      attachedDeposit: new BN(1),
    });
  }

  async withdrawNear(amount: BN) {
    return this.functionCallWithOutcome({
      methodName: 'withdraw_near',
      args: {
        amount: amount.toString(),
      },
      gas: MAX_GAS,
      attachedDeposit: new BN(1),
    });
  }

  /**
   * Get the orderbook. Orders are returned with decimals (eg, 1 USDC is
   * returned as 1000000). The format of each order is [price, open quantity].
   *
   * @param market_id
   * @param depth Number of price levels to fetch, default 12
   * @returns
   */
  async getOrderbook(market_id: MarketId, depth = 12): Promise<Orderbook> {
    const view = await this._contract.get_orderbook<OrderbookViewV1>({
      market_id,
      depth,
    });
    const { bids, asks } = toOrderBook(view);

    return {
      bids: groupOrdersByPriceLevel(bids),
      asks: groupOrdersByPriceLevel(asks),
    };
  }

  async getOpenOrders(market_id: MarketId): Promise<OpenLimitOrder[]> {
    const raw = await this._contract.get_open_orders<OpenLimitOrderV1[]>({
      market_id,
      account_id: this.account.accountId,
    });
    return raw.map(toOpenLimitOrder);
  }

  async getOrder(
    market_id: MarketId,
    order_id: string
  ): Promise<OpenLimitOrder | null> {
    const raw = await this._contract.get_order<OpenLimitOrderV1>({
      market_id,
      order_id,
    });
    if (!raw) {
      return null;
    }
    return toOpenLimitOrder(raw);
  }

  async getMarket(marketId: MarketId): Promise<Market> {
    return await Market.load(this, marketId, this.contractId);
  }

  /**
   * List markets in order of creation.
   */
  async listMarkets(offset = 0, limit = 100): Promise<MarketViewV1[]> {
    return await this.contract.list_markets({ from_index: offset, limit });
  }

  /**
   * Return available exchange balances with decimals as a map of { tokenId =>
   * balance }. "Available balance" is balance not currently locked in an open
   * order. For example, an account with 1 USDC available would see
   *
   * ```
   * await tonic.getBalances() // { usdc.example.testnet: BN<1000000> }
   * ```
   */
  async getBalances(): Promise<ExchangeBalances> {
    const ret: ExchangeBalances = {};
    const rawBalances: Array<[string, string]> =
      await this._contract.get_balances({
        account_id: this.account.accountId,
      });
    rawBalances.forEach(([token_id, amount]) => {
      ret[extractTokenContractId(token_id)] = new BN(amount);
    });

    return ret;
  }
}

export function prepareNewOrderV1(params: NewOrderParamsV1): NewOrderParamsV1 {
  return {
    ...params,
    max_spend: params.max_spend?.toString(),
    limit_price: params.limit_price?.toString(),
    quantity: params.quantity.toString(),
  };
}
