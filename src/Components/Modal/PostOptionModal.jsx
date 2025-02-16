import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Flag, Trash2, UserX, Link2, Star } from "lucide-react";

const PostOptionModal = ({
  onReport,
  onDelete,
  onBlock,
  onCopyLink,
  onAddToFavorites,
  isAuthor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full transition-all duration-200 hover:bg-gray-800/10 dark:hover:bg-gray-700/50 group"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="relative">
            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleAction(onAddToFavorites)}
                className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-200">
                  Add to Favorites
                </span>
              </button>

              <button
                onClick={() => handleAction(onCopyLink)}
                className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Link2 className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">
                  Copy Link
                </span>
              </button>

              {isAuthor && (
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Delete Post</span>
                </button>
              )}

              {!isAuthor && (
                <>
                  <button
                    onClick={() => handleAction(onReport)}
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Flag className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700 dark:text-gray-200">
                      Report Post
                    </span>
                  </button>

                  <button
                    onClick={() => handleAction(onBlock)}
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserX className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-200">
                      Block User
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostOptionModal;
