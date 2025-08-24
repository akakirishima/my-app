import React from "react";

const DEFAULT_ITEMS = ["タオル", "水筒", "日焼け止め"] as const;

export default function PackingListWidget() {
  return (
    <div className="card card--glass hover-lift">
      <h2 className="card__title">持ち物</h2>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {DEFAULT_ITEMS.map((it) => (
          <li key={it} style={{ marginBottom: 6 }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}