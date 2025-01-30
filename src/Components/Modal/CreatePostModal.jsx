import React, { useState, useRef } from "react";
import {
  X,
  Image,
  Hash,
  AtSign,
  Globe2,
  Lock,
  Users,
  Smile,
  Link2,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [hashtags, setHashtags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [isMentioning, setIsMentioning] = useState(false);
  const [isHashtagging, setIsHashtagging] = useState(false);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);

    // Handle hashtags
    if (text.endsWith("#")) {
      setIsHashtagging(true);
      setIsMentioning(false);
    } else if (isHashtagging && text.endsWith(" ")) {
      setIsHashtagging(false);
    }

    // Handle mentions
    if (text.endsWith("@")) {
      setIsMentioning(true);
      setIsHashtagging(false);
    } else if (isMentioning && text.endsWith(" ")) {
      setIsMentioning(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36),
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 4)); // Limit to 4 images
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;

    const postData = {
      content,
      images,
      privacy,
      hashtags,
      mentions,
      timestamp: new Date(),
    };

    onSubmit(postData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setContent("");
    setImages([]);
    setPrivacy("public");
    setHashtags([]);
    setMentions([]);
  };

  const privacyOptions = {
    public: { icon: Globe2, label: "Public" },
    friends: { icon: Users, label: "Friends" },
    private: { icon: Lock, label: "Private" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Create Post</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                className="w-full h-32 bg-gray-800 text-white rounded-lg p-3 resize-none focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tools */}
              <div className="flex items-center justify-between mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Image size={20} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Smile size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <Hash size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <AtSign size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <Link2 size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                    <Camera size={20} />
                  </button>
                </div>

                {/* Privacy Selector */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setPrivacy((prev) =>
                        prev === "public"
                          ? "friends"
                          : prev === "friends"
                          ? "private"
                          : "public"
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    {React.createElement(privacyOptions[privacy].icon, {
                      size: 16,
                    })}
                    <span>{privacyOptions[privacy].label}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() && images.length === 0}
                className="w-full py-2 px-4 bg-violet-600 text-white rounded-lg font-medium
                  hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
