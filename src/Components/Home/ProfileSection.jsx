import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Users,
  Edit,
  Camera,
  Share2,
  Bookmark,
  Globe,
  BookCopy,
  Heart,
  X,
  Bell,
  Settings,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, postsCollection, usersCollection } from "../Firebase/Firebase";
import LoadingProfile from "../LoadingState/LoadingProfile";
import { useStateContext } from "../Context/Statecontext";
import ImageCarousel from "../UI/ImageCarousel";
import Comments from "../UI/comment";
import { toast } from "react-toastify";

const renderContent = (viewMode, posts, renderPost, profile) => {
  switch (viewMode) {
    case "posts":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post) => (
            <motion.div
              key={post.postId}
              layoutId={`post-${post.postId}`}
              whileHover={{ y: -5 }}
              className="rounded-lg overflow-hidden"
            >
              {renderPost(post)}
            </motion.div>
          ))}
        </div>
      );
    case "about":
      return (
        <div className="space-y-4">
          <h1>This is the about section</h1>
        </div>
      );
    default:
      return null;
  }
};

const ProfileSection = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeComments, setActiveComments] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState("posts");
  const [editedProfile, setEditedProfile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useStateContext();
  const [commentLength, setCommentLength] = useState({});
  const [likeCount, setLikeCount] = useState({});
  const [comments, setComments] = useState({});
  const navigate = useNavigate();


  const fileInputRef = useRef(null);
  const { userId } = useParams();

  const tabs = [
    { id: "posts", icon: BookCopy, label: "Posts" },
    { id: "about", icon: Globe, label: "About" },
  ];

  const settingsOptions = [
    {
      id: "edit-profile",
      label: "Edit Profile",
      icon: Edit,
      onclick: () => {
        setIsEditMode(true);
        setShowSettings(false);
      },
    },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const unsubscribeUser = onSnapshot(
          doc(usersCollection, userId),
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data();
              setProfile(profileData);
              setEditedProfile(profileData);
              setIsFollowing(profileData.followers?.includes(user));
            }
          }
        );

        const unsubscribePosts = onSnapshot(postsCollection, (snapshot) => {
          const postsList = snapshot.docs.map((doc) => doc.data().posts).flat();
          const userPosts = postsList.filter((post) => post.userId === userId);
          setPosts(userPosts);
        });

        setIsLoading(false);
        return () => {
          unsubscribeUser();
          unsubscribePosts();
        };
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, user]);

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

  // Cloudinary Config
  const CLOUDINARY_CONFIG = {
    UPLOAD_PRESET: "Posts_For_NexThread",
    CLOUD_NAME: "df4f0usnh",
    get UPLOAD_URL() {
      return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
    },
  };

  const uploadImageToCloudinary = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log(data.secure_url);
      setEditedProfile((prev) => ({
        ...prev,
        ProfilePicture: data.secure_url,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const userRef = doc(usersCollection, userId);
      await updateDoc(userRef, editedProfile);
      setIsEditMode(false);
      setShowSettings(false);
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setEditedProfile((prev) => ({
        ...prev,
        ProfilePicture: "",
      }));
      toast.success("Profile picture removed, click save to update profile");
    } catch (error) {
      console.error("Error removing profile picture:", error);
    }
  };

  const handleFollow = async (followedUserId) => {
    try {
      const currentUserRef = doc(usersCollection, user);
      const followedUserRef = doc(usersCollection, followedUserId);

      if (isFollowing) {
        // Unfollow the user
        await updateDoc(currentUserRef, {
          followers: arrayRemove(followedUserId),
        });

        await updateDoc(followedUserRef, {
          following: arrayRemove(user),
        });

        setIsFollowing(false);
        console.log(`User ${user} unfollowed ${followedUserId}`);
      } else {
        // Follow the user
        await updateDoc(currentUserRef, {
          following: arrayUnion(followedUserId),
        });

        await updateDoc(followedUserRef, {
          followers: arrayUnion(user),
        });

        setIsFollowing(true);
        console.log(`User ${user} followed ${followedUserId}`);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  const renderPost = (post) => {
    return (
      <div
        key={post.postId}
        className="bg-gray-800/50 backdrop-blur-lg rounded-3xl shadow-lg border border-gray-700/50 overflow-hidden group w-full"
      >
        {post.images && post.images.length > 0 && (
          <>
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
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <LoadingProfile />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-80">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
        >
          <img
            src={profile?.ProfilePicture}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        </motion.div>

        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-800/80 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShareModal(true)}
            className="p-2 bg-gray-800/80 rounded-full"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto px-4 -mt-32 relative z-10"
      >
        <div className="flex flex-col items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden">
              {profile?.ProfilePicture ? (
                <img
                  src={editedProfile?.ProfilePicture || profile?.ProfilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white font-medium text-3xl">
                  {profile?.Initials}
                </div>
              )}
            </div>
            {isEditMode && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-8 h-8" />
              </motion.button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={uploadImageToCloudinary}
              className="hidden"
            />
          </motion.div>

          {isEditMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 space-y-4 w-full max-w-md"
            >
              <input
                type="text"
                value={editedProfile?.Name || ""}
                onChange={(e) =>
                  setEditedProfile((prev) => ({
                    ...prev,
                    Name: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                placeholder="Name"
              />
              <textarea
                value={editedProfile?.bio || ""}
                onChange={(e) =>
                  setEditedProfile((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full px-4 py-2 bg-gray-800 rounded-lg resize-none"
                placeholder="Bio"
                rows={3}
              />
              <input
                type="text"
                value={editedProfile?.location || ""}
                onChange={(e) =>
                  setEditedProfile((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                placeholder="Location"
              />
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleProfileUpdate}
                  className="flex-1 py-2 bg-blue-600 rounded-lg"
                >
                  Save Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedProfile(profile);
                  }}
                  className="flex-1 py-2 bg-gray-700 rounded-lg"
                >
                  Cancel
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRemoveProfilePicture}
                className="w-full py-2 bg-red-600 rounded-lg"
              >
                Remove Profile Picture
              </motion.button>
            </motion.div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mt-4">
                {profile?.Name || "User"}
              </h1>
              <p className="text-gray-400">@{profile?.Username || "unknown"}</p>
              {profile?.bio && (
                <p className="mt-2 text-center max-w-md text-gray-300">
                  {profile.bio}
                </p>
              )}
              {profile?.location && (
                <p className="mt-1 text-gray-400 flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {profile.location}
                </p>
              )}
            </>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-8 mt-6"
          >
            {[
              { label: "Posts", value: posts.length },
              { label: "Followers", value: profile?.followers?.length || 0 },
              { label: "Following", value: profile?.following?.length || 0 },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <span className="block text-2xl font-bold">{value}</span>
                <span className="text-gray-400">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            {userId !== user && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFollow(userId)}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                    isFollowing ? "bg-gray-700" : "bg-blue-600"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {isFollowing ? "Following" : "Follow"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gray-700 rounded-lg flex items-center gap-2"
                  onClick={() => navigate(`/message/${userId}`)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="mt-12">
          <div className="flex justify-center gap-8 border-b border-gray-700">
            {tabs.map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.1 }}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-2 pb-4 ${
                  viewMode === id
                    ? "text-blue-500 border-b-2 border-blue-500"
                    : "text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-8 mb-20">
          {renderContent(viewMode, posts, renderPost)}
        </div>
      </motion.div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-2">
                {settingsOptions.map(({ id, label, icon: Icon, onclick }) => (
                  <motion.button
                    key={id}
                    whileHover={{ x: 10 }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700"
                    onClick={onclick}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Share Profile</h2>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={`https://yourapp.com/profile/${userId}`}
                  readOnly
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2 bg-blue-600 rounded-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://yourapp.com/profile/${userId}`
                      );
                      setShowShareModal(false);
                    }}
                  >
                    Copy Link
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-2 bg-gray-700 rounded-lg"
                    onClick={() => setShowShareModal(false)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default ProfileSection;
