import { useStreams } from "../../hooks/useStreams";
import Card from "../../components/Card";
import Dot from "../../components/Dot";

const COLS = ["#ff3cac","#00d4ff","#7b2fff","#ffd166"];

export default function Streams() {
  const { streams, grandTotal } = useStreams();
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:900, color:"#f0eeff", fontFamily:"Georgia,serif", marginBottom:4 }}>Live Streams</div>
        <div style={{ fontSize:12, color:"#6b6b8a" }}>Real-time nanopayment flows. Gas: $0.00</div>
      </div>
      <div style={{ textAlign:"center", padding:"24px 16px", background:"linear-gradient(135deg,#08080f,#0d0d1a)", border:"1px solid #00d4ff33", borderRadius:12, marginBottom:20 }}>
        <div style={{ fontSize:10, color:"#6b6b8a", letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Total USDC Flowing</div>
        <div style={{ fontSize:36, fontWeight:900, fontFamily:"monospace", color:"#00d4ff" }}>${grandTotal.toFixed(6)}</div>
        <div style={{ fontSize:11, color:"#6b6b8a", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Dot size={6}/>{streams.length} active streams
        </div>
      </div>
      <div style={{ display:"grid", gap:12 }}>
        {streams.map((s, i) => {
          const col = COLS[i % COLS.length];
          return (
            <Card key={s.id} glow={col} style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#6b6b8a", marginBottom:8, fontFamily:"monospace" }}>
                    {s.from} <span style={{ color:col }}>→</span> {s.to}
                  </div>
                  <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:20 }}>
                    {Array.from({ length:24 }, (_, j) => (
                      <div key={j} style={{ width:4, borderRadius:2, background:col, height:4+Math.random()*16, opacity:0.3+Math.random()*0.7 }}/>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:14 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:col, fontFamily:"monospace" }}>${s.amount}</div>
                  <div style={{ fontSize:11, color:"#6b6b8a" }}>{s.rate} req/s</div>
                  <div style={{ fontSize:11, color:"#9999bb", marginTop:3, fontFamily:"monospace" }}>Σ ${s.total.toFixed(6)}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
