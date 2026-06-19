import React from "react";
import ReactDOM from "react-dom/client";
import CardModule from "../components/modules/CardModule";
import "../globals.css";

function StandaloneCards() {
  return (
    <div className="h-screen bg-g-bg overflow-auto">
      <div className="max-w-4xl mx-auto">
        <CardModule />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StandaloneCards />
  </React.StrictMode>
);
