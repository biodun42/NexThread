import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const goToSlide = (index) => {
    if (!containerRef.current) return;
    const newIndex = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(newIndex);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        goToSlide(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      }
      setTouchStart(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") goToSlide(currentIndex - 1);
    if (e.key === "ArrowRight") goToSlide(currentIndex + 1);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="relative w-full bg-gray-900">
      {/* Main Carousel Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={images[currentIndex].url}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              draggable={false}
            />
            {/* Image Caption */}
            {images[currentIndex].caption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-4 text-center"
              >
                {images[currentIndex].caption}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls - Hidden on mobile */}
      {!isMobile && images.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => goToSlide(currentIndex - 1)}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-sm rounded-full transition-all hover:bg-black/40 ${
              currentIndex === 0
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => goToSlide(currentIndex + 1)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-sm rounded-full transition-all hover:bg-black/40 ${
              currentIndex === images.length - 1
                ? "opacity-0 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.button>
        </>
      )}

      {/* Thumbnail Navigation - Adjusted for better mobile visibility */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex gap-3 bg-black/30 backdrop-blur-sm p-3 rounded-full">
            {images.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
