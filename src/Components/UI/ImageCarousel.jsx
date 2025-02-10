import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const goToSlide = (index) => {
    if (!containerRef.current) return;
    setCurrentIndex(index);
    containerRef.current.scrollTo({
      left: index * containerRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="flex overflow-x-hidden snap-x snap-mandatory"
      >
        {images.map((image, index) => (
          <div key={index} className="w-full flex-shrink-0 snap-center">
            <img
              src={image.url}
              alt={`Slide ${index + 1}`}
              className="w-full h-[400px] object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => goToSlide(currentIndex - 1)}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 backdrop-blur-sm rounded-full transition-all hover:bg-black/40 ${
              currentIndex === 0 ? "opacity-0" : "opacity-100"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => goToSlide(currentIndex + 1)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 backdrop-blur-sm rounded-full transition-all hover:bg-black/40 ${
              currentIndex === images.length - 1 ? "opacity-0" : "opacity-100"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;