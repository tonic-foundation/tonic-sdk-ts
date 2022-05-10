// TODO: remove this file
import { TokenId } from './types';
import { TokenType } from './types/v1';

/**
 * internal use: remove ft: prefix from token IDs
 *
 * @ignore
 */
export function extractTokenContractId(tokenId: string): string {
  if (!tokenId.includes(':')) {
    return tokenId;
  }
  return tokenId.split(':')[1];
}

/**
 * internal use: add ft: prefix to token IDs, used only in createMarket
 *
 * TODO: remove when createMarket takes ft without prefix
 *
 * @ignore
 * @deprecated
 */
export function toInternalTokenId(token: string | TokenType): TokenId {
  if (typeof token === 'string') {
    if (token.toUpperCase() === 'NEAR' || token.startsWith('ft:')) {
      return token as TokenId;
    }
    return `ft:${token}`;
  } else {
    if (token.type === 'near') {
      return 'NEAR';
    } else if (token.type === 'ft') {
      return `ft:${token.account_id}`;
    } else {
      throw new Error('MFT unimplemented');
    }
  }
}

/**
 * internal use: get token ID from on-chain "token type" struct
 *
 * TODO: remove when the token type struct gets its own view method
 *
 * @ignore
 * @deprecated
 */
export function getTokenId(tokenType: TokenType): string {
  if (tokenType.type === 'near') {
    return 'NEAR';
  }
  return tokenType.account_id;
}
