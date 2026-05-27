export default function Pill({ children, color = "#ff3cac" }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 10px", borderRadius:20,
      border:`1px solid ${color}44`, background:`${color}18`,
      color, fontSize:10, fontFamily:"monospace",
      letterSpacing:1, textTransform:"uppercase"
    }}>{children}</span>
  );
}
