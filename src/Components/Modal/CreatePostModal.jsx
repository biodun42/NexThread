import { useState, useRef, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import {
  db,
  notificationsCollection,
  usersCollection,
} from "../Firebase/Firebase";
import { useStateContext } from "../Context/Statecontext";
import {
  Camera,
  X,
  AtSign,
  Globe,
  Users,
  Lock,
  Image as ImageIcon,
  Send,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import MessageAlert from "../UI/MessageAlert";

const CreatePostModal = ({ isOpen, onClose }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [isMentioning, setIsMentioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // Constants and refs (same as original)
  const MAX_CHAR_COUNT = 500;
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
  const MAX_IMAGES = 4;
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);
  const { user } = useStateContext();

  const CLOUDINARY_CONFIG = {
    UPLOAD_PRESET: "Posts_For_NexThread",
    CLOUD_NAME: "df4f0usnh",
    get UPLOAD_URL() {
      return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
    },
  };

  // Fetch users and hashtags on modal open
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Monitor content changes for mentions and hashtags
  useEffect(() => {
    const lastWord = content.split(" ").pop();
    setIsMentioning(lastWord.startsWith("@"));
    setCharCount(content.length);
  }, [content]);

  // Fetch users for mentions
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersQuery = query(collection(db, "Users"), limit(10));
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestedUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load user suggestions");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  // Create image preview
  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: `preview-${Date.now()}`,
          file,
          preview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle files (both for drop and input)
  const handleFiles = async (files) => {
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setError("");

    // Create previews first
    const newPreviews = await Promise.all(
      files.map((file) => createImagePreview(file))
    );
    setPreviewImages((prev) => [...prev, ...newPreviews]);

    // Upload images
    for (const preview of newPreviews) {
      try {
        const updateProgress = (progress) => {
          setImageUploadProgress((prev) => ({
            ...prev,
            [preview.file.name]: progress,
          }));
        };

        const imageData = await uploadImageToCloudinary(
          preview.file,
          updateProgress
        );
        setImages((prev) => [...prev, { ...imageData, file: preview.file }]);

        // Remove preview after successful upload
        setPreviewImages((prev) => prev.filter((p) => p.id !== preview.id));

        setImageUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[preview.file.name];
          return newProgress;
        });
      } catch (err) {
        setError(err.message);
        // Remove failed preview
        setPreviewImages((prev) => prev.filter((p) => p.id !== preview.id));
        setImageUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[preview.file.name];
          return newProgress;
        });
      }
    }
  };

  // Image validation
  const validateImage = (file) => {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        `Image size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      );
    }
    return true;
  };

  // Image upload to Cloudinary
  const uploadImageToCloudinary = async (file, progressCallback) => {
    try {
      validateImage(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CONFIG.CLOUD_NAME);
      formData.append("folder", "NexThread");

      const uploadId = `${Date.now()}_${file.name}`;
      progressCallback(0);

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", CLOUDINARY_CONFIG.UPLOAD_URL);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            progressCallback(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });

      return {
        id: response.public_id,
        url: response.secure_url,
        width: response.width,
        height: response.height,
        format: response.format,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setError("");

    for (const file of files) {
      try {
        const updateProgress = (progress) => {
          setImageUploadProgress((prev) => ({
            ...prev,
            [file.name]: progress,
          }));
        };

        const imageData = await uploadImageToCloudinary(file, updateProgress);
        setImages((prev) => [...prev, { ...imageData, file }]);

        setImageUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      } catch (err) {
        setError(err.message);
        setImageUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
  };

  // Remove image
  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Add mention
  const addMention = (username) => {
    const words = content.split(" ");
    words[words.length - 1] = `@${username} `;
    const newContent = words.join(" ");
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
    }
    setIsMentioning(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate input
    if (!content.trim() && images.length === 0) {
      setError("Please add some content or images to your post");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a post");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const extractedMentions = [
        ...new Set(content.match(/@[\w]+/g) || []),
      ].map((mention) => mention.slice(1));

      // Validate and format images
      const formattedImages = images.map((img) => ({
        id: img.id,
        url: img.url,
        width: img.width,
        height: img.height,
        format: img.format,
      }));

      const userDoc = await getDoc(doc(usersCollection, user));
      const postId = uuidv4(); // Generate a unique ID for the post

      // Create post data object
      const postData = {
        key: Math.random().toString(36).substr(2, 9),
        postId: postId,
        content: content.trim(),
        images: formattedImages,
        privacy,
        mentions: extractedMentions,
        timestamp: new Date().toLocaleString(),
        userId: user,
        userName: userDoc.data().Name || "",
        userProfilePic: userDoc.data().ProfilePicture || "",
        initials: userDoc.data().Initials || "",
        Name: userDoc.data().Name || "",
        likes: [],
        shares: 0,
      };

      // Add post to Firestore
      const postsCollection = collection(db, "Posts");
      const usersPostsRef = doc(postsCollection, postId);
      const userDocSnapshot = await getDoc(usersPostsRef);
      const existingPosts = userDocSnapshot.exists()
        ? userDocSnapshot.data().posts
        : [];
      await setDoc(
        usersPostsRef,
        { posts: [...existingPosts, postData] },
        { merge: true }
      );

      // Notify mentioned users
      const notificationUpdates = extractedMentions.map(async (mention) => {
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("Username", "==", mention));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const mentionedUser = querySnapshot.docs[0];
          await addDoc(notificationsCollection, {
            userId: mentionedUser.id,
            type: "mention",
            postId: usersPostsRef.id,
            fromUser: user,
            fromUserName: userDoc.data().Name || "",
            content:
              content.substring(0, 100) + (content.length > 100 ? "..." : ""),
            timestamp: new Date(),
            read: false,
          });
        }
      });

      // Wait for all updates to complete
      await Promise.all(notificationUpdates);

      // Show success message and reset form
      setAlertMessage("Post created successfully! 🎉");
      setShowAlert(true);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.message || "Failed to create post. Please try again.");

      // Show error alert
      setAlertMessage("Failed to create post");
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Reset form
  const resetForm = () => {
    setContent("");
    setImages([]);
    setPrivacy("public");
    setCharCount(0);
    setError("");
    setImageUploadProgress({});
    setIsMentioning(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="sidebar relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/30"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 backdrop-blur-md bg-gray-900/80 border-b border-gray-700/30">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                  Create Post
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 hover:bg-gray-800/80 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Content Area */}
              <div className="p-4 space-y-4">
                {/* Text Input */}
                <div className="relative group">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHAR_COUNT) {
                        setContent(e.target.value);
                        setCharCount(e.target.value.length);
                      }
                    }}
                    placeholder="What's on your mind?"
                    className="w-full min-h-[120px] bg-gray-800/30 text-white rounded-xl p-4 resize-none border border-gray-700/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-500"
                    disabled={isSubmitting}
                  />
                  <motion.span
                    animate={{
                      color:
                        charCount > MAX_CHAR_COUNT * 0.9
                          ? "#f87171"
                          : "#9ca3af",
                    }}
                    className="absolute bottom-3 right-3 text-sm"
                  >
                    {charCount}/{MAX_CHAR_COUNT}
                  </motion.span>
                </div>

                {/* Image Upload Area */}
                <motion.div
                  animate={{
                    borderColor: dragOver ? "#8b5cf6" : "rgb(55, 65, 81)",
                    backgroundColor: dragOver
                      ? "rgba(139, 92, 246, 0.1)"
                      : "transparent",
                  }}
                  className="relative rounded-xl border-2 border-dashed p-6 transition-colors duration-200"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    className="hidden"
                  />
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-violet-500" />
                    <p className="text-gray-300 mb-2">
                      Drag and drop images here or{" "}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Max {MAX_IMAGES} images • {MAX_IMAGE_SIZE / (1024 * 1024)}
                      MB each
                    </p>
                  </div>
                </motion.div>

                {/* Image Preview Grid */}
                <AnimatePresence>
                  {(images.length > 0 || previewImages.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {[...previewImages, ...images].map((img, index) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative group rounded-xl overflow-hidden bg-gray-800/30"
                        >
                          <img
                            src={img.preview || img.url}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => removeImage(img.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors duration-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {imageUploadProgress[img?.file?.name] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <div className="text-white text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                <span className="font-medium">
                                  {imageUploadProgress[img.file.name]}%
                                </span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tools Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting || images.length >= MAX_IMAGES}
                      className="p-2 text-gray-400 hover:text-white hover:bg-violet-500/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Add images"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsMentioning(true)}
                      disabled={isSubmitting}
                      className="p-2 text-gray-400 hover:text-white hover:bg-violet-500/20 rounded-lg transition-all duration-200"
                      title="Mention user"
                    >
                      <AtSign className="w-5 h-5" />
                    </button>
                  </div>

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
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                  >
                    {privacy === "public" ? (
                      <Globe className="w-4 h-4" />
                    ) : privacy === "friends" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span className="capitalize text-white">{privacy}</span>
                  </button>
                </div>

                {/* Mentions Panel */}
                <AnimatePresence>
                  {isMentioning && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-2 p-2 bg-gray-800/30 rounded-xl border border-gray-700/30 max-h-48 overflow-y-auto backdrop-blur-sm"
                    >
                      {isLoadingUsers ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        </div>
                      ) : (
                        suggestedUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => addMention(user.Username)}
                            className="flex items-center gap-3 w-full p-3 hover:bg-violet-500/10 rounded-lg transition-all duration-200"
                          >
                            {user.ProfilePicture ? (
                              <img
                                src={user.ProfilePicture}
                                alt=""
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-medium">
                                {user.Username?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="text-left">
                              <div className="text-white font-medium">
                                {user.Name}
                              </div>
                              <div className="text-gray-400 text-sm">
                                @{user.Username}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-4 border-t border-gray-700/30 backdrop-blur-md bg-gray-900/80">
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || (!content.trim() && images.length === 0)
                  }
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating post...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
          <MessageAlert
            message={alertMessage}
            isVisible={showAlert}
            onClose={() => setShowAlert(false)}
            type={alertMessage.includes("successfully") ? "success" : "error"}
            position={alertMessage.includes("successfully") ? "bottom" : "top"}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
