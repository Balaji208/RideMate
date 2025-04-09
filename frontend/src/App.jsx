import { BrowserRouter } from "react-router-dom";
import "./App.css";
import AllRoutes from "./routes/AllRoutes";
import { ToastContainer } from "react-toastify";
import { HeroUIProvider } from "@heroui/react";
function App() {
  return (
    <>
      <BrowserRouter>
        
          <AllRoutes />
          <ToastContainer />
      </BrowserRouter>
    </>
  );
}

export default App;
