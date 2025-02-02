import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Smile,
  UserRound,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Trending from "../UI/Trending";
import SuggestedFollower from "../UI/SuggestedFollower";
import { db, postsCollection } from "../Firebase/Firebase";
import { getDocs } from "firebase/firestore";

const AdvancedImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Snap to nearest slide
    if (containerRef.current) {
      const slideWidth = containerRef.current.offsetWidth;
      const currentScroll = containerRef.current.scrollLeft;
      const nearestSlide = Math.round(currentScroll / slideWidth);
      setCurrentIndex(nearestSlide);
      containerRef.current.scrollTo({
        left: nearestSlide * slideWidth,
        behavior: "smooth",
      });
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    if (containerRef.current) {
      containerRef.current.scrollLeft += diff;
    }
    setTouchStart(currentTouch);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    containerRef.current?.scrollTo({
      left: index * containerRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group w-full">
      <div
        ref={containerRef}
        className="overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setTouchStart(0)}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          // style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="min-w-full relative"
            >
              <img
                src={image.url}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          onClick={() => goToSlide(currentIndex - 1)}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => goToSlide(currentIndex + 1)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Progress Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white w-4"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const HomeSection = () => {
  // Previous state declarations remain the same
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Constants remain the same
  const MAX_CHAR_COUNT = 500;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_IMAGES = 4;
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  // Previous refs and useEffect remain the same
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsSnapshot = await getDocs(postsCollection);
        const postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data().posts,
        }));
        console.log("Fetched posts:", postsData);
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
      setCharCount(newContent.length);
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

  // Handle files
  const handleFiles = async (files) => {
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validFiles = files.filter(
      (file) =>
        ALLOWED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE
    );

    if (validFiles.length < files.length) {
      setError("Some files were skipped due to invalid type or size");
    }

    // Simulate image upload with progress
    for (const file of validFiles) {
      setImageUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setImageUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
          setImages((prev) => [
            ...prev,
            {
              id: Date.now(),
              url: URL.createObjectURL(file),
              file: file,
            },
          ]);
          setImageUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }, 200);
    }
  };

  // Handle image upload via button
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  // Remove image
  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Insert emoji
  const insertEmoji = (emoji) => {
    const newContent = content + emoji;
    if (newContent.length <= MAX_CHAR_COUNT) {
      setContent(newContent);
      setCharCount(newContent.length);
    }
    setIsEmojiPickerOpen(false);
  };

  // Handle post submission
  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) {
      setError("Please add some content or images to your post");
      return;
    }

    const newPost = {
      id: posts.length + 1,
      user: {
        name: "Current User",
        username: "@currentuser",
        avatar: "/api/placeholder/40/40",
      },
      content,
      images: images.map((img) => img.url),
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date().toISOString(),
      liked: false,
      saved: false,
    };

    setPosts([newPost, ...posts]);
    setContent("");
    setImages([]);
    setCharCount(0);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full px-3 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Feed */}
          <div className="md:col-span-2 space-y-3">
            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserRound className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleContentChange}
                      placeholder="What's on your mind?"
                      className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                    />
                    <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {charCount}/{MAX_CHAR_COUNT}
                    </span>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-3 p-3 border-2 border-dashed rounded-lg transition-colors ${
                      dragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Drag and drop images or{" "}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        browse
                      </button>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {images.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                          {imageUploadProgress[img?.file?.name] !==
                            undefined && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <div className="text-white">
                                {imageUploadProgress[img.file.name]}%
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="mt-2 text-red-500 text-sm">{error}</div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ImageIcon size={20} />
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
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Smile size={20} />
                      </button>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!content.trim() && images.length === 0}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>

                  {/* Emoji Picker */}
                  {isEmojiPickerOpen && (
                    <div className="absolute mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                      <div className="grid grid-cols-8 gap-1">
                        {["😊", "😂", "🥰", "😎", "🤔", "😅", "😍", "🙌"].map(
                          (emoji) => (
                            <button
                              key={emoji}
                              onClick={() => insertEmoji(emoji)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-8">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {/* Post Header */}
                  <div className="p-4 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px]">
                          <div className="w-full h-full rounded-full overflow-hidden">
                            {post.userProfilePic ? (
                              <img
                                src={post.userProfilePic}
                                alt={post.userName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {post.initials}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {post.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {post.timestamp}
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.images && post.images.length > 0 && (
                    <AdvancedImageCarousel images={post.images} />
                  )}

                  {/* Post Actions */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-4">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                          <Heart size={24} />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                          <MessageCircle size={24} />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                          <Share2 size={24} />
                          <span>{post.shares}</span>
                        </button>
                      </div>
                      <button className="text-gray-500 hover:text-yellow-500 transition-colors">
                        <Bookmark size={24} />
                      </button>
                    </div>

                    <p className="text-gray-900 dark:text-white">
                      {post.content}
                    </p>

                    {post.hashtags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.hashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-blue-500 hover:text-blue-600 text-sm cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <Trending />
            <SuggestedFollower />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
