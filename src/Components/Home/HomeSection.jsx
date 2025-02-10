import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Smile,
  UserRound,
  Camera,
  Hash,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import ImageCarousel from "../UI/ImageCarousel";
import Trending from "../UI/Trending";
import SuggestedFollower from "../UI/SuggestedFollower";
import { getDocs, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { postsCollection, db } from "../Firebase/Firebase";
import CreatePostModal from "../Modal/CreatePostModal";
import { useStateContext } from '../Context/Statecontext';

const HomeSection = () => {
  const { user } = useStateContext();
  const [likedPosts, setLikedPosts] = useState([]); // Add this state
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real-time posts subscription
  useEffect(() => {
    // Subscribe to posts collection
    const unsubscribe = onSnapshot(postsCollection, (snapshot) => {
      const allPosts = [];
      snapshot.forEach((doc) => {
        if (doc.data().posts) {
          allPosts.push(...doc.data().posts);
        }
      });
      // Sort posts by timestamp in descending order
      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setPosts(sortedPosts);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Add this useEffect to fetch user's liked posts
  useEffect(() => {
    if (!user?.uid) return;
    
    const userLikesDoc = doc(db, "userLikes", user.uid);
    const unsubscribe = onSnapshot(userLikesDoc, (doc) => {
      if (doc.exists()) {
        setLikedPosts(doc.data().likedPosts || []);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Update handleLike function
  const handleLike = async (postId, userId) => {
    try {
      if (!user) return;

      const userDoc = doc(postsCollection, userId);
      const userLikesDoc = doc(db, "userLikes", user.uid);
      const currentPost = posts.find(post => post.postId === postId);
      
      if (!currentPost) return;

      const hasLiked = likedPosts.includes(postId);

      // Update the post's likes
      const updatedPosts = posts.map(post => {
        if (post.postId === postId) {
          return { 
            ...post, 
            likes: hasLiked ? post.likes - 1 : post.likes + 1 
          };
        }
        return post;
      });

      // Update post document
      await updateDoc(userDoc, {
        posts: updatedPosts.filter(post => post.userId === userId)
      });

      // Update user's liked posts
      if (hasLiked) {
        await updateDoc(userLikesDoc, {
          likedPosts: arrayRemove(postId)
        });
      } else {
        await setDoc(userLikesDoc, {
          likedPosts: arrayUnion(postId)
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content */}
          <div className="flex-grow lg:w-2/3 space-y-4">
            {/* Create Post Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-4 flex items-center gap-4 hover:bg-gray-800 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                  <UserRound className="w-6 h-6 text-gray-300" />
                </div>
              </div>
              <div className="flex-grow text-left">
                <span className="text-gray-400">Share your thoughts...</span>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.postId}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 overflow-hidden group"
                >
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-[2px]">
                          <div className="w-full h-full rounded-full overflow-hidden">
                            {post.userProfilePic ? (
                              <img
                                src={post.userProfilePic}
                                alt={`${post.userName}'s profile`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white font-medium text-lg">
                                {post.initials}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100">
                            {post.userName}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {post.timestamp}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-200 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-700/50">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-200 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  )}

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="relative">
                      <ImageCarousel images={post.images} />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-6 py-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-6">
                        <button 
                          onClick={() => handleLike(post.postId, post.userId)}
                          disabled={!user}
                          className={`${
                            likedPosts.includes(post.postId) 
                              ? 'text-pink-500' 
                              : 'text-gray-400'
                          }`}
                        >
                          <Heart className={`w-6 h-6 ${
                            likedPosts.includes(post.postId) 
                              ? 'fill-current' 
                              : ''
                          }`} />
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group">
                          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors group">
                          <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          <span>{post.shares}</span>
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-yellow-400 transition-colors group">
                        <Bookmark className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-96 space-y-8 sticky top-6">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">
                Trending
              </h2>
              <Trending />
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">
                Suggested Followers
              </h2>
              <SuggestedFollower />
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default HomeSection;
