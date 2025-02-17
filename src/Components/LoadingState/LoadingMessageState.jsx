import React from "react";
import { motion } from "framer-motion";

const LoadingMessageState = () => {
  const shimmer = {
    animate: {
      background: [
        "rgba(255,255,255,0.02)",
        "rgba(255,255,255,0.06)",
        "rgba(255,255,255,0.02)",
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  const SkeletonMessage = ({ sender }) => (
    <div className={`flex ${sender ? "justify-end" : "justify-start"} mb-4`}>
      <motion.div
        variants={shimmer}
        animate="animate"
        className={`max-w-[70%] h-16 rounded-2xl ${
          sender ? "bg-violet-500/10" : "bg-gray-700/10"
        }`}
      />
    </div>
  );

  return (
    <div className="flex h-[91.7vh] sm:h-[90vh] md:h-[80vh] lg:h-[89.9vh] bg-gray-900 text-white">
      {/* Contacts Sidebar */}
      <div className="relative w-[380px] bg-gray-800 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <motion.div
            variants={shimmer}
            animate="animate"
            className="h-8 w-32 bg-gray-700/10 rounded-lg"
          />
          <motion.div
            variants={shimmer}
            animate="animate"
            className="h-10 w-10 bg-gray-700/10 rounded-full"
          />
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <motion.div
            variants={shimmer}
            animate="animate"
            className="h-12 w-full bg-gray-700/10 rounded-xl"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center space-x-3">
              <motion.div
                variants={shimmer}
                animate="animate"
                className="w-12 h-12 bg-gray-700/10 rounded-full"
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  variants={shimmer}
                  animate="animate"
                  className="h-4 w-24 bg-gray-700/10 rounded"
                />
                <motion.div
                  variants={shimmer}
                  animate="animate"
                  className="h-3 w-32 bg-gray-700/10 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-gray-800 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <motion.div
              variants={shimmer}
              animate="animate"
              className="w-12 h-12 bg-gray-700/10 rounded-full"
            />
            <div className="space-y-2">
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 w-32 bg-gray-700/10 rounded"
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-3 w-24 bg-gray-700/10 rounded"
              />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden bg-gray-900">
          <SkeletonMessage sender={false} />
          <SkeletonMessage sender={true} />
          <SkeletonMessage sender={false} />
          <SkeletonMessage sender={true} />
          <SkeletonMessage sender={false} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-800 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <motion.div
              variants={shimmer}
              animate="animate"
              className="w-10 h-10 bg-gray-700/10 rounded-full"
            />
            <motion.div
              variants={shimmer}
              animate="animate"
              className="w-10 h-10 bg-gray-700/10 rounded-full"
            />
            <motion.div
              variants={shimmer}
              animate="animate"
              className="flex-1 h-12 bg-gray-700/10 rounded-xl"
            />
            <motion.div
              variants={shimmer}
              animate="animate"
              className="w-10 h-10 bg-gray-700/10 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessageState;
