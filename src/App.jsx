import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./Pages/Home";
import PageNotFound from "./Components/UI/PageNotFound";
import Auth from "./Pages/Auth";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/404" element={<PageNotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
