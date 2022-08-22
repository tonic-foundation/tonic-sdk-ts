import { decimalToBn } from '@tonic-foundation/utils';
import BN from 'bn.js';
import { Contract } from 'near-api-js';
import { Orderbook } from '..';

import { L2Order } from '../types';

export const ZERO = new BN('0');

export const ONE_TGAS = new BN(Math.pow(10, 12));
export const NEAR_DECIMALS = 24;

export function nearAmount(amount: number) {
  return decimalToBn(amount, NEAR_DECIMALS);
}

export type PartialBy<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type AnyExcept<T = any, E = never> = T extends E ? never : T;

export type ContractWithMethods<
  V extends ReadonlyArray<string> = [],
  C extends ReadonlyArray<string> = []
> = Contract & {
  [k in V[number]]: (...args: any[]) => any;
} & {
  [k in C[number]]: (...args: any[]) => any;
};

export function groupOrdersByPriceLevel(orders: L2Order[]) {
  return orders.reduce((acc, curr) => {
    if (!acc.length) {
      return [curr];
    }
    const [prev] = acc.slice(-1);
    const [prevPrice, prevSize] = prev;
    const [currPrice, currSize] = curr;
    if (prevPrice.eq(currPrice)) {
      return [
        ...acc.slice(0, -1),
        [prevPrice, prevSize.add(currSize)] as L2Order,
      ];
    }
    return [...acc, curr];
  }, [] as L2Order[]);
}

/**
 * Compute the midmarket price of an orderbook. Price is undefined if only one
 * side has open orders.
 */
export function getMidmarketPrice({ asks, bids }: Orderbook): BN | undefined {
  if (asks.length && bids.length) {
    const bestAsk = asks[asks.length - 1][0];
    const bestBid = bids[0][0];
    const midmarketPrice = bestAsk.add(bestBid).divn(2);
    return midmarketPrice;
  } else if (asks.length) {
    const bestAsk = asks[asks.length - 1][0];
    return bestAsk;
  } else if (bids.length) {
    const bestBid = bids[0][0];
    return bestBid;
  }
  return;
}
