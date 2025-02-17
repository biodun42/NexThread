import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Smile, User, X, Plus, ArrowLeft } from "lucide-react";
import {
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db, messagesCollection, usersCollection } from "../Firebase/Firebase";
import { useStateContext } from "../Context/Statecontext";
import { useParams, useNavigate } from "react-router-dom";
import LoadingMessageState from "../LoadingState/LoadingMessageState";

const CLOUDINARY_CONFIG = {
  UPLOAD_PRESET: "Posts_For_NexThread",
  CLOUD_NAME: "df4f0usnh",
  UPLOAD_URL: `https://api.cloudinary.com/v1_1/df4f0usnh/image/upload`,
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const now = new Date();
  const diff = now - date;

  // If less than 24 hours ago, show time
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // If this year, show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  // Otherwise show full date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getPresenceStatus = (contact) => {
  if (!contact) return { status: "offline", text: "Offline" };

  if (contact.isOnline) {
    return {
      status: "online",
      text: "Online",
      color: "bg-green-500",
    };
  } else if (contact.lastSeen) {
    const lastActive = contact.lastSeen.toDate();
    const now = new Date();
    const diff = now - lastActive;

    // If last active within 5 minutes, show as away
    if (diff < 5 * 60 * 1000) {
      return {
        status: "away",
        text: "Away",
        color: "bg-yellow-500",
      };
    }

    // Format last seen time
    const timeAgo = formatTimestamp(lastActive);
    return {
      status: "offline",
      text: `Last seen ${timeAgo}`,
      color: "bg-gray-500",
    };
  }

  return {
    status: "offline",
    text: "Offline",
    color: "bg-gray-500",
  };
};

const MessageSection = ({ setIsChatOpen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [imageFetching, setImageFetching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userFollowing, setUserFollowing] = useState([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const { user } = useStateContext();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { contactId } = useParams();
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  const loadingSpinnerCSS = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
  `;

  // Add this style tag in your component
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = loadingSpinnerCSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Fetch user's following list
  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        // Get references
        const currentUserRef = doc(usersCollection, user);
        const currentUserDoc = await getDoc(currentUserRef);

        if (currentUserDoc.exists()) {
          // Get following list from Users collection
          const following = currentUserDoc.data().following || [];
          setUserFollowing(following);
        }
      } catch (error) {
        console.error("Error fetching following:", error);
      }
    };

    if (user) {
      fetchFollowing();
    }
  }, [user]);

  // Fetch all users initially and set up real-time updates
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        // First get the current user's following list
        const currentUserRef = doc(usersCollection, user);
        const currentUserDoc = await getDoc(currentUserRef);
        const followingList = currentUserDoc.data()?.following || [];
        setUserFollowing(followingList);

        // Set up real-time listener for contacts that the user follows
        const unsubscribe = onSnapshot(collection(db, "Users"), (snapshot) => {
          const contactsList = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(
              (contact) =>
                contact.id !== user && followingList.includes(contact.id)
            );

          setContacts(contactsList);
          setFilteredContacts(contactsList);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (contactId) {
      const selected = contacts.find((contact) => contact.id === contactId);
      setSelectedContact(selected);
      if (isMobile) {
        setShowMobileChat(true);
        setShowMobileMenu(false);
      }
    }
  }, [contactId, contacts]);

  // Real-time search filtering
  useEffect(() => {
    const filtered = contacts.filter(
      (contact) =>
        contact.Name &&
        contact.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  // Replace the existing useEffect for messages
  useEffect(() => {
    if (selectedContactId && user) {
      const participantsArray = [user, selectedContactId].sort();

      const messagesQuery = query(
        messagesCollection,
        where("participants", "==", participantsArray),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
        scrollToBottom();

        // Mark messages as read
        messagesList
          .filter((msg) => msg.receiver === user && !msg.read)
          .forEach(async (msg) => {
            await updateDoc(doc(messagesCollection, msg.id), {
              read: true,
            });
          });
      });

      return () => unsubscribe();
    }
  }, [selectedContactId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update the handleInputChangeForChat function
  const handleInputChangeForChat = (e) => {
    e.preventDefault();
    setNewMessage(e.target.value);
  };

  const handleCloseMobileChat = () => {
    setShowMobileChat(false);
    setShowMobileMenu(true);
    setSelectedContact(null);
    setIsChatOpen(false);
    navigate("/message");
  };

  // Update the existing uploadImageToCloudinary function
  const uploadImageToCloudinary = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlertMessage("Image size should be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setAlertMessage("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Add this function to check if both users follow each other
  const canMessageUser = (contactId) => {
    // Check if both users follow each other
    const currentUserFollowsContact = userFollowing.includes(contactId);
    const contactFollowsCurrentUser =
      contacts.find((c) => c.id === contactId)?.following?.includes(user) ||
      false;

    return currentUserFollowsContact && contactFollowsCurrentUser;
  };

  // Update the sendMessage function to use consistent participant array order
  const sendMessage = async (content = newMessage, type = "text") => {
    if (content.trim() === "" || !selectedContact) return;

    const messageData = {
      content: content,
      sender: user,
      receiver: selectedContact.id,
      participants: [user, selectedContact.id].sort(), // For querying
      timestamp: serverTimestamp(),
      type: type,
      read: false,
    };

    try {
      await addDoc(messagesCollection, messageData);
      if (type === "text") {
        setNewMessage("");
      }
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      setAlertMessage("Failed to send message");
      setTimeout(() => setAlertMessage(""), 3000);
    }
  };

  // Update the fetchUserMessages function
  const fetchUserMessages = async (contactId) => {
    if (!user || !contactId) return [];

    try {
      // Create two queries - one for each direction of messages
      const query1 = query(
        messagesCollection,
        where("sender", "==", user),
        where("receiver", "==", contactId),
        orderBy("timestamp", "asc")
      );

      const query2 = query(
        messagesCollection,
        where("sender", "==", contactId),
        where("receiver", "==", user),
        orderBy("timestamp", "asc")
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(query1),
        getDocs(query2),
      ]);

      // Combine and sort messages from both queries
      const messages1 = snapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const messages2 = snapshot2.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const allMessages = [...messages1, ...messages2].sort((a, b) => {
        const timeA = a.timestamp?.toDate() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate() || new Date(b.timestamp);
        return timeA - timeB;
      });

      return allMessages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };



  // Update MessageBubble component to handle read status
  const MessageBubble = ({ message }) => {
    const isSender = message.sender === user;
    const [showImagePreview, setShowImagePreview] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, x: isSender ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[70%] p-3 rounded-2xl backdrop-blur-sm ${
            isSender
              ? "bg-violet-500/90 text-white"
              : "bg-gray-700/90 text-white"
          }`}
        >
          {message.type === "image" ? (
            <div className="space-y-2">
              <img
                src={message.content}
                alt="Shared image"
                className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer"
                onClick={() => setShowImagePreview(true)}
              />
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>{formatTimestamp(message.timestamp)}</span>
                {isSender && message.read && <span className="ml-2">✓✓</span>}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p>{message.content}</p>
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>{formatTimestamp(message.timestamp)}</span>
                {isSender && message.read && <span className="ml-2">✓✓</span>}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {showImagePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowImagePreview(false)}
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={message.content}
                alt="Full size preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const ChatArea = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex-1 flex flex-col ${
        isMobile && showMobileChat ? "absolute inset-0 z-20 bg-gray-900" : ""
      }`}
    >
      <div className="p-4 bg-gray-800 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={handleCloseMobileChat}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="relative">
              {selectedContact?.ProfilePicture ? (
                <img
                  src={selectedContact.ProfilePicture}
                  alt={selectedContact.Name}
                  className="w-12 h-12 object-cover rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-full">
                  <h1 className="text-white text-2xl">
                    {selectedContact?.Initials}
                  </h1>
                </div>
              )}
              {/* Updated presence indicator */}
              {selectedContact && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
                    getPresenceStatus(selectedContact).color
                  }`}
                />
              )}
            </div>
            <div>
              <h3 className="font-medium text-lg">{selectedContact?.Name}</h3>
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`w-2 h-2 rounded-full ${
                    getPresenceStatus(selectedContact).color
                  }`}
                />
                <p className="text-sm text-white/70">
                  {getPresenceStatus(selectedContact).text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-800 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={uploadImageToCloudinary}
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
              placeholder={
                canMessageUser(selectedContact?.id)
                  ? "Type a message..."
                  : "Both users need to follow each other to message"
              }
              value={newMessage}
              onChange={handleInputChangeForChat}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={!canMessageUser(selectedContact?.id)}
              className="w-full bg-gray-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-white/30 disabled:opacity-50"
            />
          </div>
          <motion.button
            onClick={() => sendMessage()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={!canMessageUser(selectedContact?.id)}
            className="bg-violet-500 text-white p-3 rounded-full hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Update the contact selection handler in ContactList
  const handleContactSelect = async (contact) => {
    if (canMessageUser(contact.id)) {
      setSelectedContact(contact);
      setSelectedContactId(contact.id);
      if (isMobile) {
        setShowMobileChat(true);
        setShowMobileMenu(false);
        setIsChatOpen(true);
      }

      // Fetch initial messages
      const initialMessages = await fetchUserMessages(contact.id);
      setMessages(initialMessages);

      // Set up real-time listener for new messages
      const unsubscribeMessages = onSnapshot(
        messagesCollection,
        where("participants", "array-contains", user),
        (snapshot) => {
          const newMessages = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter(
              (msg) =>
                (msg.sender === user && msg.receiver === contact.id) ||
                (msg.sender === contact.id && msg.receiver === user)
            )
            .sort((a, b) => {
              const timeA = a.timestamp?.toDate() || new Date(a.timestamp);
              const timeB = b.timestamp?.toDate() || new Date(b.timestamp);
              return timeA - timeB;
            });

          setMessages(newMessages);
          scrollToBottom();
        }
      );

      return () => unsubscribeMessages();
    } else {
      setAlertMessage("You need to follow each other to start messaging");
      setTimeout(() => {
        setAlertMessage("");
      }, 3000);
    }
  };

  const ContactList = ({ contacts, onSelect }) => {
    const getLastMessage = (contactId) => {
      const contactMessages = messages.filter((msg) =>
        msg.participants.includes(contactId)
      );
      return contactMessages[contactMessages.length - 1];
    };

    const formatLastMessage = (message) => {
      if (!message) return "";
      if (message.type === "image") return "📷 Image";
      return message.content.length > 25
        ? message.content.substring(0, 25) + "..."
        : message.content;
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {contacts.map((contact) => {
            const lastMessage = getLastMessage(contact.id);
            const hasUnread = messages.some(
              (msg) => msg.sender === contact.id && !msg.read
            );

            return (
              <motion.div
                key={contact.id}
                className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                  selectedContactId === contact.id
                    ? "bg-violet-500/20"
                    : "hover:bg-gray-700/50"
                } ${!canMessageUser(contact.id) ? "opacity-50" : ""}`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="relative">
                  {contact.ProfilePicture ? (
                    <img
                      src={contact.ProfilePicture}
                      alt={contact.Name}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 flex items-center justify-center rounded-full">
                      <h1 className="text-white text-2xl">
                        {contact.Initials}
                      </h1>
                    </div>
                  )}
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full border-2 border-gray-800" />
                  )}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      getPresenceStatus(contact).color
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{contact.Name}</h4>
                    {lastMessage && (
                      <span className="text-xs text-white/50">
                        {formatTimestamp(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm ${
                        hasUnread ? "text-white" : "text-white/50"
                      } truncate`}
                    >
                      {lastMessage ? (
                        <>
                          {lastMessage.sender === user && "You: "}
                          {formatLastMessage(lastMessage)}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    {getPresenceStatus(contact).status === "online" && (
                      <span className="text-xs text-green-400">online</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const NewChatModal = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [modalSearchTerm, setModalSearchTerm] = useState("");

    useEffect(() => {
      const fetchAllUsers = async () => {
        const snapshot = await getDocs(collection(db, "Users"));
        const users = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u) => u.id !== user);
        setAllUsers(users);
        setSearchResults(users);
      };

      fetchAllUsers();
    }, []);

    const handleSearch = (term) => {
      setModalSearchTerm(term);
      const filtered = allUsers.filter((user) =>
        user.Name?.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
    };

    const handleSelectUser = async (contact) => {
      if (canMessageUser(contact.id)) {
        setSelectedContact(contact);
        setShowNewChatModal(false);
        if (isMobile) {
          setShowMobileChat(true);
          setShowMobileMenu(false);
        }
        navigate(`/message/${contact.id}`);
      } else {
        setAlertMessage("Follow each other to start messaging");
        setTimeout(() => {
          setShowNewChatModal(false);
          navigate(`/profile/${contact.id}`);
        }, 2000);
      }
    };

      if (isLoading) {
        return <LoadingMessageState />;
      }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-xl p-6 w-full max-w-md m-4"
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
              value={modalSearchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-700/50 rounded-xl p-3 pl-10 text-white focus:outline-none"
            />
            <User className="absolute left-3 top-3 text-white/40" size={20} />
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {searchResults.map((contact) => (
              <motion.div
                key={contact.id}
                className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-gray-700/50 rounded-xl ${
                  !canMessageUser(contact.id) ? "opacity-50" : ""
                }`}
                onClick={() => handleSelectUser(contact)}
              >
                {/* Contact display content */}
                <div className="flex-1">
                  <h4 className="font-medium">{contact.Name}</h4>
                  <p className="text-sm text-white/50">
                    {canMessageUser(contact.id)
                      ? "Click to message"
                      : "Follow each other to message"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Update the existing handleImageUploadConfirm function
  const handleImageUploadConfirm = async () => {
    if (!selectedFile || !selectedContact) return;
    setImageFetching(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      await sendMessage(data.secure_url, "image");
      scrollToBottom();
    } catch (error) {
      console.error("Error uploading image:", error);
      setAlertMessage("Failed to upload image");
    } finally {
      setImageFetching(false);
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[91.7vh] sm:h-[90vh] md:h-[80vh] lg:h-[89.9vh] bg-gray-900 text-white relative"
    >
      <AnimatePresence>
        {(showMobileMenu || !isMobile) && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className={`${
              isMobile ? "absolute" : "relative"
            } w-full md:w-[380px] bg-gray-800 border-r border-white/10 flex flex-col z-10`}
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
              onSelect={setSelectedContact}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {selectedContact ? (
        <ChatArea />
      ) : (
        !isMobile && (
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
                Select a Conversation
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/30 mt-2"
              >
                Choose a contact from the sidebar to start chatting
              </motion.p>
            </div>
          </motion.div>
        )
      )}

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-4 bg-gray-800 rounded-xl p-4 shadow-lg border border-white/10 w-72 z-30"
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

      {alertMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          {alertMessage}
        </motion.div>
      )}

      {/* Image Upload Preview Modal */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Send Image</h3>
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
                {imageFetching && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="loading-spinner" />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImageUploadConfirm}
                  disabled={imageFetching}
                  className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageFetching ? "Sending..." : "Send Image"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageSection;
