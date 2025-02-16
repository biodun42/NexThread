import { Users } from "lucide-react";
import React, { useState, useEffect } from "react";
import Avatar from "../../assets/Profile.svg";
import { db, usersCollection } from "../Firebase/Firebase"; // Import Firebase configurations
import {
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { useStateContext } from "../Context/Statecontext"; // Import context to get current user

const SuggestedFollower = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const { user } = useStateContext(); // Get current user from context
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(usersCollection);
        let usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out the current user
        usersList = usersList.filter((u) => u.id !== user);

        // Shuffle the array
        usersList = usersList.sort(() => 0.5 - Math.random());

        // Get the first 4 users
        usersList = usersList.slice(0, 4);

        setSuggestedUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchFollowing = async () => {
      try {
        const userDoc = await getDoc(doc(usersCollection, user));
        if (userDoc.exists()) {
          setFollowing(userDoc.data().following || []);
        }
      } catch (error) {
        console.error("Error fetching following list:", error);
      }
    };

    fetchUsers();
    fetchFollowing();
  }, [user]);

  const navigate = (path) => {
    window.location.href = path;
  };

  const handleFollow = async (followedUserId) => {
    try {
      const currentUserRef = doc(usersCollection, user);
      const followedUserRef = doc(usersCollection, followedUserId);

      if (following.includes(followedUserId)) {
        // Unfollow the user
        await updateDoc(currentUserRef, {
          following: arrayRemove(followedUserId),
        });

        await updateDoc(followedUserRef, {
          followers: arrayRemove(user),
        });

        setFollowing((prev) => prev.filter((id) => id !== followedUserId));
        console.log(`User ${user} unfollowed ${followedUserId}`);
      } else {
        // Follow the user
        await updateDoc(currentUserRef, {
          following: arrayUnion(followedUserId),
        });

        await updateDoc(followedUserRef, {
          followers: arrayUnion(user),
        });

        setFollowing((prev) => [...prev, followedUserId]);
        console.log(`User ${user} followed ${followedUserId}`);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="text-blue-500" size={24} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suggested Users
        </h2>
      </div>
      <div className="space-y-4">
        {suggestedUsers.length > 0 ? (
          suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <img
                  src={user.ProfilePicture || Avatar}
                  alt={user.Name}
                  className="w-12 h-12 rounded-full object-cover"
                  onClick={() => navigate(`/profile/${user.id}`)}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {user.Name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.Username}
                  </p>
                </div>
              </div>
              <button
                className="px-4 py-1 text-sm text-blue-500 border border-blue-500 
                        rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => handleFollow(user.id)}
              >
                {following.includes(user.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No suggestions available
          </p>
        )}
      </div>
    </div>
  );
};

export default SuggestedFollower;
