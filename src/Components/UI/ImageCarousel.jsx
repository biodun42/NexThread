import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const ImageCarousel = ({
  images,
  post,
  likes = 0,
  comments = [],
  onComment,
  onLike,
  onShare,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [doubleTapLike, setDoubleTapLike] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setShowControls(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setIsLiked(true);
      onLike?.();
      setDoubleTapLike(true);
      setTimeout(() => setDoubleTapLike(false), 1000);
    }
    lastTap.current = now;
  };

  const handleSwipe = (direction) => {
    if (direction === "left" && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === "right" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleSwipe("left");
      } else {
        handleSwipe("right");
      }
      setTouchStart(null);
    }
  };

  const navigate = (path) => {
    window.location.href = path;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500 cursor-pointer"
              onClick={() => navigate(`/profile/${post.userId}`)}
            >
              {post.userProfilePic ? (
                <img
                  src={post.userProfilePic}
                  alt={post.Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  {post.initials}
                </div>
              )}
            </motion.div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div>
            <motion.p
              whileHover={{ color: "#60A5FA" }}
              className="font-semibold text-gray-900 dark:text-white cursor-pointer"
              onClick={() => navigate(`/profile/${post.userId}`)}
            >
              {post.Name}
            </motion.p>
            <div className="flex items-center text-xs text-gray-500">
              <Globe className="w-3 h-3 mr-1" />
              <span>
                {formatDistanceToNow(new Date(post.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </motion.button>
      </div>

      {/* Image Carousel */}
      <div
        ref={containerRef}
        className="relative bg-black aspect-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onClick={handleDoubleTap}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex].url}
            alt={`Post ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </AnimatePresence>

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {doubleTapLike && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-32 h-32 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && showControls && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 backdrop-blur-sm ${
                currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => handleSwipe("right")}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 backdrop-blur-sm ${
                currentIndex === images.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => handleSwipe("left")}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </>
        )}

        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
            {images.map((_, index) => (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  width: index === currentIndex ? "1rem" : "0.25rem",
                  backgroundColor:
                    index === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                }}
                className="h-1 rounded-full transition-all duration-300"
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => {
                setIsLiked(!isLiked);
                onLike?.();
              }}
              className="p-1"
            >
              <Heart
                className={`w-6 h-6 ${
                  isLiked
                    ? "text-red-500 fill-red-500"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              onClick={onComment}
              className="p-1"
            >
              <MessageCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              onClick={onShare}
              className="p-1"
            >
              <Share className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => setIsSaved(!isSaved)}
            className="p-1"
          >
            <Bookmark
              className={`w-6 h-6 ${
                isSaved
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            />
          </motion.button>
        </div>

        {/* Likes */}
        <motion.p
          className="font-semibold text-gray-900 dark:text-white mb-2"
          initial={false}
          animate={{ scale: likes > 0 ? [1, 1.1, 1] : 1 }}
        >
          {likes === 0
            ? "Be the first to like this"
            : `${likes.toLocaleString()} likes`}
        </motion.p>

        {/* Caption */}
        {post?.content && (
          <p className="text-gray-800 dark:text-gray-200 mb-2">
            <span className="font-semibold mr-2">{post.Name}</span>
            {post.content}
          </p>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <motion.button
            whileHover={{ x: 5 }}
            onClick={onComment}
            className="text-gray-500 text-sm mb-2"
          >
            View all {comments.length} comments
          </motion.button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 uppercase">
          {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default ImageCarousel;
