import React from "react";

const LoadingProfile = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-80">
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      </div>

      {/* Profile Info */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col items-center">
          {/* Profile Picture */}
          <div className="w-40 h-40 rounded-full bg-gray-800 animate-pulse" />

          {/* Name and Bio */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-16 w-64 bg-gray-800 rounded-lg animate-pulse mt-2" />
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="text-center">
                <div className="h-8 w-16 bg-gray-800 rounded-lg animate-pulse mb-1" />
                <div className="h-4 w-20 bg-gray-800 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex justify-center gap-8 border-b border-gray-700">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className="h-8 w-24 bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-8 mb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingProfile;
