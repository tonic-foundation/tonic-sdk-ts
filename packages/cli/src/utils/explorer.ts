import { NearEnv } from "@tonic-foundation/config";

export const getExplorerUrl = (env: NearEnv) => {
  if (env === 'testnet') {
    return 'https://testnet.nearblocks.io'
  }
  return 'https://nearblocks.io';
}