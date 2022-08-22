/**
 * Helper functions for creating ready-to-sign transactions.
 */
import { MAX_GAS, tgasAmount } from '@tonic-foundation/utils';
import BN from 'bn.js';
import { FunctionCallOptions as NearApiJsFunctionCall } from 'near-api-js/lib/account';
import { PrepareBatch } from './batch';
import { toInternalTokenId } from './token';
import { CreateMarketV1Params, NewOrderParamsV1 } from './types/v1';
import { nearAmount, PartialBy } from './util';
import { StandardNearFunctionCall } from '@tonic-foundation/transaction/lib/shim';
import { MarketId } from './types';

export function prepareNewOrderV1(params: NewOrderParamsV1): NewOrderParamsV1 {
  return {
    ...params,
    max_spend: params.max_spend?.toString(),
    limit_price: params.limit_price?.toString(),
    quantity: params.quantity.toString(),
  };
}

export type ImplicitContractFunctionCallParams = PartialBy<
  NearApiJsFunctionCall,
  'contractId'
>;

export function batchV1(contractId: string, batch: PrepareBatch) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'execute',
    args: {
      actions: batch.prepare(),
    },
    gas: tgasAmount(300),
    attachedDeposit: new BN(1),
  });
}

export function createMarketV1(
  contractId: string,
  params: {
    baseTokenId: string;
    quoteTokenId: string;
    baseTokenLotSize: string;
    quoteTokenLotSize: string;
    takerFeeBaseRate: number;
    makerRebateBaseRate: number;
  }
) {
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

  return new StandardNearFunctionCall({
    contractId,
    methodName: 'create_market',
    args: { args },
    gas: MAX_GAS,
    attachedDeposit: nearAmount(0.1),
  });
}

export function placeOrderV1(
  contractId: string,
  market_id: MarketId,
  order: NewOrderParamsV1
) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'new_order',
    args: {
      market_id,
      order: prepareNewOrderV1(order),
    },
    gas: MAX_GAS,
  });
}

export function cancelOrderV1(
  contractId: string,
  market_id: string,
  order_id: string
) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'cancel_order',
    args: {
      market_id,
      order_id,
    },
    gas: tgasAmount(100),
  });
}

export function cancelAllOrdersV1(contractId: string, market_id: string) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'cancel_all_orders',
    args: { market_id },
    gas: MAX_GAS,
  });
}

export function withdrawNearV1(contractId: string, amount: BN) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'withdraw_near',
    args: {
      amount: amount.toString(),
    },
    gas: MAX_GAS,
    attachedDeposit: new BN(1),
  });
}

export function withdrawFtV1(contractId: string, tokenId: string, amount: BN) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'withdraw_ft',
    args: {
      token: tokenId,
      amount: amount.toString(),
    },
    gas: MAX_GAS,
    attachedDeposit: new BN(1),
  });
}

export function withdrawV1(contractId: string, tokenId: string, amount: BN) {
  if (tokenId.toUpperCase() === 'NEAR') {
    return withdrawNearV1(contractId, amount);
  } else {
    return withdrawFtV1(contractId, tokenId, amount);
  }
}

export function depositNearV1(contractId: string, amount: BN) {
  return new StandardNearFunctionCall({
    contractId,
    methodName: 'deposit_near',
    args: {},
    attachedDeposit: amount,
    gas: MAX_GAS,
  });
}
