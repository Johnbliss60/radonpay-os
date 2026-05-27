export default function Dot({ color = "#00d4ff", size = 8 }) {
  return (
    <span style={{ position:"relative", display:"inline-block", width:size, height:size, flexShrink:0 }}>
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, animation:"ping 1.8s ease-in-out infinite", opacity:.4 }}/>
      <span style={{ position:"absolute", inset:1, borderRadius:"50%", background:color }}/>
    </span>
  );
}
