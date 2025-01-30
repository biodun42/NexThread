import { Users } from "lucide-react";
import React, { useState } from "react";
import Avatar from "../../assets/Profile.svg";

const SuggestedFollower = () => {
    const [suggestedUsers, setSuggestedUsers] = useState([
        {
          id: 1,
          name: "Sarah Johnson",
          username: "@sarahj",
          avatar: Avatar,
          followers: "12.5k",
        },
        {
          id: 2,
          name: "Mike Chen",
          username: "@mikechen",
          avatar: Avatar,
          followers: "8.2k",
        },
        {
          id: 3,
          name: "Emma Davis",
          username: "@emmad",
          avatar: Avatar,
          followers: "15.7k",
        },
      ]);
    
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="text-blue-500" size={24} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suggested Users
        </h2>
      </div>
      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.username}
                </p>
              </div>
            </div>
            <button
              className="px-4 py-1 text-sm text-blue-500 border border-blue-500 
                      rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedFollower;
