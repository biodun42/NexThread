import { motion } from "framer-motion";
import { Home, Cloud, CloudRain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
      },
    },
  };

  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.2,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {i % 2 === 0 ? (
              <Cloud className="text-gray-600 w-12 h-12" />
            ) : (
              <CloudRain className="text-gray-600 w-12 h-12" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 404 Text */}
        <motion.h1
          className="text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-orange-500"
          variants={itemVariants}
        >
          404
        </motion.h1>

        {/* Headings and text */}
        <motion.h2
          className="text-2xl md:text-3xl font-semibold mt-6"
          variants={itemVariants}
        >
          Page Not Found
        </motion.h2>
        <motion.p
          className="text-base md:text-lg mt-4 text-gray-300"
          variants={itemVariants}
        >
          Sorry, the page you're looking for doesn't exist.
        </motion.p>

        {/* Button */}
        <motion.button
          className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-600 text-white font-bold text-base md:text-lg rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center gap-2"
          onClick={() => navigate("/")}
          variants={itemVariants}
        >
          <Home className="w-5 h-5" />
          <span>Go Home</span>
        </motion.button>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-4">
        <p className="text-sm font-medium">
          Social Hub &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default PageNotFound;
