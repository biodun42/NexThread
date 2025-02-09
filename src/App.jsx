import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./Pages/Home";
import PageNotFound from "./Components/UI/PageNotFound";
import Auth from "./Pages/Auth";
import { useState, useEffect } from "react";
import { auth } from "./Components/Firebase/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Cube } from "react-preloaders";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Cube />;
  }

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/home" /> : <Auth />} 
        />
        <Route 
          path="/home" 
          element={user ? <Home /> : <Navigate to="/" />} 
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
