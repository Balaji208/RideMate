import { BrowserRouter } from "react-router-dom";
import "./App.css";
import AllRoutes from "./routes/AllRoutes";
import { ToastContainer, toast } from 'react-toastify';
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
