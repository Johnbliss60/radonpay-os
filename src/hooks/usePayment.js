import { useState } from "react";
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  async function pay({ destinationAddress, amount }) {
    setLoading(true);
    setTimeout(() => { setLoading(false); setResult({ success:true }); }, 1000);
  }
  return { pay, loading, error, result };
}
