import { useEffect, useState } from "react";

export default function App() {
  const [msg, setMsg] = useState("loading…");

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    fetch(`${base}/api/hello`)
      .then((r) => r.json())
      .then((d) => setMsg(d.message))
      .catch(() => setMsg("API unreachable"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: 40 }}>
      <h1>{msg}</h1>
      <p>React + TypeScript + Flask + Docker 🎉</p>
    </div>
  );
}
