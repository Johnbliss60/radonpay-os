const fs = require("fs");
let code = fs.readFileSync("App.jsx", "utf8");

const funcStart = code.indexOf("async function makeCirclePayment");
const funcEnd   = code.indexOf("// ── RECORD PAYMENT");

console.log("funcStart:", funcStart);
console.log("funcEnd:", funcEnd);

if (funcStart === -1 || funcEnd === -1) {
  console.log("ERROR: markers not found");
  process.exit(1);
}

const newFunc = [
  "async function makeCirclePayment(agent, api) {",
  "    try {",
  "      const res = await fetch('http://localhost:3001/agent/pay', {",
  "        method: 'POST',",
  "        headers: { 'Content-Type': 'application/json' },",
  "        body: JSON.stringify({ apiId: api.id, agentId: agent.id }),",
  "      });",
  "      const data = await res.json();",
  "      if (!res.ok || !data.success) {",
  "        console.error('x402 failed:', data.error);",
  "        return { success: false, error: data.error };",
  "      }",
  "      const payment = {",
  "        id:         data.txId || Math.random().toString(36),",
  "        agentId:    agent.id,",
  "        agentName:  agent.name,",
  "        agentColor: agent.color,",
  "        apiName:    data.apiName || api.name,",
  "        apiId:      api.id,",
  "        amount:     data.amount || api.pricePerCall,",
  "        timestamp:  Date.now(),",
  "        status:     'x402-settled',",
  "        txHash:     data.txId,",
  "      };",
  "      return { success: true, payment };",
  "    } catch(e) {",
  "      console.error('x402 error:', e.message);",
  "      return { success: false, error: e.message };",
  "    }",
  "  }",
  "",
  "  "
].join("\n");

code = code.slice(0, funcStart) + newFunc + code.slice(funcEnd);
fs.writeFileSync("App.jsx", code);

const verify = fs.readFileSync("App.jsx", "utf8");
console.log("Has agent/pay:", verify.includes("agent/pay"));
console.log("Has localhost:3001:", verify.includes("localhost:3001"));
console.log("Done");
