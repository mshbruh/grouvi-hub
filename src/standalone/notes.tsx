import React from "react";
import ReactDOM from "react-dom/client";
import NotesModule from "../components/modules/NotesModule";
import "../globals.css";

function StandaloneNotes() {
  return (
    <div className="h-screen bg-g-bg overflow-auto">
      <div className="max-w-4xl mx-auto">
        <NotesModule />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StandaloneNotes />
  </React.StrictMode>
);
