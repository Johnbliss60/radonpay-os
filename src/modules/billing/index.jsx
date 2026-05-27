import { useState } from "react";
import Card from "../../components/Card";

const BILLING = [
  { service:"VectorSearch X", calls:1240, cost:"0.00992",  pct:62, delta:+12 },
  { service:"DataFeed Pro",   calls:890,  cost:"0.01335",  pct:80, delta:-4  },
  { service:"NLP Classifier", calls:3200, cost:"0.01600",  pct:95, delta:+28 },
  { service:"ChainIndexer",   calls:210,  cost:"0.00672",  pct:40, delta:+5  },
];

export default function Billing() {
  const [period, setPeriod] = useState("24h");
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:900, color:"#f0eeff", fontFamily:"Georgia,serif", marginBottom:4 }}>Usage Billing</div>
        <div style={{ fontSize:12, color:"#6b6b8a" }}>Per-call metered billing across all services.</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"Total Spend", value:"$0.046",     sub:"last 24h",       color:"#ff3cac" },
          { label:"Total Calls", value:"5,540",      sub:"4 services",     color:"#00d4ff" },
          { label:"Avg/Call",    value:"$0.0000083", sub:"effective rate", color:"#7b2fff" },
          { label:"Gas Fees",    value:"$0.00",      sub:"zero overhead",  color:"#ffd166" },
        ].map(s => (
          <Card key={s.label} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:10, color:"#6b6b8a", textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, fontFamily:"monospace" }}>{s.value}</div>
            <div style={{ fontSize:10, color:"#6b6b8a", marginTop:4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <Card style={{ overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #1a1a2e", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#9999bb", fontFamily:"monospace" }}>SERVICE BREAKDOWN</span>
          <div style={{ display:"flex", gap:6 }}>
            {["1h","24h","7d"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding:"3px 10px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${period===p ? "#00d4ff" : "#1a1a2e"}`,
                background: period===p ? "#00d4ff18" : "transparent",
                color: period===p ? "#00d4ff" : "#6b6b8a", fontSize:10
              }}>{p}</button>
            ))}
          </div>
        </div>
        {BILLING.map((row, i) => (
          <div key={i} style={{ padding:"16px 18px", borderBottom: i < BILLING.length-1 ? "1px solid #0d0d1a" : "none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:"#f0eeff", fontFamily:"monospace" }}>{row.service}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, color:"#00d4ff", fontFamily:"monospace" }}>${row.cost}</span>
                <span style={{
                  fontSize:10, padding:"2px 8px", borderRadius:10,
                  background: row.delta > 0 ? "#00d4ff18" : "#ff3cac18",
                  color: row.delta > 0 ? "#00d4ff" : "#ff3cac"
                }}>{row.delta > 0 ? "+" : ""}{row.delta}%</span>
              </div>
            </div>
            <div style={{ height:5, background:"#0d0d1a", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:3, width:`${row.pct}%`, background:"linear-gradient(90deg,#7b2fff,#00d4ff)", transition:"width .5s" }}/>
            </div>
            <div style={{ fontSize:10, color:"#6b6b8a", marginTop:5 }}>{row.calls.toLocaleString()} calls</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
