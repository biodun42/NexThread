import { useEffect, useState } from "react";
import {
  Menu,
  Bell,
  MessageCircle,
  Search,
  Plus,
  User,
  Settings,
  LogOut,
  Camera,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  auth,
  usersCollection,
  usersFriendsCollection,
  messagesCollection,
} from "../Firebase/Firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "../Modal/CreatePostModal";
import Logo from "../../assets/logo.svg";
import { useStateContext } from "../Context/Statecontext";
import MessageAlert from "./MessageAlert";

const Header = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const {
    user,
    setUser,
    headerMessages: messages,
    setUserProfileData,
  } = useStateContext();
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user ? user.uid : null);
      if (user) {
        const userDocRef = doc(usersCollection, user.uid);
        const unsubscribeUserDoc = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setInitials(userData.Initials);
            setUserAvatar(userData.ProfilePicture || "");
            setName(userData.Name);
            // Set user profile data in context
            setUserProfileData(userData);
          }
        });

        return () => unsubscribeUserDoc();
      } else {
        setUserProfileData(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setUserProfileData]);

  useEffect(() => {
    const CheckForArrays = async () => {
      if (!user) return;

      try {
        const usersFriendRef = doc(usersFriendsCollection, user);
        const usersMessagesRef = doc(messagesCollection, user);

        const usersFriendSnap = await getDoc(usersFriendRef);
        const usersMessagesSnap = await getDoc(usersMessagesRef);

        if (!usersFriendSnap.exists()) {
          await setDoc(usersFriendRef, { friends: [] });
        }

        if (!usersMessagesSnap.exists()) {
          await setDoc(usersMessagesRef, { messages: [] });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    CheckForArrays();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const updateOnlineStatus = async (status) => {
      try {
        const userRef = doc(usersCollection, user);
        await updateDoc(userRef, {
          isOnline: status,
          lastSeen: status ? null : serverTimestamp(),
        });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    // Set online when component mounts
    updateOnlineStatus(true);
    setIsOnline(true);

    // Handle window focus/blur
    const handleVisibilityChange = () => {
      const status = !document.hidden;
      setIsOnline(status);
      updateOnlineStatus(status);
    };

    const handleOnline = () => {
      setIsOnline(true);
      updateOnlineStatus(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateOnlineStatus(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      updateOnlineStatus(false);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

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

  {
    /* User Profile Component */
  }
  const UserProfile = ({ profilePic, initials }) => (
    <div className="user-profile relative">
      {profilePic ? (
        <img
          src={profilePic}
          alt="Profile"
          className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/20"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600
                      flex items-center justify-center text-white font-medium ring-2 ring-white/20"
        >
          {initials}
        </div>
      )}
      <div
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800
        ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
      />
    </div>
  );

  // Mobile Menu Component
  const MobileMenu = () => (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-50 bg-gray-900"
    >
      <div className="flex flex-col h-[92vh]">
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>

        {/* Mobile Menu Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Profile Section */}
          <div
            className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg cursor-pointer"
            onClick={() => navigate(`/profile/${user}`)}
          >
            <UserProfile profilePic={userAvatar} initials={initials} />
            <div>
              <h3 className="text-white font-medium">{name}</h3>
              <p className="text-sm text-gray-400">View Profile</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex items-center justify-center gap-2 p-4 bg-violet-600 text-white rounded-lg"
            >
              <Plus size={20} />
              Create Post
            </button>
          </div>

          {/* Notifications Section */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium">Notifications</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-700 last:border-0"
                >
                  <p className="text-white text-sm">{notification.message}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(
                      notification.timestamp?.toDate()
                    ).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Section */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium">Messages</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border-b border-gray-700 last:border-0"
                >
                  <p className="text-white text-sm">{message.content}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp?.toDate()).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu Footer */}
        <div className="border-t border-gray-800 p-4 space-y-2">
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 p-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <Settings size={20} />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-gray-800 rounded-lg"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-full backdrop-blur-sm bg-black/5">
          <div className="flex items-center justify-between lg:justify-end h-16 px-4">
            {/* Left Section */}
            <div className="lg:hidden flex items-center gap-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                <img src={Logo} alt="NexThread" className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                NexThread
              </h1>
            </div>

            {/* Right Section - Desktop */}
            {!user ? (
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                >
                  Sign In
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg
                    hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </motion.button>

                {/* Stories */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/stories/create")}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Camera className="w-6 h-6 text-white" />
                </motion.button>

                {/* Notifications */}
                <motion.div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
                  >
                    <Bell className="w-6 h-6 text-white" />
                    {notifications.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white
                        text-xs rounded-full flex items-center justify-center"
                      >
                        {notifications.length}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg
                          border border-white/10 overflow-hidden"
                      >
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 hover:bg-white/5 border-b border-white/10 last:border-0"
                          >
                            <p className="text-white text-sm">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(
                                notification.timestamp?.toDate()
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Messages */}
                <motion.div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMessages(!showMessages)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
                  >
                    <MessageCircle className="w-6 h-6 text-white" />
                    {messages.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white
                        text-xs rounded-full flex items-center justify-center"
                      >
                        {messages.length}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showMessages && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg
                          border border-white/10 overflow-hidden"
                      >
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className="p-4 hover:bg-white/5 border-b border-white/10 last:border-0"
                          >
                            <p className="text-white text-sm">
                              {message.content}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(
                                message.timestamp?.toDate()
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Profile */}
                <motion.div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2"
                  >
                    <UserProfile profilePic={userAvatar} initials={initials} />
                  </motion.button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg
                          border border-white/10 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            navigate(`/profile/${user}`);
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/settings");
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && isMobileView && <MobileMenu />}
      </AnimatePresence>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
      />

      {/* Add MessageAlert here */}
      <MessageAlert
        message={alertMessage}
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertMessage.includes("successfully") ? "success" : "error"}
        position="top"
      />
    </>
  );
};

export default Header;
