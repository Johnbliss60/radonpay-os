import { useState } from "react";
export function useWallet() {
  const [loading] = useState(false);
  const [error] = useState(null);
  return { wallets:[], balance:null, transactions:[], loading, error, activeWalletId:null };
}
