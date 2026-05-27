import { useState } from "react";
import Card from "../../components/Card";
import Dot from "../../components/Dot";

const INIT = [
  { id:"α", name:"Orchestrator Alpha", budget:"0.500", spent:"0.312", tasks:14, status:"running"   },
  { id:"β", name:"Sub-Agent Beta",     budget:"0.100", spent:"0.098", tasks:6,  status:"critical"  },
  { id:"γ", name:"Data Crawler Gamma", budget:"0.250", spent:"0.044", tasks:3,  status:"idle"      },
  { id:"δ", name:"NLP Worker Delta",   budget:"0.150", spent:"0.150", tasks:9,  status:"exhausted" },
];
const SC = { running:"#00d4ff", critical:"#ffd166", idle:"#9999bb", exhausted:"#ff3cac" };

export default function Broker() {
  const [agents, setAgents] = useState(INIT);
  const [spawning, setSpawning] = useState(false);
  const extras = ["ε","ζ","η","θ"];
  function spawn() {
    setSpawning(true);
    setTimeout(() => {
      const n = agents.length - 4;
      setAgents(prev => [...prev, { id:extras[n]||`${prev.length}`, name:`Worker ${extras[n]||prev.length}`, budget:"0.200", spent:"0.000", tasks:0, status:"idle" }]);
      setSpawning(false);
    }, 1200);
  }
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:"#f0eeff", fontFamily:"Georgia,serif", marginBottom:4 }}>Payment Broker</div>
          <div style={{ fontSize:12, color:"#6b6b8a" }}>Orchestrate agents with USDC micro-budgets.</div>
        </div>
        <button onClick={spawn} disabled={spawning} style={{
          padding:"10px 18px", borderRadius:8, border:"none", cursor:"pointer",
          background: spawning ? "#1a1a2e" : "linear-gradient(135deg,#7b2fff,#ff3cac)",
          color:"#fff", fontWeight:700, fontSize:12, fontFamily:"monospace", letterSpacing:1, flexShrink:0
        }}>{spawning ? "SPAWNING…" : "+ SPAWN"}</button>
      </div>
      <div style={{ display:"grid", gap:12 }}>
        {agents.map(a => {
          const pct = (parseFloat(a.spent)/parseFloat(a.budget))*100;
          const sc = SC[a.status];
          return (
            <Card key={a.id} glow={sc} style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:8, flexShrink:0, background:`${sc}18`, border:`1px solid ${sc}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:sc, fontFamily:"Georgia,serif" }}>{a.id}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f0eeff" }}>{a.name}</div>
                    <div style={{ fontSize:11, color:"#6b6b8a" }}>{a.tasks} tasks</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Dot color={sc} size={7}/>
                  <span style={{ fontSize:10, color:sc, textTransform:"uppercase", fontFamily:"monospace" }}>{a.status}</span>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:11, color:"#6b6b8a" }}>Budget</span>
                <span style={{ fontSize:11, color:"#f0eeff", fontFamily:"monospace" }}>${a.spent} / ${a.budget}</span>
              </div>
              <div style={{ height:5, background:"#0d0d1a", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background: pct>90 ? "linear-gradient(90deg,#7b2fff,#ff3cac)" : pct>70 ? "linear-gradient(90deg,#7b2fff,#ffd166)" : "linear-gradient(90deg,#7b2fff,#00d4ff)", transition:"width .6s" }}/>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
