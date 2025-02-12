import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Image, Smile, MoreVertical, ArrowLeft, Search,
  UserPlus, User, X, Clock, Check, CheckCheck, Archive, Plus,
  BookmarkPlus, Forward, Reply, Trash2, Sticker
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { db } from "../Firebase/Firebase";


const MessageSection = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sticker pack (you can expand this)
  const stickerPack = [
    { id: 1, url: "/stickers/happy.svg" },
    { id: 2, url: "/stickers/sad.svg" },
    { id: 3, url: "/stickers/love.svg" },
    // Add more stickers
  ];

  useEffect(() => {
    // Listen to contacts from Firebase
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const contactsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setContacts(contactsList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      // Listen to messages for selected contact
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("participants", "array-contains", [selectedContact.id]),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [selectedContact]);

  const searchUsers = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("name", ">=", term),
      where("name", "<=", term + "\uf8ff")
    );

    try {
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await sendMessage({
        type: "image",
        content: downloadURL,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const sendMessage = async (messageData = null) => {
    if (!selectedContact) return;

    const messageContent = messageData || {
      type: "text",
      content: newMessage.trim(),
    };

    if (!messageContent.content) return;

    try {
      await addDoc(collection(db, "messages"), {
        sender: "currentUserId", // Replace with actual user ID
        receiver: selectedContact.id,
        participants: ["currentUserId", selectedContact.id],
        ...messageContent,
        timestamp: serverTimestamp(),
        status: "sent",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const MessageContent = ({ message }) => {
    switch (message.type) {
      case "image":
        return (
          <motion.img
            src={message.content}
            alt="Shared image"
            className="max-w-full rounded-lg max-h-64 object-cover"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          />
        );
      case "sticker":
        return (
          <motion.img
            src={message.content}
            alt="Sticker"
            className="w-24 h-24"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          />
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  // New Chat Modal
  const NewChatModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">New Conversation</h3>
          <button
            onClick={() => setShowNewChatModal(false)}
            className="text-white/60 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full bg-gray-700/50 rounded-xl p-3 pl-10 text-white focus:outline-none"
          />
          <Search className="absolute left-3 top-3 text-white/40" size={20} />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Clock size={24} className="mx-auto text-violet-500" />
              </motion.div>
            </div>
          ) : (
            searchResults.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 flex items-center space-x-3 hover:bg-gray-700/50 rounded-lg cursor-pointer"
                onClick={() => {
                  setSelectedContact(user);
                  setShowNewChatModal(false);
                  setShowMobileMenu(false);
                }}
              >
                <img
                  src={user.avatar || "/api/placeholder/50/50"}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-white/50">{user.status}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[90vh] bg-gray-900 text-white relative"
    >
      {/* Contacts Sidebar */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute md:relative w-full md:w-[380px] bg-gray-800 border-r border-white/10 flex flex-col z-10"
          >
            {/* Header with New Chat Button */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <motion.h2
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent"
              >
                Messages
              </motion.h2>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-violet-500 text-white p-2 rounded-full hover:bg-violet-600"
                >
                  <Plus size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/60 hover:text-white"
                >
                  <Archive size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="md:hidden text-white/60 hover:text-white"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            {/* Existing Contact List */}
            {/* ... (keep existing contact list code) ... */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col"
      >
        {selectedContact ? (
          <>
            {/* Chat Header */}
            {/* ... (keep existing chat header code) ... */}

            {/* Messages Area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      x: message.sender === "currentUserId" ? 20 : -20,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${
                      message.sender === "currentUserId"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl backdrop-blur-sm ${
                        message.sender === "currentUserId"
                          ? "bg-violet-500/90 text-white"
                          : "bg-gray-700/90 text-white"
                      }`}
                    >
                      <MessageContent message={message} />
                      {/* ... (keep existing message metadata code) ... */}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </motion.div>

            {/* Message Input */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 bg-gray-800 border-t border-white/10"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white/60 hover:text-white"
                >
                  <Image size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-white/60 hover:text-white"
                >
                  <Smile size={20} />
                </motion.button>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="w-full bg-gray-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-white/30 backdrop-blur-sm"
                  />
                </div>
                <motion.button
                  onClick={() => sendMessage()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-violet-500 text-white p-3 rounded-full hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
                >
                  <Send size={20} />
                </motion.button>
              </div>

              {/* Emoji & Sticker Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-20 right-4 bg-gray-800 rounded-xl p-4 shadow-lg border border-white/10 w-72"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      {stickerPack.map((sticker) => (
                        <motion.button
                          key={sticker.id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 hover:bg-gray-700 rounded-lg"
                          onClick={() => {
                            sendMessage({
                              type: "sticker",
                              content: sticker.url,
                            });
                            setShowEmojiPicker(false);
                          }}
                        >
                          <img
                            src={sticker.url}
                            alt="sticker"
                            className="w-12 h-12"
                          />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center bg-gray-900 text-white/50"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800/50 p-8 rounded-full mb-6 backdrop-blur-sm"
              >
                <User size={48} className="opacity-50" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-medium bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent"
              >
                Start a New Conversation
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/30 mt-2"
              >
                Click the + button to search for users and start chatting
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChatModal(true)}
                className="mt-6 bg-violet-500 text-white px-6 py-3 rounded-full hover:bg-violet-600 transition-colors"
              >
                New Chat
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* New Chat Modal */}
      <AnimatePresence>{showNewChatModal && <NewChatModal />}</AnimatePresence>
    </motion.div>
  );
};

export default MessageSection;