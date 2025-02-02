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
  postsCollection,
  notificationsCollection,
  usersCollection,
} from "../Firebase/Firebase";
import { useStateContext } from "../Context/Statecontext";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const CreatePostModal = ({ isOpen, onClose }) => {
  // Existing state
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isHashtagging, setIsHashtagging] = useState(false);
  const [isMentioning, setIsMentioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [charCount, setCharCount] = useState(0);

  // New state for loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // Constants
  const MAX_CHAR_COUNT = 500;
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 5MB
  const MAX_IMAGES = 4;
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  // Cloudinary configuration
  const CLOUDINARY_CONFIG = {
    UPLOAD_PRESET: "Posts_For_NexThread",
    CLOUD_NAME: "df4f0usnh",
    get UPLOAD_URL() {
      return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
    },
  };

  // Refs
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);
  const { user } = useStateContext();

  // Fetch users and hashtags on modal open
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTrendingHashtags();
    }
  }, [isOpen]);

  // Monitor content changes for mentions and hashtags
  useEffect(() => {
    const lastWord = content.split(" ").pop();
    setIsMentioning(lastWord.startsWith("@"));
    setIsHashtagging(lastWord.startsWith("#"));
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

  // Fetch trending hashtags
  const fetchTrendingHashtags = async () => {
    setIsLoadingHashtags(true);
    try {
      const hashtagsQuery = query(collection(db, "Hashtags"), limit(10));
      const snapshot = await getDocs(hashtagsQuery);
      const hashtags = snapshot.docs.map((doc) => ({
        id: doc.id,
        tag: doc.data().tag,
        count: doc.data().count,
      }));
      setSuggestedHashtags(hashtags);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
    } finally {
      setIsLoadingHashtags(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
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

  // Handle content changes
  const handleContentChange = (event) => {
    const newContent = event.target.value;
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
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

  // Insert emoji
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + emoji + content.substring(end);
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }
    setIsEmojiPickerOpen(false);
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

  // Add hashtag
  const addHashtag = (tag) => {
    const words = content.split(" ");
    words[words.length - 1] = `#${tag} `;
    const newContent = words.join(" ");
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
    }
    setIsHashtagging(false);
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
      const extractedHashtags = [
        ...new Set(content.match(/#[\w]+/g) || []),
      ].map((tag) => tag.slice(1));
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
        content: content.trim(),
        images: formattedImages,
        privacy,
        hashtags: extractedHashtags,
        mentions: extractedMentions,
        timestamp: new Date().toLocaleString(),
        userId: user,
        userName: userDoc.data().Name || "",
        userProfilePic: userDoc.data().ProfilePicture || "",
        initials: userDoc.data().Initials || "",
        Name: userDoc.data().Name || "",
        likes: 0,
        comments: 0,
        shares: 0,
      };

      // Add post to Firestore
      const usersPostsRef = doc(postsCollection, user);
      await setDoc(usersPostsRef, { posts: postData }, { merge: true });

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
    setIsEmojiPickerOpen(false);
    setIsHashtagging(false);
    setIsMentioning(false);
  };

  // Filter users for mentions
  const filteredUsers = suggestedUsers.filter((user) =>
    user.Username?.toLowerCase().startsWith(
      content.split(" ").pop().replace("@", "").toLowerCase()
    )
  );

  // Render modal
  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-scroll">
        <div className="w-full max-w-2xl bg-gray-900 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              disabled={isSubmitting}
            >
              <span className="sr-only">Close</span>✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                disabled={isSubmitting}
                className="w-full h-32 bg-gray-800 text-white rounded-lg p-3 resize-none focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
              <span
                className={`absolute bottom-2 right-2 text-sm ${
                  charCount > MAX_CHAR_COUNT * 0.9
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {charCount}/{MAX_CHAR_COUNT}
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-4 p-4 border-2 border-dashed rounded-lg transition-colors ${
                dragOver
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-gray-700 hover:border-violet-500"
              }`}
            >
              <div className="text-center">
                <p className="text-gray-400">
                  Drag and drop images here or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-violet-500 hover:text-violet-400"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Max {MAX_IMAGES} images
                </p>
              </div>
            </div>

            {/* Image Preview Grid */}
            {(images.length > 0 || previewImages.length > 0) && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[...previewImages, ...images].map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview || img.url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="sr-only">Remove image</span>✕
                    </button>
                    {imageUploadProgress[img?.file?.name] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="text-white flex flex-col items-center">
                          <Loader2 className="w-6 h-6 animate-spin mb-2" />
                          {imageUploadProgress[img.file.name]}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions with loading states */}
            {isMentioning && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                {isLoadingUsers ? (
                  <LoadingSpinner />
                ) : (
                  suggestedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => addMention(user.Username)}
                      className="flex items-center gap-2 w-full p-2 hover:bg-gray-700 rounded"
                    >
                      {user.ProfilePicture ? (
                        <img
                          src={user.ProfilePicture}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white">
                          {user.Username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-white">{user.Name}</span>
                      <span className="text-gray-400">@{user.Username}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Hashtag suggestions with loading state */}
            {isHashtagging && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                {isLoadingHashtags ? (
                  <LoadingSpinner />
                ) : (
                  suggestedHashtags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => addHashtag(tag.tag)}
                      className="flex items-center justify-between w-full p-2 hover:bg-gray-700 rounded"
                    >
                      <span className="text-white">#{tag.tag}</span>
                      <span className="text-gray-400">{tag.count} posts</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Tools */}
            <div className="flex items-center justify-between mt-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || images.length >= MAX_IMAGES}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Add images"
                >
                  🖼️
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  multiple
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  className="hidden"
                />
                <button
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  disabled={isSubmitting}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Add emoji"
                >
                  😊
                </button>
                <button
                  onClick={() => setIsHashtagging(true)}
                  disabled={isSubmitting}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Add hashtag"
                >
                  #️⃣
                </button>
                <button
                  onClick={() => setIsMentioning(true)}
                  disabled={isSubmitting}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Mention user"
                >
                  @
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
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg text-white disabled:opacity-50"
                >
                  {privacy === "public"
                    ? "🌐"
                    : privacy === "friends"
                    ? "👥"
                    : "🔒"}
                  <span className="capitalize">{privacy}</span>
                </button>
              </div>
            </div>

            {/* Emoji Picker */}
            {isEmojiPickerOpen && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                <div className="grid grid-cols-8 gap-1">
                  {[
                    "😊",
                    "😂",
                    "🥰",
                    "😎",
                    "🤔",
                    "😅",
                    "😍",
                    "🙌",
                    "👍",
                    "🎉",
                    "💪",
                    "🔥",
                    "❤️",
                    "💯",
                    "✨",
                    "🌟",
                    "😴",
                    "🤩",
                    "🥳",
                    "😇",
                    "🤗",
                    "😋",
                    "😉",
                    "👏",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-xl transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting || (!content.trim() && images.length === 0)
              }
              className="w-full py-2 px-4 bg-violet-600 text-white rounded-lg font-medium
                hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default CreatePostModal;
