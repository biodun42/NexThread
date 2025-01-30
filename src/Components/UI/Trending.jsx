import { TrendingUp } from 'lucide-react';
import React, { useState } from 'react'

const Trending = () => {
    const [trendingTopics, setTrendingTopics] = useState([
        { tag: "#photography", posts: "12.5k" },
        { tag: "#technology", posts: "10.2k" },
        { tag: "#travel", posts: "8.7k" },
        { tag: "#food", posts: "7.3k" },
      ]);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="text-blue-500" size={24} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trending Topics
        </h2>
      </div>
      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            className="flex items-center justify-between hover:bg-gray-50 
                      dark:hover:bg-gray-700 p-2 rounded-lg cursor-pointer"
          >
            <span className="text-blue-500 hover:underline">{topic.tag}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {topic.posts} posts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Trending
