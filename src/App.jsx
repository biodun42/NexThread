import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./Pages/Home";
import PageNotFound from "./Pages/PageNotFound";
import Auth from "./Pages/Auth";
import Message from "./Pages/Message";
import Profile from "./Pages/Profile";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/message" element={<Message />} />
        <Route path="/message/:userId" element={<Message />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/404" element={<PageNotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
