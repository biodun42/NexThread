import React from 'react';

const LoadingHome = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow lg:w-2/3 space-y-4">
            {/* Create Post Loading State */}
            <div className="w-full bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 animate-pulse" />
              <div className="flex-grow h-10 bg-gray-700/50 rounded-xl animate-pulse" />
              <div className="w-9 h-9 rounded-xl bg-gray-700/50 animate-pulse" />
            </div>

            {/* Posts Loading State */}
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700/50 animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-700/50 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Content Loading State */}
                <div className="px-4 pb-4 space-y-2">
                  <div className="w-full h-4 bg-gray-700/50 rounded animate-pulse" />
                  <div className="w-3/4 h-4 bg-gray-700/50 rounded animate-pulse" />
                </div>

                {/* Image Loading State */}
                <div className="w-full aspect-video bg-gray-700/50 animate-pulse" />

                {/* Actions Loading State */}
                <div className="px-6 py-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-16 h-8 bg-gray-700/50 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                    <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse" />
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
                className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-6"
              >
                <div className="w-40 h-6 bg-gray-700/50 rounded animate-pulse mb-6" />
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700/50 animate-pulse" />
                    <div className="flex-grow space-y-2">
                      <div className="w-24 h-4 bg-gray-700/50 rounded animate-pulse" />
                      <div className="w-32 h-3 bg-gray-700/50 rounded animate-pulse" />
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