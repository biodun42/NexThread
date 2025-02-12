import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { usersCollection, postsCollection } from "../Firebase/Firebase";

const ProfileSection = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const { userId } = useParams();
  const currentUserId = "loggedInUserId"; // Replace with the actual logged-in user's ID.

  useEffect(() => {
    const unsubscribeUser = onSnapshot(
      doc(usersCollection, userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
          console.log(docSnap.data());
        }
      }
    );

    const unsubscribePosts = onSnapshot(
      db.collection("posts").where("userId", "==", userId),
      (snapshot) => {
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [userId]);

  useEffect(() => {
    if (profile && profile.followers?.includes(currentUserId)) {
      setIsFollowing(true);
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!profile) return;

    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, {
        followers: isFollowing
          ? arrayRemove(currentUserId)
          : arrayUnion(currentUserId),
      });
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  const renderContent = () => {
    if (activeTab === "posts") {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 gap-4"
        >
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 p-4 rounded-lg">
              <p>{post.content}</p>
            </div>
          ))}
        </motion.div>
      );
    } else if (activeTab === "about") {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-300"
        >
          <h3 className="text-lg font-semibold">About Me</h3>
          <p>{profile.bio || "No bio available."}</p>
          <h3 className="text-lg font-semibold mt-4">Location</h3>
          <p>{profile.location || "No location provided."}</p>
        </motion.div>
      );
    }
  };

  if (!profile)
    return <div className="text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Cover Photo */}
      <div className="relative h-64">
        <img
          src={profile.profilePicture}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto px-4 -mt-16"
      >
        <div className="flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-32 h-32 rounded-full border-4 border-white overflow-hidden"
          >
            <img
              src={profile.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <h1 className="text-2xl font-bold">{profile.name || "User"}</h1>
          <p className="text-gray-400">@{profile.username || "unknown"}</p>

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-center">
            <div>
              <span className="block font-bold">{posts.length}</span>
              <span className="text-gray-400">Posts</span>
            </div>
            <div>
              <span className="block font-bold">
                {profile.followers?.length || 0}
              </span>
              <span className="text-gray-400">Followers</span>
            </div>
            <div>
              <span className="block font-bold">
                {profile.following?.length || 0}
              </span>
              <span className="text-gray-400">Following</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full ${
                isFollowing
                  ? "bg-blue-600 text-white"
                  : "border border-blue-600 text-blue-600"
              }`}
            >
              <Users />
              {isFollowing ? "Following" : "Follow"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-full bg-gray-700"
            >
              <MessageCircle />
              Message
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex justify-center gap-8 border-b border-gray-700 pb-2">
          {["posts", "about"].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize ${
                activeTab === tab
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-400"
              }`}
              whileHover={{ scale: 1.1 }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ProfileSection;
