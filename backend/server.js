const express    = require("express");
const cors       = require("cors");
const forge      = require("node-forge");
const axios      = require("axios");
const crypto     = require("crypto");
require("dotenv").config({ path:"../.env" });

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY       = process.env.VITE_CIRCLE_API_KEY;
const WALLET_ID     = process.env.VITE_CIRCLE_WALLET_ID;
const ENTITY_SECRET = process.env.VITE_ENTITY_SECRET;
const REAL_WALLET   = process.env.VITE_WALLET_ADDRESS;

console.log("API_KEY:       ", API_KEY       ? "YES" : "MISSING");
console.log("WALLET_ID:     ", WALLET_ID     ? "YES" : "MISSING");
console.log("ENTITY_SECRET: ", ENTITY_SECRET ? "YES" : "MISSING");
console.log("REAL_WALLET:   ", REAL_WALLET   ? REAL_WALLET : "MISSING");

async function getCiphertext() {
  const res = await axios.get(
    "https://api.circle.com/v1/w3s/config/entity/publicKey",
    { headers:{ Authorization:"Bearer " + API_KEY } }
  );
  const pubKey = forge.pki.publicKeyFromPem(res.data.data.publicKey);
  return forge.util.encode64(
    pubKey.encrypt(
      forge.util.hexToBytes(ENTITY_SECRET),
      "RSA-OAEP",
      { md: forge.md.sha256.create() }
    )
  );
}

app.get("/health", (req, res) => {
  res.json({ status:"ok", wallet: WALLET_ID?.slice(0,8)+"..." });
});

app.get("/balance", async (req, res) => {
  try {
    const r = await axios.get(
      "https://api.circle.com/v1/w3s/wallets/" + WALLET_ID + "/balances",
      { headers:{ Authorization:"Bearer " + API_KEY } }
    );
    const balances = r.data.data?.tokenBalances || [];
    const usdc = balances.find(t => t.token.symbol === "USDC");
    const eth  = balances.find(t => t.token.symbol === "ETH-SEPOLIA" || t.token.symbol === "ETH");
    res.json({
      usdc: usdc ? usdc.amount : "0",
      eth:  eth  ? eth.amount  : "0",
    });
  } catch(e) {
    res.status(500).json({ error:e.message });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const r = await axios.get(
      "https://api.circle.com/v1/w3s/transactions?walletIds=" + WALLET_ID + "&pageSize=20",
      { headers:{ Authorization:"Bearer " + API_KEY } }
    );
    res.json({ transactions: r.data.data?.transactions || [] });
  } catch(e) {
    res.status(500).json({ error:e.message });
  }
});

// ── REAL USDC SEND ─────────────────────────────────────────────────────────
app.post("/send", async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = parseFloat(amount);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error:"Invalid amount" });
    }

    // Always send to your own wallet — USDC loops back
    // This proves real deduction. In production use actual seller address.
    const destination = REAL_WALLET;

    console.log("══ REAL PAYMENT ══════════════════════");
    console.log("Amount:     ", amt, "USDC");
    console.log("To:         ", destination);

    const ciphertext     = await getCiphertext();
    const idempotencyKey = crypto.randomUUID();

    const r = await axios.post(
      "https://api.circle.com/v1/w3s/developer/transactions/transfer",
      {
        idempotencyKey,
        entitySecretCiphertext: ciphertext,
        walletId:               WALLET_ID,
        destinationAddress:     destination,
        amounts:                [amt.toFixed(6)],
        feeLevel:               "MEDIUM",
        blockchain:             "ETH-SEPOLIA",
      },
      { headers:{ Authorization:"Bearer " + API_KEY, "Content-Type":"application/json" } }
    );

    console.log("TX ID:      ", r.data.data?.id);
    console.log("State:      ", r.data.data?.state);
    console.log("══════════════════════════════════════");

    res.json({ success:true, data:r.data.data });
  } catch(e) {
    console.error("SEND ERROR:", e.response?.data || e.message);
    res.status(500).json({
      error: e.response?.data?.message || e.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log("══════════════════════════════════════");
  console.log("RadonPay backend on port " + PORT);
  console.log("Real wallet: " + REAL_WALLET);
  console.log("══════════════════════════════════════");
});