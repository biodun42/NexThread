import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Smile,
  UserRound,
} from "lucide-react";
import Trending from "../UI/Trending";
import SuggestedFollower from "../UI/SuggestedFollower";
import Avatar from "../../assets/Profile.svg";
import Post from "../../assets/Post.svg";

const HomeSection = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [trendingTopics, setTrendingTopics] = useState([
    { tag: "#photography", posts: "12.5k" },
    { tag: "#technology", posts: "10.2k" },
    { tag: "#travel", posts: "8.7k" },
    { tag: "#food", posts: "7.3k" },
  ]);
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

  // Sample posts data
  const samplePosts = [
    {
      id: 1,
      user: {
        name: "John Doe",
        username: "@johndoe",
        avatar: Avatar,
      },
      content:
        "Just launched my new photography portfolio! Check it out 📸 #photography #art",
      image: Post,
      likes: 234,
      comments: 45,
      shares: 12,
      timestamp: new Date().toISOString(),
      liked: false,
      saved: false,
    },
    {
      id: 2,
      user: {
        name: "Jane Smith",
        username: "@janesmith",
        avatar: Avatar,
      },
      content: "Beautiful sunset at the beach today 🌅 #nature #beach #sunset",
      image: Post,
      likes: 567,
      comments: 89,
      shares: 34,
      timestamp: new Date().toISOString(),
      liked: false,
      saved: false,
    },
  ];

  useEffect(() => {
    setPosts(samplePosts);
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    // Add new post logic here
    const newPostObj = {
      id: posts.length + 1,
      user: {
        name: "Current User",
        username: "@currentuser",
        avatar: Avatar,
      },
      content: newPost,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date().toISOString(),
      liked: false,
      saved: false,
    };

    setPosts([newPostObj, ...posts]);
    setNewPost("");
  };

  const toggleLike = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const toggleSave = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full px-3 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Feed */}
          <div className="md:col-span-2 space-y-3">
            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <form onSubmit={handlePostSubmit}>
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <UserRound size={30} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 
                        rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                        placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      rows="3"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                            rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ImageIcon size={20} />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 
                            rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Smile size={20} />
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.user.avatar}
                        alt={post.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {post.user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {post.user.username} ·{" "}
                          {new Date(post.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 py-2">
                    <p className="text-gray-900 dark:text-white">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Image */}
                  {post.image && (
                    <div className="mt-2">
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center space-x-2 ${
                            post.liked
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            size={20}
                            fill={post.liked ? "currentColor" : "none"}
                          />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          <MessageCircle size={20} />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          <Share2 size={20} />
                          <span>{post.shares}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => toggleSave(post.id)}
                        className={`${
                          post.saved
                            ? "text-blue-500"
                            : "text-gray-500 hover:text-blue-500"
                        }`}
                      >
                        <Bookmark
                          size={20}
                          fill={post.saved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 h-screen">
            <Trending />
            <SuggestedFollower />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
