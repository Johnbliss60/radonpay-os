import { useState, useEffect } from "react";

export function useStreams() {
  const [streams, setStreams] = useState([
    { id:1, from:"Agent-7F2A", to:"DataFeed Pro",   amount:0.000015, rate:12, total:0.001823 },
    { id:2, from:"Agent-3B9C", to:"VectorSearch X", amount:0.000008, rate:7,  total:0.000944 },
    { id:3, from:"Agent-1D4E", to:"NLP Classifier", amount:0.000005, rate:21, total:0.003201 },
    { id:4, from:"Agent-8A1F", to:"ChainIndexer",   amount:0.000032, rate:4,  total:0.000512 },
  ]);
  const [grandTotal, setGrandTotal] = useState(0.012480);

  useEffect(() => {
    const t = setInterval(() => {
      setStreams(prev => prev.map(s => ({
        ...s,
        total: s.total + s.amount * s.rate * 0.1,
        rate: Math.max(1, s.rate + Math.floor(Math.random() * 3) - 1),
      })));
      setGrandTotal(g => g + 0.000051);
    }, 700);
    return () => clearInterval(t);
  }, []);

  return { streams, grandTotal };
}
