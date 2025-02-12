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
  Image,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";

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
      // Extract hashtags and mentions from content

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

      // Create post data object
      const postData = {
        postId: Math.random().toString(36).substr(2, 9),
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
        comments: [],
        shares: 0,
      };

      // Add post to Firestore
      const postsCollection = collection(db, "Posts");
      const usersPostsRef = doc(postsCollection, user);
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
      toast.success("Post created successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.message || "Failed to create post. Please try again.");

      // Show error toast
      toast.error("Failed to create post", {
        position: "top-right",
        autoClose: 3000,
      });
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
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700/50 bg-gray-900/50">
            <h2 className="text-2xl font-bold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors group"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-2 space-y-2">
            {/* Text Input */}
            <div className="relative">
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
                className="w-full min-h-[120px] bg-gray-800/50 text-white rounded-xl p-4 resize-none border border-gray-700/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                disabled={isSubmitting}
              />
              <span
                className={`absolute bottom-3 right-3 text-sm ${
                  charCount > MAX_CHAR_COUNT * 0.9
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {charCount}/{MAX_CHAR_COUNT}
              </span>
            </div>

            {/* Image Upload Area */}
            <div
              ref={dropZoneRef}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed p-8 transition-all ${
                dragOver
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-gray-700 hover:border-violet-500"
              }`}
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
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-2">
                  Drag and drop images here or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-violet-500 hover:text-violet-400 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500">
                  Max {MAX_IMAGES} images • {MAX_IMAGE_SIZE / (1024 * 1024)}MB
                  each
                </p>
              </div>
            </div>

            {/* Image Preview Grid */}
            {(images.length > 0 || previewImages.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {[...previewImages, ...images].map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden"
                  >
                    <img
                      src={img.preview || img.url}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {imageUploadProgress[img?.file?.name] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-white text-center">
                          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="font-medium">
                            {imageUploadProgress[img.file.name]}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tools Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || images.length >= MAX_IMAGES}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50"
                  title="Add images"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsMentioning(true)}
                  disabled={isSubmitting}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
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

            {/* Suggestions Panels */}
            {isMentioning && (
              <div className="mt-2 p-2 bg-gray-800/50 rounded-xl border border-gray-700/50 max-h-48 overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="flex justify-center p-4">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  suggestedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => addMention(user.Username)}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-700/50 rounded-lg transition-all"
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
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700/50">
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting || (!content.trim() && images.length === 0)
              }
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </div>
      </div>
    )
  );
};

export default CreatePostModal;
