import { BrowserRouter } from "react-router-dom";
import "./App.css";
import AllRoutes from "./routes/AllRoutes";
import { ToastContainer } from "react-toastify";
import { HeroUIProvider } from "@heroui/react";
function App() {
  return (
    <>
      <BrowserRouter>
        <HeroUIProvider>
          <AllRoutes />
          <ToastContainer />
        </HeroUIProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
