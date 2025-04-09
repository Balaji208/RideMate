import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import 'remixicon/fonts/remixicon.css'
import App from "./App.jsx";
import RiderContext from "./context/rider/RiderContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RiderContext>
      <App />
    </RiderContext>
  </StrictMode>
);
