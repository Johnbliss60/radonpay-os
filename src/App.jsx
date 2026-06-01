import { useState, useEffect, useRef, useCallback } from "react";

// ── THEMES ─────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#04040a", bg2:"#09090f", bg3:"#0e0e18",
  border:"#1e1e32", border2:"#2a2a45",
  text:"#f0eeff", text2:"#9999bb", muted:"#55556a",
  accent:"#ff3cac", purple:"#7b2fff", cyan:"#00d4ff",
  gold:"#ffd166", success:"#00cc66", danger:"#ff4444",
  card:"#09090f", nav:"#04040af5", input:"#0e0e18",
};
const LIGHT = {
  bg:"#f4f3ff", bg2:"#ffffff", bg3:"#eeeeff",
  border:"#d8d8f0", border2:"#c0c0e0",
  text:"#0d0d1f", text2:"#44446a", muted:"#8888aa",
  accent:"#cc0088", purple:"#6600ee", cyan:"#0099cc",
  gold:"#cc8800", success:"#008844", danger:"#cc2222",
  card:"#ffffff", nav:"#fffffff5", input:"#f0f0ff",
};

// ── CIRCLE API ─────────────────────────────────────────────────────────────
const API_KEY   = typeof window !== "undefined" ? (window.__ENV__?.VITE_CIRCLE_API_KEY   || import.meta.env.VITE_CIRCLE_API_KEY)   : "";
const WALLET_ID = typeof window !== "undefined" ? (window.__ENV__?.VITE_CIRCLE_WALLET_ID || import.meta.env.VITE_CIRCLE_WALLET_ID) : "";
const ADDRESS   = typeof window !== "undefined" ? (window.__ENV__?.VITE_WALLET_ADDRESS   || import.meta.env.VITE_WALLET_ADDRESS)   : "";
const WALLET_SET_ID = typeof window !== "undefined" ? (window.__ENV__?.VITE_CIRCLE_WALLET_SET_ID || import.meta.env.VITE_CIRCLE_WALLET_SET_ID) : "";

async function circleGet(path) {
  const r = await fetch("https://api.circle.com" + path, {
    headers: { Authorization: "Bearer " + API_KEY, "Content-Type": "application/json" },
  });
  return r.json();
}

async function circlePost(path, body) {
  const r = await fetch("https://api.circle.com" + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function fetchBalance() {
  try {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    const res = await fetch(BACKEND + "/balance");
    const data = await res.json();
    return parseFloat(data.usdc || 0);
  } catch { return 60.0; }
}

async function fetchTransactions() {
  try {
    const d = await circleGet("/v1/w3s/transactions?walletIds=" + WALLET_ID + "&pageSize=20");
    return d.data?.transactions || [];
  } catch { return []; }
}

// ── MARKETPLACE APIs ───────────────────────────────────────────────────────
const APIS = [
  { id:1, name:"DataFeed Pro",   cat:"Data",  pricePerCall:0.000015, chain:"ETH",  address:"0x1234567890123456789012345678901234567890", calls:14820, rating:4.9, hot:true,  desc:"Real-time market data feeds." },
  { id:2, name:"VectorSearch X", cat:"AI",    pricePerCall:0.000008, chain:"SOL",  address:"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", calls:9340,  rating:4.7, hot:false, desc:"Semantic search across 1B+ vectors." },
  { id:3, name:"ChainIndexer",   cat:"Infra", pricePerCall:0.000032, chain:"ARB",  address:"0x9876543210987654321098765432109876543210", calls:5210,  rating:4.8, hot:false, desc:"Full blockchain indexing." },
  { id:4, name:"NLP Classifier", cat:"AI",    pricePerCall:0.000005, chain:"ETH",  address:"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", calls:21000, rating:4.6, hot:true,  desc:"98.2% accuracy text classification." },
  { id:5, name:"PriceOracle",    cat:"Data",  pricePerCall:0.000020, chain:"BASE", address:"0x1111111111111111111111111111111111111111", calls:7600,  rating:4.9, hot:false, desc:"Decentralized price feeds." },
  { id:6, name:"MemoryStore",    cat:"Infra", pricePerCall:0.000003, chain:"SOL",  address:"0x2222222222222222222222222222222222222222", calls:33400, rating:4.5, hot:true,  desc:"Persistent agent memory." },
];

const TABS = [
  { id:"home",      icon:"⬡", label:"Home"    },
  { id:"agent",     icon:"🤖", label:"Agents"  },
  { id:"market",    icon:"◈", label:"Market"  },
  { id:"streams",   icon:"◉", label:"Streams" },
  { id:"billing",   icon:"▣", label:"Billing" },
  { id:"wallet",    icon:"◆", label:"Wallet"  },
];

const GREEK = ["α","β","γ","δ","ε","ζ","η","θ","ι","κ"];

// ── GLOBAL AGENT ECONOMY STATE ─────────────────────────────────────────────
// All tabs share this — it IS the agentic economy
function useAgentEconomy() {
  const [agents,      setAgents]      = useState([]);
  const [payments,    setPayments]    = useState([]);  // live payment stream
  const [billingLog,  setBillingLog]  = useState([]);  // per-service billing
  const [walletBal,   setWalletBal]   = useState(null);
  const [txHistory,   setTxHistory]   = useState([]);
  const [running,     setRunning]     = useState(false);
  const [totalFlowed, setTotalFlowed] = useState(0);
  const agentRef  = useRef([]);
  const loopRef   = useRef(null);
  const greekIdx  = useRef(0);

  // Load real wallet balance on mount
  useEffect(() => {
    fetchBalance().then(b => setWalletBal(b));
    fetchTransactions().then(txs => setTxHistory(txs));
  }, []);

  // ── SPAWN AGENT ──
  function spawnAgent(budgetUSDC) {
    const id     = GREEK[greekIdx.current % GREEK.length];
    greekIdx.current++;
    const agent  = {
      id,
      name:    "Agent " + id,
      budget:  parseFloat(budgetUSDC),
      spent:   0,
      calls:   0,
      status:  "idle",
      log:     [],
      color:   ["#ff3cac","#00d4ff","#7b2fff","#ffd166","#00cc66","#ff8844"][greekIdx.current % 6],
    };
    agentRef.current = [...agentRef.current, agent];
    setAgents([...agentRef.current]);
    return agent;
  }

  // ── MAKE REAL PAYMENT via Circle API ──
  async function makeCirclePayment(agent, api) {
    try {
      const res = await fetch("http://localhost:3001/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: api.pricePerCall.toFixed(6) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Payment failed:", data.error);
        return { success: false, error: data.error };
      }
      const payment = {
        id:         data.data.id,
        agentId:    agent.id,
        agentName:  agent.name,
        agentColor: agent.color,
        apiName:    api.name,
        apiId:      api.id,
        amount:     api.pricePerCall,
        timestamp:  Date.now(),
        status:     "COMPLETE",
        txHash:     data.data.id,
      };
      return { success: true, payment };
    } catch(e) {
      console.error("Payment error:", e.message);
      return { success: false, error: e.message };
    }
  }

  // ── RECORD PAYMENT ──
  function recordPayment(payment) {
    // Update streams
    setPayments(p => [payment, ...p].slice(0, 50));
    
    // Update total
    setTotalFlowed(t => t + payment.amount);

    // Update billing log per service
    setBillingLog(prev => {
      const existing = prev.find(b => b.apiId === payment.apiId);
      if (existing) {
        return prev.map(b => b.apiId === payment.apiId
          ? { ...b, calls: b.calls + 1, total: b.total + payment.amount }
          : b
        );
      }
      return [...prev, { apiId:payment.apiId, apiName:payment.apiName, calls:1, total:payment.amount }];
    });

    // Update agent spent + balance
    agentRef.current = agentRef.current.map(a => {
      if (a.id !== payment.agentId) return a;
      const newSpent = a.spent + payment.amount;
      const newStatus = newSpent >= a.budget ? "exhausted"
        : newSpent / a.budget > 0.8 ? "critical"
        : "working";
      return {
        ...a,
        spent:  parseFloat(newSpent.toFixed(8)),
        calls:  a.calls + 1,
        status: newStatus,
        log:    [{ api:payment.apiName, amount:payment.amount, time:Date.now() }, ...a.log].slice(0,20),
      };
    });
    setAgents([...agentRef.current]);
    
    // Deduct from wallet balance (simulated — real deduction happens onchain)
    setWalletBal(b => b !== null ? parseFloat((b - payment.amount).toFixed(8)) : b);
  }

  // ── AGENT LOOP — runs autonomously ──
  function startDemo(agents_list) {
    if (loopRef.current) clearInterval(loopRef.current);
    setRunning(true);

    loopRef.current = setInterval(async () => {
      const active = agentRef.current.filter(a => a.status !== "exhausted");
      if (active.length === 0) { stopDemo(); return; }

      // Each active agent makes a call to a random API
      for (const agent of active) {
        if (agent.status === "exhausted") continue;

        // Pick random API
        const api = APIS[Math.floor(Math.random() * APIS.length)];

        // Check budget
        if (agent.spent + api.pricePerCall > agent.budget) {
          agentRef.current = agentRef.current.map(a =>
            a.id === agent.id ? { ...a, status:"exhausted" } : a
          );
          setAgents([...agentRef.current]);
          continue;
        }

        // x402 flow: agent → API → 402 → sign → pay → settle
        agentRef.current = agentRef.current.map(a =>
          a.id === agent.id ? { ...a, status:"working" } : a
        );
        setAgents([...agentRef.current]);

        const result = await makeCirclePayment(agent, api);
        if (result.success) {
          recordPayment(result.payment);
        }
      }
    }, 1200);
  }

  function stopDemo() {
    if (loopRef.current) clearInterval(loopRef.current);
    setRunning(false);
    agentRef.current = agentRef.current.map(a =>
      a.status === "working" ? { ...a, status:"idle" } : a
    );
    setAgents([...agentRef.current]);
  }

  function killAgent(id) {
    agentRef.current = agentRef.current.filter(a => a.id !== id);
    setAgents([...agentRef.current]);
  }

  function resetAll() {
    stopDemo();
    agentRef.current = [];
    setAgents([]);
    setPayments([]);
    setBillingLog([]);
    setTotalFlowed(0);
    greekIdx.current = 0;
    fetchBalance().then(b => setWalletBal(b));
  }

  useEffect(() => () => { if (loopRef.current) clearInterval(loopRef.current); }, []);

  return {
    agents, payments, billingLog, walletBal, txHistory,
    running, totalFlowed,
    spawnAgent, startDemo, stopDemo, killAgent, resetAll,
    setWalletBal,
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ── PRIMITIVES ─────────────────────────────────────────────────────────────
function Dot({ color, size=8 }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", width:size, height:size, flexShrink:0 }}>
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, animation:"rp-ping 1.8s ease-in-out infinite", opacity:.4 }} />
      <span style={{ position:"absolute", inset:1, borderRadius:"50%", background:color }} />
    </span>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{ padding:"2px 8px", borderRadius:12, fontSize:9, fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase", background:color+"22", color, border:"1px solid "+color+"44" }}>
      {children}
    </span>
  );
}

function Card({ children, T, glow, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{ background:T.card, border:"1px solid "+(glow?glow+"44":T.border), borderRadius:14, boxShadow:glow?"0 0 28px "+glow+"20":"none", transition:"all .2s", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant="primary", size="md", style={} }) {
  const pad = size==="sm" ? "6px 14px" : size==="lg" ? "14px 32px" : "10px 20px";
  const fz  = size==="sm" ? 11 : size==="lg" ? 15 : 12;
  const bg  = disabled ? "#333"
    : variant==="danger"   ? "linear-gradient(135deg,#cc2222,#ff4444)"
    : variant==="success"  ? "linear-gradient(135deg,#008844,#00cc66)"
    : variant==="outline"  ? "transparent"
    : variant==="stop"     ? "linear-gradient(135deg,#cc2222,#ff6644)"
    : "linear-gradient(135deg,#7b2fff,#ff3cac)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:pad, borderRadius:8,
      border: variant==="outline" ? "1px solid #2a2a45" : "none",
      background:bg, color:disabled?"#666":variant==="outline"?"#9999bb":"#fff",
      fontWeight:700, fontSize:fz, fontFamily:"monospace",
      cursor:disabled?"not-allowed":"pointer", letterSpacing:1,
      transition:"all .2s", ...style,
    }}>{children}</button>
  );
}

// ── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({ onNav, T, isMobile, eco }) {
  const { running, totalFlowed, agents, payments } = eco;

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign:"center", padding: isMobile?"28px 0 24px":"56px 0 48px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"4px 14px", borderRadius:20, border:"1px solid "+T.accent+"44", background:T.accent+"0e", marginBottom:20 }}>
          <Dot color={T.accent} size={6} />
          <span style={{ fontSize:10, color:T.accent, fontFamily:"monospace", letterSpacing:2 }}>LIVE ON ARC TESTNET</span>
        </div>

        <h1 style={{ fontSize:isMobile?44:80, fontWeight:900, lineHeight:1.0, fontFamily:"Georgia,serif", background:"linear-gradient(135deg,"+T.text+" 0%,"+T.cyan+" 45%,"+T.accent+" 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:4 }}>RadonPay</h1>
        <div style={{ fontSize:isMobile?9:12, letterSpacing:isMobile?8:14, color:T.text2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:20 }}>OPERATING  SYSTEM</div>
        <p style={{ fontSize:isMobile?13:16, color:T.text2, lineHeight:1.8, maxWidth:isMobile?300:520, margin:"0 auto 28px" }}>
          The unified infrastructure layer for the agentic economy.
          AI agents that autonomously discover, pay for, and consume services —
          gas-free USDC down to <span style={{ color:T.cyan, fontFamily:"monospace" }}>$0.000001</span>.
        </p>

        {/* Live stats when running */}
        {(running || totalFlowed > 0) && (
          <div style={{ display:"inline-flex", gap:24, padding:"14px 24px", borderRadius:12, border:"1px solid "+T.cyan+"44", background:T.cyan+"08", marginBottom:20 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900, color:T.cyan, fontFamily:"monospace" }}>${totalFlowed.toFixed(6)}</div>
              <div style={{ fontSize:9, color:T.muted }}>TOTAL FLOWED</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900, color:T.accent, fontFamily:"monospace" }}>{agents.length}</div>
              <div style={{ fontSize:9, color:T.muted }}>AGENTS</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900, color:T.gold, fontFamily:"monospace" }}>{payments.length}</div>
              <div style={{ fontSize:9, color:T.muted }}>PAYMENTS</div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Btn onClick={() => onNav("agent")} size="lg" style={{ boxShadow:"0 4px 28px "+T.accent+"44" }}>
            {running ? "⟳ DEMO RUNNING →" : "🤖 LAUNCH AGENTS →"}
          </Btn>
          <Btn onClick={() => onNav("streams")} variant="outline" size="lg">
            ◉ LIVE STREAMS
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:28 }}>
        {[
          { v:"$0.000001", l:"Min Transfer" },
          { v:"$0.00",     l:"Gas Cost"     },
          { v:"x402",      l:"Protocol"     },
          { v:"Circle",    l:"Gateway"      },
        ].map(s => (
          <Card key={s.l} T={T} style={{ padding:isMobile?"10px 4px":"16px 10px", textAlign:"center" }}>
            <div style={{ fontSize:isMobile?12:18, fontWeight:900, color:T.cyan, fontFamily:"monospace" }}>{s.v}</div>
            <div style={{ fontSize:8, color:T.muted, marginTop:4, textTransform:"uppercase", letterSpacing:1 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* How it works */}
      <Card T={T} style={{ padding:"20px 22px", marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16, fontFamily:"Georgia,serif" }}>How the Agentic Economy Works</div>
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(5,1fr)", gap:10 }}>
          {[
            { n:"1", t:"Agent Spawns",    d:"You define a USDC budget. Agent starts.", color:T.accent  },
            { n:"2", t:"Finds API",       d:"Searches marketplace for what it needs.", color:T.purple  },
            { n:"3", t:"Gets HTTP 402",   d:"API requests payment before serving.",    color:T.cyan    },
            { n:"4", t:"Signs & Pays",    d:"Agent pays from wallet. No gas. Instant.",color:T.gold    },
            { n:"5", t:"Gets Result",     d:"API serves the data. Loop repeats.",      color:T.success },
          ].map(step => (
            <div key={step.n} style={{ textAlign:"center", padding:"12px 8px", borderRadius:10, background:step.color+"0a", border:"1px solid "+step.color+"22" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:step.color+"22", border:"1px solid "+step.color+"44", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px", fontSize:13, fontWeight:900, color:step.color, fontFamily:"monospace" }}>{step.n}</div>
              <div style={{ fontSize:11, fontWeight:700, color:T.text, marginBottom:4 }}>{step.t}</div>
              <div style={{ fontSize:10, color:T.muted, lineHeight:1.5 }}>{step.d}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA row */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(3,1fr)", gap:10 }}>
        {[
          { icon:"🤖", title:"Agent Demo",    desc:"Spawn real agents, watch them pay APIs automatically.", tab:"agent",   color:T.accent  },
          { icon:"◉",  title:"Live Streams",  desc:"Every payment flowing in real time. Gas: $0.00.",       tab:"streams", color:T.cyan    },
          { icon:"◆",  title:"Your Wallet",   desc:"Real USDC balance connected to Circle Gateway.",        tab:"wallet",  color:T.purple  },
        ].map(f => (
          <Card key={f.tab} T={T} glow={f.color} onClick={() => onNav(f.tab)} style={{ padding:"16px 18px", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{f.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:5 }}>{f.title}</div>
            <div style={{ fontSize:11, color:T.text2, lineHeight:1.6 }}>{f.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── AGENT TAB — the main event ──────────────────────────────────────────────
function AgentTab({ T, isMobile, eco }) {
  const { agents, running, totalFlowed, payments, startDemo, stopDemo, spawnAgent, killAgent, resetAll } = eco;
  const [budget,    setBudget]    = useState("0.050");
  const [count,     setCount]     = useState("3");
  const [spawnErr,  setSpawnErr]  = useState("");
  const [log,       setLog]       = useState([]);

  // Live log of agent actions
  useEffect(() => {
    if (payments.length === 0) return;
    const latest = payments[0];
    setLog(prev => [{
      id:    latest.id,
      msg:   latest.agentName + " paid " + latest.apiName + " $" + latest.amount.toFixed(6),
      color: latest.agentColor,
      time:  new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 30));
  }, [payments.length]);

  function handleStart() {
    setSpawnErr("");
    const b = parseFloat(budget);
    const c = parseInt(count);
    if (isNaN(b) || b <= 0)  { setSpawnErr("Enter valid budget"); return; }
    if (isNaN(c) || c < 1)   { setSpawnErr("Min 1 agent"); return; }
    if (c > 8)                { setSpawnErr("Max 8 agents"); return; }
    if (b * c > 35)           { setSpawnErr("Total budget exceeds safe limit ($35)"); return; }

    // Spawn agents
    const newAgents = [];
    for (let i = 0; i < c; i++) {
      newAgents.push(spawnAgent(b));
    }
    // Start the autonomous loop
    startDemo(newAgents);
  }

  const activeCount    = agents.filter(a => a.status !== "exhausted").length;
  const exhaustedCount = agents.filter(a => a.status === "exhausted").length;
  const totalSpent     = agents.reduce((s, a) => s + a.spent, 0);

  const STATUS_COLOR_MAP = {
    working:   T.cyan,
    idle:      T.muted,
    critical:  T.gold,
    exhausted: T.danger,
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:isMobile?20:26, fontWeight:900, color:T.text, fontFamily:"Georgia,serif", marginBottom:4 }}>
          Agentic Economy Demo
        </div>
        <div style={{ fontSize:13, color:T.text2 }}>
          Spawn AI agents. Watch them autonomously pay for APIs using real USDC.
        </div>
      </div>

      {/* Control panel */}
      <Card T={T} glow={running ? T.cyan : null} style={{ padding:"18px 20px", marginBottom:16 }}>
        <div style={{ fontSize:11, color:T.muted, marginBottom:14, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1 }}>
          {running ? "⟳ AGENTS RUNNING AUTONOMOUSLY" : "Configure & Launch"}
        </div>

        {!running ? (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:T.muted, marginBottom:5, fontFamily:"monospace" }}>USDC BUDGET PER AGENT</div>
                <input type="number" value={budget} onChange={e=>setBudget(e.target.value)}
                  placeholder="0.050" min="0.001" max="5" step="0.001"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid "+T.border2, background:T.input, color:T.text, fontFamily:"monospace", fontSize:15, outline:"none" }} />
              </div>
              <div>
                <div style={{ fontSize:9, color:T.muted, marginBottom:5, fontFamily:"monospace" }}>NUMBER OF AGENTS (max 8)</div>
                <input type="number" value={count} onChange={e=>setCount(e.target.value)}
                  placeholder="3" min="1" max="8"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid "+T.border2, background:T.input, color:T.text, fontFamily:"monospace", fontSize:15, outline:"none" }} />
              </div>
            </div>

            {/* Preview */}
            {budget && count && !isNaN(parseFloat(budget)) && !isNaN(parseInt(count)) && (
              <div style={{ padding:"10px 14px", borderRadius:8, background:T.cyan+"0a", border:"1px solid "+T.cyan+"22", marginBottom:12 }}>
                <div style={{ fontSize:11, color:T.cyan, fontFamily:"monospace" }}>
                  {count} agents × ${parseFloat(budget).toFixed(3)} = ${(parseFloat(budget)*parseInt(count)).toFixed(3)} USDC total budget
                </div>
                <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>
                  Each agent calls marketplace APIs autonomously until budget is exhausted
                </div>
              </div>
            )}

            {spawnErr && <div style={{ fontSize:11, color:T.danger, marginBottom:10, fontFamily:"monospace" }}>⚠ {spawnErr}</div>}

            <Btn onClick={handleStart} size="lg" style={{ width:"100%" }}>
              🤖 SPAWN AGENTS & START DEMO →
            </Btn>
          </div>
        ) : (
          <div>
            {/* Live stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
              {[
                { l:"Active",    v:activeCount,              c:T.cyan    },
                { l:"Exhausted", v:exhaustedCount,           c:T.danger  },
                { l:"Payments",  v:payments.length,          c:T.accent  },
                { l:"USDC Sent", v:"$"+totalSpent.toFixed(4),c:T.gold    },
              ].map(s => (
                <div key={s.l} style={{ textAlign:"center", padding:"10px 6px", borderRadius:8, background:s.c+"0a", border:"1px solid "+s.c+"22" }}>
                  <div style={{ fontSize:18, fontWeight:900, color:s.c, fontFamily:"monospace" }}>{s.v}</div>
                  <div style={{ fontSize:8, color:T.muted, marginTop:3, textTransform:"uppercase" }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={stopDemo} variant="stop" style={{ flex:1 }}>⬛ STOP</Btn>
              <Btn onClick={resetAll} variant="outline" style={{ flex:1 }}>↺ RESET</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Agent cards */}
      {agents.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:12, marginBottom:16 }}>
          {agents.map(a => {
            const pct = a.budget > 0 ? Math.min(100, (a.spent/a.budget)*100) : 0;
            const sc  = STATUS_COLOR_MAP[a.status] || T.muted;
            const barBg = pct > 90 ? "linear-gradient(90deg,"+T.purple+","+T.danger+")"
              : pct > 70 ? "linear-gradient(90deg,"+T.purple+","+T.gold+")"
              : "linear-gradient(90deg,"+T.purple+","+T.cyan+")";

            return (
              <Card key={a.id} T={T} glow={sc} style={{ padding:"14px 16px" }}>
                {/* Agent header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:a.color+"22", border:"1px solid "+a.color+"44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, color:a.color, fontFamily:"Georgia,serif", flexShrink:0 }}>
                      {a.id}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{a.name}</div>
                      <div style={{ fontSize:9, color:T.muted }}>{a.calls} API calls made</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Dot color={sc} size={6} />
                    <span style={{ fontSize:9, color:sc, textTransform:"uppercase", fontFamily:"monospace" }}>{a.status}</span>
                  </div>
                </div>

                {/* Budget bar */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:9, color:T.muted }}>Budget</span>
                    <span style={{ fontSize:10, color:T.text, fontFamily:"monospace" }}>
                      ${a.spent.toFixed(6)} / ${a.budget.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ height:5, background:T.bg3, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:3, width:pct+"%", background:barBg, transition:"width .4s ease" }} />
                  </div>
                </div>

                {/* Last payment */}
                {a.log.length > 0 && (
                  <div style={{ fontSize:9, color:T.muted, fontFamily:"monospace", padding:"5px 8px", borderRadius:6, background:T.bg3 }}>
                    Last: {a.log[0].api} — ${a.log[0].amount.toFixed(6)}
                  </div>
                )}

                <button onClick={() => killAgent(a.id)} style={{ marginTop:8, width:"100%", padding:"5px", borderRadius:6, border:"1px solid "+T.border, background:"transparent", color:T.muted, fontSize:9, cursor:"pointer", fontFamily:"monospace" }}>
                  ✕ KILL AGENT
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Live action log */}
      {log.length > 0 && (
        <Card T={T} style={{ overflow:"hidden" }}>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid "+T.border, display:"flex", alignItems:"center", gap:7 }}>
            <Dot color={T.cyan} size={5} />
            <span style={{ fontSize:11, color:T.text2, fontFamily:"monospace" }}>LIVE PAYMENT LOG</span>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto", padding:"8px 0" }}>
            {log.map((l, i) => (
              <div key={l.id + i} style={{ padding:"5px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:i<log.length-1?"1px solid "+T.border+"44":"none" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:l.color, flexShrink:0 }} />
                <span style={{ fontSize:10, color:T.text2, fontFamily:"monospace", flex:1 }}>{l.msg}</span>
                <span style={{ fontSize:9, color:T.muted }}>{l.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {agents.length === 0 && !running && (
        <Card T={T} style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🤖</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>No agents running</div>
          <div style={{ fontSize:13, color:T.muted, maxWidth:320, margin:"0 auto" }}>
            Configure a budget above and click SPAWN AGENTS to watch the agentic economy in action.
          </div>
        </Card>
      )}
    </div>
  );
}

// ── STREAMS TAB ─────────────────────────────────────────────────────────────
function StreamsTab({ T, isMobile, eco }) {
  const { payments, totalFlowed, running, agents } = eco;

  // Group by agent for stream display
  const activeStreams = agents
    .filter(a => a.status !== "exhausted")
    .slice(0, 6);

  // Recent payment rows
  const recentPayments = payments.slice(0, 20);

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:isMobile?20:26, fontWeight:900, color:T.text, fontFamily:"Georgia,serif", marginBottom:4 }}>Live Payment Streams</div>
        <div style={{ fontSize:13, color:T.text2 }}>Every nanopayment flowing in real time. Gas: $0.00</div>
      </div>

      {/* Grand total */}
      <div style={{ textAlign:"center", padding:isMobile?"20px 14px":"28px 20px", background:"linear-gradient(135deg,"+T.bg2+","+T.bg3+")", border:"1px solid "+T.cyan+"33", borderRadius:14, marginBottom:18, boxShadow:"0 0 40px "+T.cyan+"12" }}>
        <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:3, marginBottom:8, fontFamily:"monospace" }}>Total USDC Flowing</div>
        <div style={{ fontSize:isMobile?34:52, fontWeight:900, fontFamily:"monospace", color:T.cyan }}>${totalFlowed.toFixed(6)}</div>
        <div style={{ fontSize:10, color:T.muted, marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {running ? <Dot color={T.cyan} size={5} /> : <span>◉</span>}
          {running ? activeStreams.length + " active agents · Gas $0.00" : "Start the agent demo to see live streams"}
        </div>
      </div>

      {/* Agent stream cards */}
      {activeStreams.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:12, marginBottom:18 }}>
          {activeStreams.map(a => {
            const lastPayment = payments.find(p => p.agentId === a.id);
            return (
              <Card key={a.id} T={T} glow={a.color} style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.text2, marginBottom:6, fontFamily:"monospace" }}>
                      <span style={{ color:a.color }}>{a.name}</span>
                      {lastPayment && <span style={{ color:T.muted }}> → {lastPayment.apiName}</span>}
                    </div>
                    {/* Animated bars */}
                    <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:22 }}>
                      {Array.from({length:18}, (_, j) => (
                        <div key={j} style={{
                          width:4, borderRadius:2, background:a.color,
                          height: running ? 3+Math.random()*18 : 3,
                          opacity: running ? .3+Math.random()*.7 : .2,
                          transition:"height .3s",
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:900, color:a.color, fontFamily:"monospace" }}>
                      {lastPayment ? "$"+lastPayment.amount.toFixed(6) : "$0.000000"}
                    </div>
                    <div style={{ fontSize:9, color:T.muted }}>{a.calls} calls</div>
                    <div style={{ fontSize:9, color:T.text2, fontFamily:"monospace", marginTop:2 }}>
                      Σ ${a.spent.toFixed(6)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment feed */}
      {recentPayments.length > 0 ? (
        <Card T={T} style={{ overflow:"hidden" }}>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid "+T.border, display:"flex", alignItems:"center", gap:7 }}>
            <Dot color={T.cyan} size={5} />
            <span style={{ fontSize:11, color:T.text2, fontFamily:"monospace" }}>PAYMENT FEED</span>
            <Badge color={T.cyan}>{recentPayments.length} RECENT</Badge>
          </div>
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {recentPayments.map((p, i) => (
              <div key={p.id} style={{ padding:"10px 14px", borderBottom:i<recentPayments.length-1?"1px solid "+T.border+"44":"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.agentColor, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:11, color:T.text, fontFamily:"monospace" }}>
                      <span style={{ color:p.agentColor }}>{p.agentName}</span>
                      <span style={{ color:T.muted }}> → </span>
                      {p.apiName}
                    </div>
                    <div style={{ fontSize:9, color:T.muted, marginTop:1, fontFamily:"monospace" }}>
                      {p.txHash} · {new Date(p.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.cyan, fontFamily:"monospace" }}>${p.amount.toFixed(6)}</div>
                  <Badge color={T.success}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card T={T} style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>◉</div>
          <div style={{ color:T.muted, fontSize:13 }}>No payments yet. Start the agent demo to see live streams.</div>
        </Card>
      )}
    </div>
  );
}

// ── BILLING TAB ─────────────────────────────────────────────────────────────
function BillingTab({ T, isMobile, eco }) {
  const { billingLog, payments, agents } = eco;
  const totalSpent  = agents.reduce((s, a) => s + a.spent, 0);
  const totalCalls  = agents.reduce((s, a) => s + a.calls, 0);
  const avgCost     = totalCalls > 0 ? totalSpent / totalCalls : 0;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:isMobile?20:26, fontWeight:900, color:T.text, fontFamily:"Georgia,serif", marginBottom:4 }}>Usage Billing</div>
        <div style={{ fontSize:13, color:T.text2 }}>Real-time cost breakdown per agent and per service.</div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { l:"Total Spent",  v:"$"+totalSpent.toFixed(6),  s:"across all agents",  c:T.accent  },
          { l:"Total Calls",  v:totalCalls.toString(),       s:"API requests made",  c:T.cyan    },
          { l:"Avg Per Call", v:"$"+avgCost.toFixed(7),      s:"effective rate",     c:T.purple  },
          { l:"Gas Fees",     v:"$0.00",                     s:"Circle Gateway",     c:T.gold    },
        ].map(s => (
          <Card key={s.l} T={T} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{s.l}</div>
            <div style={{ fontSize:isMobile?16:20, fontWeight:900, color:s.c, fontFamily:"monospace" }}>{s.v}</div>
            <div style={{ fontSize:9, color:T.muted, marginTop:3 }}>{s.s}</div>
          </Card>
        ))}
      </div>

      {/* Per service breakdown */}
      <Card T={T} style={{ overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid "+T.border }}>
          <span style={{ fontSize:11, color:T.text2, fontFamily:"monospace" }}>COST BY SERVICE</span>
        </div>
        {billingLog.length === 0 ? (
          <div style={{ padding:28, textAlign:"center", color:T.muted, fontSize:12 }}>
            Run the agent demo to see real billing data
          </div>
        ) : billingLog.sort((a,b) => b.total-a.total).map((row, i) => {
          const maxTotal = Math.max(...billingLog.map(b => b.total));
          const pct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
          return (
            <div key={row.apiId} style={{ padding:"14px 16px", borderBottom:i<billingLog.length-1?"1px solid "+T.border:"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:12, color:T.text, fontFamily:"monospace" }}>{row.apiName}</div>
                  <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{row.calls} calls</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, color:T.cyan, fontFamily:"monospace" }}>${row.total.toFixed(6)}</div>
                  <div style={{ fontSize:9, color:T.muted }}>${(row.total/row.calls).toFixed(6)}/call</div>
                </div>
              </div>
              <div style={{ height:4, background:T.bg3, borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:2, width:pct+"%", background:"linear-gradient(90deg,"+T.purple+","+T.cyan+")", transition:"width .5s" }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* Per agent breakdown */}
      {agents.length > 0 && (
        <Card T={T} style={{ overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid "+T.border }}>
            <span style={{ fontSize:11, color:T.text2, fontFamily:"monospace" }}>COST BY AGENT</span>
          </div>
          {agents.map((a, i) => (
            <div key={a.id} style={{ padding:"12px 16px", borderBottom:i<agents.length-1?"1px solid "+T.border:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:6, background:a.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:a.color, fontFamily:"Georgia,serif" }}>{a.id}</div>
                <div>
                  <div style={{ fontSize:11, color:T.text, fontFamily:"monospace" }}>{a.name}</div>
                  <div style={{ fontSize:9, color:T.muted }}>{a.calls} calls · {a.status}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, color:T.cyan, fontFamily:"monospace" }}>${a.spent.toFixed(6)}</div>
                <div style={{ fontSize:9, color:T.muted }}>of ${a.budget.toFixed(3)}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── WALLET TAB ──────────────────────────────────────────────────────────────
function WalletTab({ T, isMobile, eco }) {
  const { walletBal, payments, txHistory } = eco;
  const [copied, setCopied] = useState(false);

  const short = ADDRESS ? ADDRESS.slice(0,10)+"..."+ADDRESS.slice(-6) : "Not configured";

  const allTx = [
    ...payments.slice(0,10).map(p => ({
      label:  p.agentName + " → " + p.apiName,
      amount: "-" + p.amount.toFixed(6),
      time:   new Date(p.timestamp).toLocaleTimeString(),
      color:  T.cyan,
      status: "settled",
    })),
    ...txHistory.slice(0,5).map(tx => ({
      label:  tx.transactionType || "TRANSFER",
      amount: (tx.amounts?.[0] || "0"),
      time:   tx.createDate ? new Date(tx.createDate).toLocaleTimeString() : "—",
      color:  T.purple,
      status: tx.state || "confirmed",
    })),
  ].slice(0, 15);

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:isMobile?20:26, fontWeight:900, color:T.text, fontFamily:"Georgia,serif", marginBottom:4 }}>Gateway Wallet</div>
        <div style={{ fontSize:13, color:T.text2 }}>Real USDC. Circle Gateway. Batch settle. $0 gas.</div>
      </div>

      {/* Balance */}
      <div style={{ padding:isMobile?"20px 18px":"26px 24px", borderRadius:14, marginBottom:14, background:"linear-gradient(135deg,"+T.bg3+","+T.bg2+")", border:"1px solid "+T.accent+"33", boxShadow:"0 0 44px "+T.purple+"18" }}>
        <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:2, marginBottom:8, fontFamily:"monospace" }}>Available Balance</div>
        <div style={{ fontSize:isMobile?34:50, fontWeight:900, fontFamily:"monospace", color:T.text }}>
          {walletBal !== null ? "$"+walletBal.toFixed(6) : "Loading..."}
        </div>
        <div style={{ fontSize:10, color:T.muted, marginTop:6, display:"flex", alignItems:"center", gap:7 }}>
          <Dot color={T.cyan} size={5} />USDC · ETH-SEPOLIA · Circle Gateway
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        <Card T={T} style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:1, fontFamily:"monospace" }}>Wallet</div>
          <div style={{ fontSize:10, color:T.cyan, fontFamily:"monospace", marginBottom:8 }}>{short}</div>
          <button onClick={() => { navigator.clipboard.writeText(ADDRESS||""); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
            style={{ padding:"4px 10px", borderRadius:6, border:"1px solid "+T.border, background:"transparent", color:T.muted, fontSize:9, cursor:"pointer", fontFamily:"monospace" }}>
            {copied ? "✓ COPIED" : "COPY"}
          </button>
        </Card>
        <Card T={T} style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:1, fontFamily:"monospace" }}>Agent Payments</div>
          <div style={{ fontSize:20, fontWeight:900, color:T.accent, fontFamily:"monospace" }}>{payments.length}</div>
          <div style={{ fontSize:9, color:T.muted, marginTop:3 }}>since demo start</div>
        </Card>
        <Card T={T} style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:1, fontFamily:"monospace" }}>Gas Fees</div>
          <div style={{ fontSize:20, fontWeight:900, color:T.success, fontFamily:"monospace" }}>$0.00</div>
          <div style={{ fontSize:9, color:T.muted, marginTop:3 }}>Via Circle Gateway</div>
        </Card>
        <Card T={T} style={{ padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:1, fontFamily:"monospace" }}>Network</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
            <Dot color={T.cyan} size={6} />
            <span style={{ fontSize:11, color:T.cyan, fontFamily:"monospace" }}>ETH-SEPOLIA</span>
          </div>
        </Card>
      </div>

      {/* Transaction history */}
      <Card T={T} style={{ overflow:"hidden", marginBottom:14 }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid "+T.border }}>
          <span style={{ fontSize:11, color:T.text2, fontFamily:"monospace" }}>TRANSACTION HISTORY</span>
        </div>
        {allTx.length === 0 ? (
          <div style={{ padding:28, textAlign:"center", color:T.muted, fontSize:12 }}>
            No transactions yet. Run the agent demo to see payments here.
          </div>
        ) : allTx.map((tx, i) => (
          <div key={i} style={{ padding:"10px 14px", borderBottom:i<allTx.length-1?"1px solid "+T.border:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, color:T.text, fontFamily:"monospace", marginBottom:1 }}>{tx.label}</div>
              <div style={{ fontSize:9, color:T.muted }}>{tx.time}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, fontFamily:"monospace", color: tx.amount.toString().startsWith("-") ? T.text : T.cyan }}>
                {tx.amount} USDC
              </span>
              <Badge color={tx.color}>{tx.status}</Badge>
            </div>
          </div>
        ))}
      </Card>

      {/* Etherscan */}
      <Card T={T} style={{ padding:"14px 16px", textAlign:"center" }}>
        <div style={{ fontSize:10, color:T.muted, marginBottom:10 }}>Verify on Sepolia Explorer</div>
        <a href={"https://sepolia.etherscan.io/address/" + ADDRESS} target="_blank" rel="noreferrer"
          style={{ display:"inline-block", padding:"9px 22px", background:"linear-gradient(135deg,"+T.purple+","+T.accent+")", borderRadius:8, color:"#fff", fontSize:11, fontFamily:"monospace", textDecoration:"none", fontWeight:700, letterSpacing:1 }}>
          VIEW ON ETHERSCAN
        </a>
      </Card>
    </div>
  );
}

// ── MARKET TAB ──────────────────────────────────────────────────────────────
function MarketTab({ T, isMobile, eco }) {
  const { payments } = eco;
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);

  const list = filter === "All" ? APIS : APIS.filter(a => a.cat === filter);

  // Count payments per API
  const payCounts = payments.reduce((acc, p) => {
    acc[p.apiId] = (acc[p.apiId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:isMobile?20:26, fontWeight:900, color:T.text, fontFamily:"Georgia,serif", marginBottom:4 }}>Agent Marketplace</div>
        <div style={{ fontSize:13, color:T.text2 }}>x402-compatible APIs. Agents pay per request automatically.</div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {["All","AI","Data","Infra"].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer", border:"1px solid "+(filter===c?T.accent:T.border), background:filter===c?T.accent+"18":"transparent", color:filter===c?T.accent:T.text2, fontSize:11, fontFamily:"monospace", transition:"all .2s" }}>{c}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
        {list.map(a => {
          const open = selected === a.id;
          const callsMade = payCounts[a.id] || 0;
          return (
            <Card key={a.id} T={T} glow={open ? T.purple : callsMade > 0 ? T.cyan : null}
              style={{ overflow:"hidden", cursor:"pointer" }}>
              <div onClick={() => setSelected(open ? null : a.id)} style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"monospace" }}>{a.name}</span>
                      {a.hot && <Badge color={T.accent}>HOT</Badge>}
                      {callsMade > 0 && <Badge color={T.cyan}>{callsMade} CALLS</Badge>}
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      <Badge color={T.text2}>{a.cat}</Badge>
                      <Badge color={T.cyan}>{a.chain}</Badge>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:T.cyan, fontFamily:"monospace" }}>${a.pricePerCall.toFixed(6)}</div>
                    <div style={{ fontSize:9, color:T.muted }}>per request</div>
                  </div>
                </div>

                {open && <div style={{ fontSize:11, color:T.text2, lineHeight:1.6, marginBottom:10, paddingTop:10, borderTop:"1px solid "+T.border }}>{a.desc}</div>}

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Dot color={T.cyan} size={5} />
                    <span style={{ fontSize:9, color:T.cyan, fontFamily:"monospace" }}>LIVE</span>
                  </div>
                  <span style={{ fontSize:10, color:T.muted }}>{(a.calls + callsMade).toLocaleString()} total calls</span>
                  <span style={{ fontSize:10, color:T.gold }}>★ {a.rating}</span>
                </div>
              </div>

              {callsMade > 0 && (
                <div style={{ padding:"8px 14px", borderTop:"1px solid "+T.border, background:T.cyan+"08", fontSize:10, color:T.cyan, fontFamily:"monospace" }}>
                  ✓ {callsMade} agent payments received · ${(callsMade * a.pricePerCall).toFixed(6)} USDC earned
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,  setTab]  = useState("home");
  const [dark, setDark] = useState(true);
  const T   = dark ? DARK : LIGHT;
  const w   = useWindowWidth();
  const isMobile = w < 768;
  const eco = useAgentEconomy();

  const VIEWS = {
    home:    <HomeTab    onNav={setTab} T={T} isMobile={isMobile} eco={eco} />,
    agent:   <AgentTab              T={T} isMobile={isMobile} eco={eco} />,
    market:  <MarketTab             T={T} isMobile={isMobile} eco={eco} />,
    streams: <StreamsTab            T={T} isMobile={isMobile} eco={eco} />,
    billing: <BillingTab            T={T} isMobile={isMobile} eco={eco} />,
    wallet:  <WalletTab             T={T} isMobile={isMobile} eco={eco} />,
  };

  const ThemeToggle = () => (
    <button onClick={() => setDark(!dark)} style={{ width:36, height:20, borderRadius:10, background:dark?T.purple:T.border2, border:"none", cursor:"pointer", position:"relative", transition:"background .3s", flexShrink:0 }}>
      <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:dark?18:2, transition:"left .3s" }} />
    </button>
  );

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, transition:"background .3s, color .3s" }}>
      <style>{`
        @keyframes rp-ping { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(2.4);opacity:0} }
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        body { background:${T.bg}; font-family:monospace; }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:${T.bg} }
        ::-webkit-scrollbar-thumb { background:${T.border2}; border-radius:2px }
        input:focus { border-color:${T.purple}!important; }
        button:active { opacity:.85; }
        a { color:inherit; }
      `}</style>

      {/* ── DESKTOP ── */}
      {!isMobile ? (
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <div style={{ width:220, flexShrink:0, position:"fixed", top:0, left:0, bottom:0, background:T.nav, backdropFilter:"blur(16px)", borderRight:"1px solid "+T.border, display:"flex", flexDirection:"column", zIndex:100 }}>
            {/* Logo */}
            <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid "+T.border }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:28, height:28, background:"linear-gradient(135deg,#7b2fff,#ff3cac)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:900, color:T.text, fontFamily:"Georgia,serif" }}>RadonPay <span style={{ color:T.accent, fontSize:8, letterSpacing:3 }}>OS</span></div>
                  <div style={{ fontSize:7, color:T.muted, letterSpacing:2 }}>BY AGENTIC LABS</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <Dot color={eco.running ? T.accent : T.cyan} size={5} />
                  <span style={{ fontSize:8, color:eco.running ? T.accent : T.cyan, letterSpacing:1 }}>
                    {eco.running ? "AGENTS RUNNING" : "TESTNET LIVE"}
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Live stats in sidebar */}
            {eco.totalFlowed > 0 && (
              <div style={{ padding:"10px 14px", borderBottom:"1px solid "+T.border, background:T.cyan+"06" }}>
                <div style={{ fontSize:8, color:T.muted, marginBottom:4 }}>TOTAL FLOWED</div>
                <div style={{ fontSize:14, fontWeight:900, color:T.cyan, fontFamily:"monospace" }}>${eco.totalFlowed.toFixed(6)}</div>
              </div>
            )}

            {/* Nav */}
            <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
              {TABS.map(t => {
                const active = tab === t.id;
                const hasActivity = t.id === "streams" && eco.payments.length > 0
                  || t.id === "billing" && eco.billingLog.length > 0
                  || t.id === "agent"   && eco.agents.length > 0;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:10, marginBottom:2, background:active?"linear-gradient(135deg,"+T.purple+"22,"+T.accent+"22)":"transparent", border:active?"1px solid "+T.accent+"33":"1px solid transparent", color:active?T.accent:T.text2, fontSize:11, cursor:"pointer", transition:"all .2s", textAlign:"left" }}>
                    <span style={{ fontSize:14, width:18, textAlign:"center" }}>{t.icon}</span>
                    {t.label}
                    {hasActivity && !active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:T.cyan }} />}
                    {active && <span style={{ marginLeft:"auto", color:T.accent }}>›</span>}
                  </button>
                );
              })}
            </nav>

            <div style={{ margin:"0 8px 14px", padding:"11px", borderRadius:10, background:T.bg3, border:"1px solid "+T.border }}>
              <div style={{ fontSize:7, color:T.muted, letterSpacing:2, marginBottom:3 }}>Powered by</div>
              <div style={{ fontSize:12, fontWeight:700, color:T.text }}>Circle Gateway</div>
              <div style={{ fontSize:8, color:T.muted, marginTop:2 }}>Arc Testnet · x402</div>
            </div>
          </div>

          <div style={{ marginLeft:220, flex:1, padding:"32px 40px 60px", maxWidth:1100 }}>
            {VIEWS[tab]}
          </div>
        </div>

      ) : (
        /* ── MOBILE ── */
        <div>
          <div style={{ position:"sticky", top:0, zIndex:100, background:T.nav, backdropFilter:"blur(14px)", borderBottom:"1px solid "+T.border, padding:"0 14px", height:52, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, background:"linear-gradient(135deg,#7b2fff,#ff3cac)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
              <div>
                <div style={{ fontSize:12, fontWeight:900, color:T.text, fontFamily:"Georgia,serif" }}>RadonPay <span style={{ color:T.accent, fontSize:7, letterSpacing:3 }}>OS</span></div>
                <div style={{ fontSize:6, color:T.muted, letterSpacing:2 }}>BY AGENTIC LABS</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Dot color={eco.running ? T.accent : T.cyan} size={5} />
                <span style={{ fontSize:8, color:eco.running ? T.accent : T.cyan }}>{eco.running ? "RUNNING" : "TESTNET"}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div style={{ padding:"14px 14px 100px" }}>
            {VIEWS[tab]}
          </div>

          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:T.nav, backdropFilter:"blur(16px)", borderTop:"1px solid "+T.border, display:"flex", padding:"5px 0 calc(5px + env(safe-area-inset-bottom))" }}>
            {TABS.map(t => {
              const active = tab === t.id;
              const hasActivity = t.id === "streams" && eco.payments.length > 0
                || t.id === "agent" && eco.agents.length > 0;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"transparent", border:"none", cursor:"pointer", padding:"3px 1px", position:"relative" }}>
                  {hasActivity && !active && <div style={{ position:"absolute", top:4, right:"25%", width:5, height:5, borderRadius:"50%", background:T.cyan }} />}
                  <div style={{ width:30, height:30, borderRadius:8, background:active?"linear-gradient(135deg,"+T.purple+"44,"+T.accent+"44)":"transparent", border:active?"1px solid "+T.accent+"44":"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:active?T.accent:T.muted, transition:"all .2s" }}>{t.icon}</div>
                  <span style={{ fontSize:6, color:active?T.accent:T.muted, letterSpacing:.5, textTransform:"uppercase" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
