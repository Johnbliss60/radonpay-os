export default function Card({ children, glow, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:"#08080f",
      border:`1px solid ${glow ? glow+"33" : "#1a1a2e"}`,
      borderRadius:12,
      boxShadow: glow ? `0 0 28px ${glow}18` : "none",
      transition:"all .2s",
      ...style
    }}>
      {children}
    </div>
  );
}
