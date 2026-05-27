import { useState, useEffect } from "react";
import Card from "../../components/Card";
import Dot from "../../components/Dot";

const API_KEY = import.meta.env.VITE_CIRCLE_API_KEY;
const WALLET_ID = import.meta.env.VITE_CIRCLE_WALLET_ID;
const ADDRESS = import.meta.env.VITE_WALLET_ADDRESS;

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const url =
          "https://api.circle.com/v1/w3s/wallets/" +
          WALLET_ID +
          "/balances";

        const res = await fetch(url, {
          headers: {
            Authorization: "Bearer " + API_KEY,
          },
        });

        const data = await res.json();

        const usdc = data.data.tokenBalances.find((t) => {
          return t.token.symbol === "USDC";
        });

        setBalance(usdc ? usdc.amount : "0");
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();

    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, []);

  const balanceDisplay = loading
    ? "Loading..."
    : error
    ? "Error: " + error
    : "$" + parseFloat(balance).toFixed(6);

  const shortAddress = ADDRESS
    ? ADDRESS.slice(0, 10) + "..." + ADDRESS.slice(-6)
    : "Not set";

  const explorerUrl =
    "https://sepolia.etherscan.io/address/" + ADDRESS;

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#f0eeff",
            fontFamily: "Georgia, serif",
            marginBottom: 4,
          }}
        >
          Gateway Wallet
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#6b6b8a",
          }}
        >
          Unified crosschain USDC. Batch settle. Zero gas.
        </div>
      </div>

      {/* BALANCE CARD */}
      <div
        style={{
          padding: "22px 20px",
          borderRadius: 12,
          marginBottom: 14,
          background:
            "linear-gradient(135deg,#0d0d22,#14082a)",
          border: "1px solid #ff3cac33",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#6b6b8a",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Available Balance
        </div>

        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            fontFamily: "monospace",
            color: "#f0eeff",
          }}
        >
          {balanceDisplay}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#6b6b8a",
            marginTop: 8,
          }}
        >
          USDC · ETH-SEPOLIA
        </div>
      </div>

      {/* INFO GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {/* WALLET ADDRESS */}
        <Card style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b6b8a",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Wallet Address
          </div>

          <div
            style={{
              fontSize: 10,
              color: "#00d4ff",
              fontFamily: "monospace",
            }}
          >
            {shortAddress}
          </div>
        </Card>

        {/* NETWORK */}
        <Card style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b6b8a",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Network
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Dot color="#00d4ff" size={7} />

            <span
              style={{
                fontSize: 13,
                color: "#00d4ff",
                fontFamily: "monospace",
              }}
            >
              ETH-SEPOLIA
            </span>
          </div>
        </Card>

        {/* GAS FEES */}
        <Card style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b6b8a",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Gas Fees
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#ffd166",
              fontFamily: "monospace",
            }}
          >
            $0.00
          </div>
        </Card>

        {/* STATUS */}
        <Card style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 10,
              color: "#6b6b8a",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Status
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Dot color="#00d4ff" size={7} />

            <span
              style={{
                fontSize: 13,
                color: "#00d4ff",
                fontFamily: "monospace",
              }}
            >
              ACTIVE
            </span>
          </div>
        </Card>
      </div>

      {/* EXPLORER BUTTON */}
      <Card
        style={{
          padding: "16px 18px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#6b6b8a",
            marginBottom: 8,
          }}
        >
          View on Sepolia Explorer
        </div>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "8px 20px",
            background:
              "linear-gradient(135deg,#7b2fff,#ff3cac)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
            fontFamily: "monospace",
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          VIEW ON ETHERSCAN
        </a>
      </Card>
    </div>
  );
}