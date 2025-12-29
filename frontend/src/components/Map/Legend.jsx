// src/components/Map/Legend.jsx
import React from "react";
import "../../styles/Legend.css";

const LEGEND_ITEMS = [
  { type: "Verre", color: "#2196F3", emoji: "🔵" },
  { type: "Papier", color: "#FF9800", emoji: "🟠" },
  { type: "Plastique", color: "#4CAF50", emoji: "🟢" },
  { type: "Ordures", color: "#9C27B0", emoji: "🟣" },
];

export default function Legend() {
  return (
    <div className="legend-container">
      <div className="legend-items">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="legend-item">
            <div
              className="legend-dot"
              style={{ backgroundColor: item.color }}
              title={item.type}
            />
            <span className="legend-label">{item.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
