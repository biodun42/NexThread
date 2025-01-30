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
  import { motion, AnimatePresence } from "framer-motion"
  import { auth, usersCollection, db } from "../Firebase/Firebase";


  const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(5); // Example count

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
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

    // Mobile Menu
    const MobileMenu = () => (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="sidebar flex-1 overflow-y-auto p-2">
            {[...menuItems, ...secondaryItems].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg mb-2"
              >
                <item.icon size={24} />
                <span className="text-lg">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-white/10 rounded-lg"
            >
              <LogOut size={24} />
              <span className="text-lg">Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
    );

    const handleLogout = async () => {
      try {
        await auth.signOut();
        navigate("/");
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    // Desktop Sidebar
    const DesktopSidebar = () => (
      <div className="h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 overflow-hidden border-r border-gray-800">

        <div className="flex flex-col gap-2 p-3">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all relative
                ${
                  location.pathname === item.path
                    ? "bg-violet-500/20 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <item.icon size={24} />
              <span>
                {item.label}
              </span>
              {item.badge && (
                <span className="absolute top-2 left-8 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-gray-800">
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
                <span>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    // Mobile Bottom Navigation
    const MobileNavigation = () => (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-gray-800 border-t border-gray-800">
        <div className="flex justify-around items-center p-2">
          {menuItems.slice(0, 5).map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`p-3 relative ${
                location.pathname === item.path ? "text-white" : "text-gray-400"
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
            className="p-3 text-gray-400"
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
