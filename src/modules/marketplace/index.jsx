import { useState } from "react";
import Card from "../../components/Card";
import Dot from "../../components/Dot";
import Pill from "../../components/Pill";

const AGENTS = [
  { id:1, name:"DataFeed Pro",   cat:"Data",  price:"0.000015", calls:14820, rating:4.9, chain:"ETH",  hot:true  },
  { id:2, name:"VectorSearch X", cat:"AI",    price:"0.000008", calls:9340,  rating:4.7, chain:"SOL",  hot:false },
  { id:3, name:"ChainIndexer",   cat:"Infra", price:"0.000032", calls:5210,  rating:4.8, chain:"ARB",  hot:false },
  { id:4, name:"NLP Classifier", cat:"AI",    price:"0.000005", calls:21000, rating:4.6, chain:"ETH",  hot:true  },
  { id:5, name:"PriceOracle",    cat:"Data",  price:"0.000020", calls:7600,  rating:4.9, chain:"BASE", hot:false },
  { id:6, name:"MemoryStore",    cat:"Infra", price:"0.000003", calls:33400, rating:4.5, chain:"SOL",  hot:true  },
];

export default function Marketplace() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const cats = ["All","AI","Data","Infra"];
  const list = filter === "All" ? AGENTS : AGENTS.filter(a => a.cat === filter);
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:900, color:"#f0eeff", fontFamily:"Georgia,serif", marginBottom:4 }}>Agent Marketplace</div>
        <div style={{ fontSize:12, color:"#6b6b8a" }}>x402-compatible APIs. Pay per request, no subscriptions.</div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding:"5px 16px", borderRadius:20, cursor:"pointer",
            border:`1px solid ${filter===c ? "#ff3cac" : "#1a1a2e"}`,
            background: filter===c ? "#ff3cac18" : "transparent",
            color: filter===c ? "#ff3cac" : "#6b6b8a",
            fontSize:12, fontFamily:"monospace", transition:"all .2s"
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display:"grid", gap:12 }}>
        {list.map(a => {
          const open = selected === a.id;
          return (
            <Card key={a.id} glow={open ? "#7b2fff" : null}
              onClick={() => setSelected(open ? null : a.id)}
              style={{ padding:"16px 18px", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#f0eeff", fontFamily:"monospace" }}>{a.name}</span>
                    {a.hot && <Pill color="#ff3cac">HOT</Pill>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Pill color="#9999bb">{a.cat}</Pill>
                    <Pill color="#00d4ff">{a.chain}</Pill>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:"#00d4ff", fontFamily:"monospace" }}>${a.price}</div>
                  <div style={{ fontSize:10, color:"#6b6b8a" }}>per request</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Dot size={6}/><span style={{ fontSize:11, color:"#00d4ff" }}>LIVE</span>
                </div>
                <span style={{ fontSize:11, color:"#6b6b8a" }}>{a.calls.toLocaleString()} calls</span>
                <span style={{ fontSize:11, color:"#ffd166" }}>★ {a.rating}</span>
              </div>
              {open && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #1a1a2e" }}>
                  <button style={{
                    width:"100%", padding:11,
                    background:"linear-gradient(135deg,#7b2fff,#ff3cac)",
                    border:"none", borderRadius:8, color:"#fff",
                    fontWeight:700, fontSize:13, cursor:"pointer",
                    fontFamily:"monospace", letterSpacing:1
                  }}>CONNECT AGENT →</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
