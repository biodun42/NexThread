import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Smile, User, X, Archive, Plus } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, messagesCollection } from "../Firebase/Firebase";
import { useStateContext } from "../Context/Statecontext";
import { useParams, useNavigate } from "react-router-dom";

const CLOUDINARY_CONFIG = {
  UPLOAD_PRESET: "Posts_For_NexThread",
  CLOUD_NAME: "df4f0usnh",
  UPLOAD_URL: `https://api.cloudinary.com/v1_1/df4f0usnh/image/upload`,
};

const MessageSection = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { user } = useStateContext();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { contactId } = useParams();
  const navigate = useNavigate();

  // Fetch all users initially and set up real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Users"), (snapshot) => {
      const contactsList = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((contact) => contact.id !== user); // Exclude current user

      setContacts(contactsList);
      setFilteredContacts(contactsList);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time search filtering
  useEffect(() => {
    const filtered = contacts.filter(
      (contact) =>
        contact.Name &&
        contact.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  // Fetch messages for selected contact
  useEffect(() => {
    if (contactId) {
      const selected = contacts.find((contact) => contact.id === contactId);
      setSelectedContact(selected);

      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("participants", "array-contains", user),
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
  }, [contactId, user, contacts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      await sendMessage({
        type: "image",
        content: data.secure_url,
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
      const participants = [user, selectedContact.id].sort();
      await addDoc(collection(db, messagesCollection), {
        sender: user,
        receiver: selectedContact.id,
        participants,
        ...messageContent,
        timestamp: serverTimestamp(),
        status: "sent",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const ContactList = ({ contacts, onSelect }) => (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence>
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
              selectedContact?.id === contact.id
                ? "bg-violet-500/20"
                : "hover:bg-gray-700/50"
            }`}
            onClick={() => {
              onSelect(contact);
              navigate(`/messages/${contact.id}`);
            }}
          >
            {contact.ProfilePicture ? (
              <img
                src={contact.ProfilePicture}
                alt={contact.Name}
                className="w-12 h-12 object-cover rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-full shadow-2xl">
                <h1 className="text-white text-2xl">{contact.Initials}</h1>{" "}
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium">{contact.Name}</h4>
              <p className="text-sm text-white/50">{contact.status}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700/50 rounded-xl p-3 pl-10 text-white focus:outline-none"
          />
          <User className="absolute left-3 top-3 text-white/40" size={20} />
        </div>

        <ContactList
          contacts={filteredContacts}
          onSelect={(contact) => {
            setSelectedContact(contact);
            setShowNewChatModal(false);
            setShowMobileMenu(false);
            history.push(`/messages/${contact.id}`);
          }}
        />
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

            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700/50 rounded-xl p-3 pl-10 text-white focus:outline-none"
                />
                <User
                  className="absolute left-3 top-3 text-white/40"
                  size={20}
                />
              </div>
            </div>

            <ContactList
              contacts={filteredContacts}
              onSelect={(contact) => {
                setSelectedContact(contact);
                setShowMobileMenu(false);
                history.push(`/messages/${contact.id}`);
              }}
            />
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
            <div className="p-4 bg-gray-800 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  className="md:hidden text-white/60 hover:text-white"
                  onClick={() => setShowMobileMenu(true)}
                >
                  <Archive size={20} />
                </button>
                {selectedContact.ProfilePicture ? (
                  <img
                    src={selectedContact.ProfilePicture}
                    alt={selectedContact.Name}
                    className="w-12 h-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-full shadow-2xl">
                    <h1 className="text-white text-2xl">
                      {selectedContact.Initials}
                    </h1>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{selectedContact.Name}</h3>
                  <p className="text-sm text-white/50">
                    {selectedContact.status || "Online"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      x: message.sender === user ? 20 : -20,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${
                      message.sender === user ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl backdrop-blur-sm ${
                        message.sender === user
                          ? "bg-violet-500/90 text-white"
                          : "bg-gray-700/90 text-white"
                      }`}
                    >
                      {message.type === "image" ? (
                        <img
                          src={message.content}
                          alt="Shared image"
                          className="max-w-full rounded-lg max-h-64 object-cover"
                        />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-800 border-t border-white/10">
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
                    className="w-full bg-gray-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-white/30"
                  />
                </div>
                <motion.button
                  onClick={() => sendMessage()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-violet-500 text-white p-3 rounded-full hover:bg-violet-600"
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>
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

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 bg-gray-800 rounded-xl p-4 shadow-lg border border-white/10 w-72"
          >
            <div className="grid grid-cols-4 gap-2">
              {["😊", "😂", "❤️", "👍", "😍", "🎉", "🔥", "👋"].map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-gray-700 rounded-lg text-2xl"
                  onClick={() => {
                    setNewMessage((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <AnimatePresence>{showNewChatModal && <NewChatModal />}</AnimatePresence>
    </motion.div>
  );
};

export default MessageSection;
