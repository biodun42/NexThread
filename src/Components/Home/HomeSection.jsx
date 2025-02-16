import React, { useState, useEffect } from "react";
import {
  Heart,
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
  query,
  orderBy,
} from "firebase/firestore";
import CreatePostModal from "../Modal/CreatePostModal";
import Comments from "../UI/comment";
import LoadingHome from "../LoadingState/LoadingHome";

const HomeSection = () => {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likeCount, setLikeCount] = useState({});
  const [activeComments, setActiveComments] = useState(null);
  const [comments, setComments] = useState({});
  const [commentLength, setCommentLength] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useStateContext();

  useEffect(() => {
    const unsubscribe = onSnapshot(postsCollection, (snapshot) => {
      let postsList = snapshot.docs.map((doc) => doc.data().posts).flat();

      // Filter out old posts (e.g., older than 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      postsList = postsList.filter(
        (post) => new Date(post.timestamp) > oneWeekAgo
      );

      // Shuffle the postsList
      for (let i = postsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [postsList[i], postsList[j]] = [postsList[j], postsList[i]];
      }

      setPosts(postsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const postsRef = collection(db, "Posts");
    const unsubscribeLikes = onSnapshot(postsRef, (snapshot) => {
      const likesData = {};
      snapshot.docs.forEach((doc) => {
        const postData = doc.data();
        likesData[doc.id] = postData.likes ? postData.likes.length : 0;
      });
      setLikeCount(likesData);
    });

    return () => unsubscribeLikes();
  }, []);

  useEffect(() => {
    const unsubscribeComments = posts.map((post) => {
      const commentsRef = collection(db, "Posts", post.postId, "comments");
      const q = query(commentsRef, orderBy("timestamp", "desc"));

      return onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments((prev) => ({
          ...prev,
          [post.postId]: commentsData,
        }));
        console.log(commentsData);
        setCommentLength((prev) => ({
          ...prev,
          [post.postId]: commentsData.length,
        }));
      });
    });

    return () => unsubscribeComments.forEach((unsubscribe) => unsubscribe());
  }, [posts]);

  const handleLike = async (postId) => {
    if (!user) {
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
    <>
      {post.images && post.images.length > 0 && (
        <ImageCarousel
          post={post}
          images={post.images}
          postId={post.postId}
          onLike={() => handleLike(post.postId)}
          onComment={() => setActiveComments(post.postId)}
          onShare={() => handleShare(post.postId)}
          likes={likeCount[post.postId] || post.likes.length}
          comments={comments[post.postId] || []}
          shares={post.shares}
        />
      )}
    </>
  );

  if (loading) return <LoadingHome />;

  return (
    <div className="min-h-screen bg-gray-900 mb-16 lg:md-0">
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow space-y-4">
            <CreatePostButton />
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.key} post={post} />
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-96 space-y-8 sticky top-6">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-4">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">
                Trending
              </h2>
              <Trending />
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 p-4">
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
      {activeComments && (
        <Comments
          postId={activeComments}
          isOpen={true}
          onClose={() => setActiveComments(null)}
        />
      )}
    </div>
  );
};

export default HomeSection;
