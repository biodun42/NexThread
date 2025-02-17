import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  Search,
  PlusCircle,
  Bell,
  User2,
  LogOut,
  Menu,
  MessageSquareText,
  Compass,
  Settings,
  X,
} from "lucide-react";
import Logo from "../../assets/logo.svg";
import { auth } from "../Firebase/Firebase";
import { useStateContext } from "../Context/Statecontext";
import MessageAlert from "../UI/MessageAlert";

// Add prop to receive chat state
const Sidebar = ({ isChatOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const { user } = useStateContext();
  const [mounted, setMounted] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Set initial state
    handleResize();
    setMounted(true);

    // Debounced resize handler
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Don't render until we know the device type
  if (!mounted) {
    return null;
  }

  const requireAuth = (action) => {
    if (!user) {
      setAlertMessage(`Please sign in to ${action}`);
      setShowAlert(true);
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setAlertMessage("Logged out successfully");
      setShowAlert(true);
      navigate("/auth");
    } catch (error) {
      setAlertMessage("Error logging out");
      setShowAlert(true);
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Update the menuItems array to only show when user is authenticated
  const menuItems = user
    ? [
        { icon: HomeIcon, label: "Home", path: "/" },
        { icon: Search, label: "Search", path: "/search" },
        { icon: Compass, label: "Explore", path: "/explore" },
        { icon: MessageSquareText, label: "Messages", path: "/message" },
        {
          icon: Bell,
          label: "Notifications",
          path: "/notifications",
          badge: unreadNotifications,
        },
        { icon: User2, label: "Profile", path: `/profile/${user}` },
      ]
    : [
        { icon: HomeIcon, label: "Home", path: "/" },
        { icon: Search, label: "Search", path: "/search" },
        { icon: Compass, label: "Explore", path: "/explore" },
      ];

  const secondaryItems = [
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      onClick: () => {
        if (requireAuth("access settings")) return;
        navigateTo("/settings");
      },
    },
  ];

  const SideHeader = () => (
    <div className="flex items-center gap-4 p-4 border-b border-white/10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500"
      >
        <img src={Logo} alt="NexThread" className="w-8 h-8" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-xl font-bold text-white tracking-tight"
      >
        NexThread
      </motion.h1>
    </div>
  );

  const MenuItem = ({ item, isActive, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="relative group"
    >
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20"
            : "group-hover:bg-white/10"
        }`}
      />
      <div className="relative flex items-center gap-4 p-3">
        <item.icon
          size={24}
          className={`transition-colors duration-200 ${
            isActive
              ? "text-violet-400"
              : "text-gray-400 group-hover:text-white"
          }`}
        />
        <span
          className={`font-medium transition-colors duration-200 ${
            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
          }`}
        >
          {item.label}
        </span>
        {item.badge && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 rounded-full text-white text-xs">
            {item.badge}
          </span>
        )}
      </div>
    </motion.div>
  );

  // Add SignInButton component
  const SignInButton = () => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/auth")}
      className="w-full"
    >
      <div className="relative flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 transition-all">
        <User2 size={24} className="text-white" />
        <span className="font-medium text-white">Sign In</span>
      </div>
    </motion.button>
  );

  // Update DesktopSidebar component
  const DesktopSidebar = () => (
    <motion.div
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-64 bg-gradient-to-br from-gray-900 to-gray-800 border-r border-white/10 flex flex-col"
    >
      <SideHeader />

      <div className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item, index) => (
          <button
            key={item.path}
            onClick={() => navigateTo(item.path)}
            className="w-full"
          >
            <MenuItem
              item={item}
              isActive={location.pathname === item.path}
              index={index}
            />
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-white/10 space-y-1">
        {user ? (
          <>
            {secondaryItems.map((item, index) => (
              <button key={item.path} onClick={item.onClick} className="w-full">
                <MenuItem
                  item={item}
                  isActive={location.pathname === item.path}
                  index={index + menuItems.length}
                />
              </button>
            ))}
            <button onClick={handleLogout} className="w-full mt-2 group">
              <div className="relative flex items-center gap-4 p-3 rounded-xl transition-all group-hover:bg-red-500/10">
                <LogOut size={24} className="text-red-400" />
                <span className="font-medium text-red-400">Logout</span>
              </div>
            </button>
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </motion.div>
  );

  // Update MobileNavigation component
  const MobileNavigation = () => (
    <motion.div
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed z-[100] bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-lg border-t border-white/10 ${
        isChatOpen ? "hidden" : "block"
      }`}
    >
      <div className="flex justify-around items-center p-2">
        {menuItems.slice(0, 5).map((item, index) => (
          <button
            key={item.path}
            onClick={() => navigateTo(item.path)}
            className="relative p-3 rounded-xl transition-all duration-200"
          >
            <div
              className={`absolute inset-0 rounded-xl transition-colors duration-200 ${
                location.pathname === item.path
                  ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20"
                  : "hover:bg-white/10"
              }`}
            />
            <item.icon
              size={24}
              className={`relative transition-colors duration-200 ${
                location.pathname === item.path
                  ? "text-violet-400"
                  : "text-gray-400"
              }`}
            />
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 rounded-full text-white text-xs">
                {item.badge}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="relative p-3 rounded-xl transition-all duration-200"
        >
          <div className="absolute inset-0 rounded-xl hover:bg-white/10 transition-colors duration-200" />
          <Menu size={24} className="relative text-gray-400" />
        </button>
      </div>
    </motion.div>
  );

  const MobileMenu = () => (
    <AnimatePresence>
      {showMobileMenu &&
        !isChatOpen && ( // Add !isChatOpen condition
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-br from-gray-900 to-gray-800 border-l border-white/10"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <SideHeader />
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
                  {[...menuItems, ...secondaryItems].map((item, index) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        item.onClick ? item.onClick() : navigateTo(item.path);
                        setShowMobileMenu(false);
                      }}
                      className="w-full"
                    >
                      <MenuItem
                        item={item}
                        isActive={location.pathname === item.path}
                        index={index}
                      />
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-white/10">
                  <button
                    className="w-full group"
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                  >
                    <div className="relative flex items-center gap-4 p-3 rounded-xl transition-all group-hover:bg-red-500/10">
                      <LogOut size={24} className="text-red-400" />
                      <span className="font-medium text-red-400">Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
  );

  return (
    <>
      {isMobile ? (
        <>
          <MobileNavigation />
          <MobileMenu />
        </>
      ) : (
        <DesktopSidebar />
      )}
      <MessageAlert
        message={alertMessage}
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertMessage.includes("Logged out successfully") ? "success" : "error"}
        position="top"
      />
    </>
  );
};

export default Sidebar;
