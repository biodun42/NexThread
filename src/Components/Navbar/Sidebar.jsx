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
import { toast } from "react-toastify";
import { useStateContext } from "../Context/Statecontext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const { user } = useStateContext();
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully 🎉");
      navigate("/");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const menuItems = [
    { icon: HomeIcon, label: "Home", path: "/home" },
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
  ];

  const secondaryItems = [
    { icon: PlusCircle, label: "Create", path: "/create" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const SideHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 border-b border-white/10"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500"
      >
        <motion.img
          initial={{ rotate: -180 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.6 }}
          src={Logo}
          alt="NexThread"
          className="w-8 h-8"
        />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-white tracking-tight"
      >
        NexThread
      </motion.h1>
    </motion.div>
  );

  const MenuItem = ({ item, isActive, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <motion.div
        initial={false}
        animate={{
          background: isActive
            ? "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2))"
            : "none",
        }}
        className="absolute inset-0 rounded-xl transition-all duration-300 group-hover:bg-white/10"
      />
      <motion.div
        whileHover={{ x: 5 }}
        className="relative flex items-center gap-4 p-3"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <item.icon
            size={24}
            className={`transition-all duration-300 
              ${
                isActive
                  ? "text-violet-400"
                  : "text-gray-400 group-hover:text-white"
              }`}
          />
        </motion.div>
        <span
          className={`font-medium transition-all duration-300
            ${
              isActive ? "text-white" : "text-gray-400 group-hover:text-white"
            }`}
        >
          {item.label}
        </span>
        {item.badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 rounded-full text-white text-xs"
          >
            {item.badge}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );

  const DesktopSidebar = () => (
    <motion.div
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="h-screen w-64 bg-gradient-to-br from-gray-900 to-gray-800 border-r border-white/10 flex flex-col"
    >
      <SideHeader />

      <motion.div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => navigate(item.path)}
            className="w-full"
          >
            <MenuItem
              item={item}
              isActive={location.pathname === item.path}
              index={index}
            />
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-3 border-t border-white/10 space-y-1"
      >
        {secondaryItems.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => navigate(item.path)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <MenuItem
              item={item}
              isActive={location.pathname === item.path}
              index={index + menuItems.length}
            />
          </motion.button>
        ))}

        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-2 group"
        >
          <div className="relative flex items-center gap-4 p-3 rounded-xl transition-all">
            <motion.div
              initial={false}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 bg-red-500/10"
            />
            <LogOut size={24} className="text-red-400" />
            <span className="font-medium text-red-400">Logout</span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const MobileNavigation = () => (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed z-[100] bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-lg border-t border-white/10"
    >
      <div className="flex justify-around items-center p-2">
        {menuItems.slice(0, 5).map((item, index) => (
          <motion.button
            key={index}
            onClick={() => navigate(item.path)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-3 rounded-xl transition-all duration-300"
          >
            <motion.div
              initial={false}
              animate={{
                background:
                  location.pathname === item.path
                    ? "linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2))"
                    : "none",
              }}
              className="absolute inset-0 rounded-xl transition-opacity duration-300"
            />
            <item.icon
              size={24}
              className={`relative transition-colors duration-300
                ${
                  location.pathname === item.path
                    ? "text-violet-400"
                    : "text-gray-400"
                }`}
            />
            {item.badge && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 rounded-full text-white text-xs"
              >
                {item.badge}
              </motion.span>
            )}
          </motion.button>
        ))}
        <motion.button
          onClick={() => setShowMobileMenu(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-3 rounded-xl transition-all duration-300"
        >
          <div className="absolute inset-0 rounded-xl hover:bg-white/10 transition-colors duration-300" />
          <Menu size={24} className="relative text-gray-400" />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <MobileNavigation />
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 to-gray-800"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <SideHeader />
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowMobileMenu(false)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    >
                      <X size={24} />
                    </motion.button>
                  </div>

                  <motion.div className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {[...menuItems, ...secondaryItems].map((item, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          navigate(item.path);
                          setShowMobileMenu(false);
                        }}
                        className="w-full"
                      >
                        <MenuItem
                          item={item}
                          isActive={location.pathname === item.path}
                          index={index}
                        />
                      </motion.button>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-3 border-t border-white/10"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full group"
                      onClick={handleLogout}
                    >
                      <div className="relative flex items-center gap-4 p-3 rounded-xl transition-all">
                        <motion.div
                          initial={false}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 bg-red-500/10"
                        />
                        <LogOut size={24} className="text-red-400" />
                        <span className="font-medium text-red-400">Logout</span>
                      </div>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <DesktopSidebar />
      )}
    </>
  );
};

export default Sidebar;
