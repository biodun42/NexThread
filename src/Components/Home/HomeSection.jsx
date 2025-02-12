  import React, { useState, useEffect } from "react";
  import {
    Heart,
    HeartOff,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    UserRound,
    Plus,
  } from "lucide-react";
  import ImageCarousel from "../UI/ImageCarousel";
  import Trending from "../UI/Trending";
  import SuggestedFollower from "../UI/SuggestedFollower";
  import { db, postsCollection } from "../Firebase/Firebase";
  import { useStateContext } from "../Context/Statecontext";
  import {
    doc,
    updateDoc,
    getDoc,
    collection,
    onSnapshot,
  } from "firebase/firestore";
  import CreatePostModal from "../Modal/CreatePostModal";
  import { useNavigate } from "react-router-dom";

  const HomeSection = () => {
    const [posts, setPosts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useStateContext();
    const navigate = useNavigate();

    useEffect(() => {
      const unsubscribe = onSnapshot(postsCollection, (snapshot) => {
        const postsList = snapshot.docs.map((doc) => doc.data().posts).flat();
        setPosts(postsList);
      });

      return () => unsubscribe();
    }, []);

    const handleLike = async (postId) => {
      if (!user) {
        // Redirect to login or show login prompt
        return;
      }

      try {
        const postRef = doc(db, "Posts", postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
          console.error("Post not found");
          return;
        }

        const postData = postDoc.data();
        const likes = postData.likes || [];
        const isLiked = likes.includes(user);

        // Toggle like
        const updatedLikes = isLiked
          ? likes.filter((id) => id !== user)
          : [...likes, user];

        // Update Firestore
        await updateDoc(postRef, {
          likes: updatedLikes,
        });

        // Update local state
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.postId === postId ? { ...post, likes: updatedLikes } : post
          )
        );
      } catch (error) {
        console.error("Error updating like:", error);
      }
    };

    const CreatePostButton = () => (
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
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
          <Plus className="w-5 h-5 text-white" />
        </div>
      </button>
    );

    const PostCard = ({ post }) => (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 overflow-hidden group">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-[2px] cursor-pointer"
                onClick={() => navigate(`/profile/${post.userId}`)}
              >
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
                <h3 className="font-semibold text-gray-100">{post.userName}</h3>
                <p className="text-sm text-gray-400">{post.timestamp}</p>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-200 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-700/50">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {post.content && (
          <div className="px-4 pb-4">
            <p className="text-gray-200 leading-relaxed">{post.content}</p>
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div className="relative">
            <ImageCarousel images={post.images} />
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <button
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors group"
                onClick={() => handleLike(post.postId)}
              >
                {post.likes.includes(user) ? (
                  <Heart className="w-6 h-6" />
                ) : (
                  <HeartOff className="w-6 h-6" />
                )}
                <span>
                  {post.likes.length} {post.likes.length === 1 ? "Like" : "Likes"}
                </span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group">
                <MessageCircle className="w-6 h-6" />
                <span>{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors group">
                <Share2 className="w-6 h-6" />
                <span>{post.shares}</span>
              </button>
            </div>
            <button className="text-gray-400 hover:text-yellow-400 transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-900 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-2 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow lg:w-2/3 space-y-4">
              <CreatePostButton />
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.postId} post={post} />
                ))}
              </div>
            </div>

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

        {isModalOpen && (
          <CreatePostModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    );
  };

  export default HomeSection;
