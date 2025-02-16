import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

const LoadingHome = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const OfflineBanner = () => (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm z-50 animate-bounce">
      <WifiOff className="w-5 h-5" />
      <span className="font-medium">You're currently offline</span>
    </div>
  );

  const LoadingPulse = ({ className }) => (
    <div className={`animate-pulse bg-gray-700/50 ${className}`} />
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {showOfflineMessage && <OfflineBanner />}
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow lg:w-2/3 space-y-4">
            {/* Create Post Loading State */}
            <div className="w-full bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-4 flex items-center gap-4">
              <LoadingPulse className="w-12 h-12 rounded-full" />
              <LoadingPulse className="flex-grow h-10 rounded-xl" />
              <LoadingPulse className="w-9 h-9 rounded-xl" />
            </div>

            {/* Posts Loading State */}
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={`bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 overflow-hidden transition-opacity duration-300 ${
                  !isOnline ? "opacity-50" : "opacity-100"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <LoadingPulse className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <LoadingPulse className="w-32 h-4 rounded" />
                      <LoadingPulse className="w-24 h-3 rounded" />
                    </div>
                  </div>
                </div>

                {/* Content Loading State */}
                <div className="px-4 pb-4 space-y-2">
                  <LoadingPulse className="w-full h-4 rounded" />
                  <LoadingPulse className="w-3/4 h-4 rounded" />
                </div>

                {/* Image Loading State with Shimmer */}
                <div className="relative w-full aspect-video">
                  <LoadingPulse className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>

                {/* Actions Loading State */}
                <div className="px-6 py-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                      {[1, 2, 3].map((i) => (
                        <LoadingPulse
                          key={i}
                          className="w-16 h-8 rounded-full"
                        />
                      ))}
                    </div>
                    <LoadingPulse className="w-8 h-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Loading State */}
          <div className="hidden lg:block w-96 space-y-8">
            {[1, 2].map((section) => (
              <div
                key={section}
                className={`bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-6 transition-opacity duration-300 ${
                  !isOnline ? "opacity-50" : "opacity-100"
                }`}
              >
                <LoadingPulse className="w-40 h-6 rounded mb-6" />
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-4 mb-4">
                    <LoadingPulse className="w-12 h-12 rounded-full" />
                    <div className="flex-grow space-y-2">
                      <LoadingPulse className="w-24 h-4 rounded" />
                      <LoadingPulse className="w-32 h-3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingHome;
