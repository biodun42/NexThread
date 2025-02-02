import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  Heart,
  User,
  LogOut,
  Menu,
  MessageCircle,
  Compass,
  Settings,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../Firebase/Firebase";
import Logo from "../../assets/logo.svg"; // Assumes you have a logo

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    {
      icon: Heart,
      label: "Notifications",
      path: "/notifications",
      badge: unreadNotifications,
    },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const secondaryItems = [
    { icon: Plus, label: "Create", path: "/create" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const SideHeader = () => (
    <div className="flex items-center gap-3 p-3  border-b border-gray-700">
      <img src={Logo} alt="App Logo" className="w-10 h-10 rounded-full" />
      <h1 className="text-xl font-bold text-white tracking-tight">NexThread</h1>
    </div>
  );

  const MobileMenu = () => (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween" }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <SideHeader />
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="sidebar flex-1 overflow-y-auto p-2 space-y-2">
          {[...menuItems, ...secondaryItems].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                navigate(item.path);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center gap-4 p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <item.icon size={24} />
              <span className="text-lg font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 text-red-400 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={24} />
            <span className="text-lg font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const DesktopSidebar = () => (
    <div className="h-screen w-64 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-300 overflow-hidden border-r border-gray-800 flex flex-col">
      <SideHeader />

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all w-full relative
              ${
                location.pathname === item.path
                  ? "bg-violet-500/20 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <item.icon size={24} />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-gray-800 space-y-2">
        {secondaryItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all w-full
              ${
                location.pathname === item.path
                  ? "bg-violet-500/20 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <item.icon size={24} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-3 text-red-400 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut size={24} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-gray-800 border-t border-gray-800 shadow-2xl">
      <div className="flex justify-around items-center p-3">
        {menuItems.slice(0, 5).map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`p-3 relative rounded-full transition-colors ${
              location.pathname === item.path
                ? "text-white bg-violet-500/20"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <item.icon size={24} />
            {item.badge && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-3 text-gray-400 hover:bg-white/10 rounded-full"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <MobileNavigation />
          <AnimatePresence>{showMobileMenu && <MobileMenu />}</AnimatePresence>
        </>
      ) : (
        <DesktopSidebar />
      )}
    </>
  );
};

export default Sidebar;
