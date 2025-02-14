import React, { useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, usersCollection } from "../Firebase/Firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useStateContext } from "../Context/Statecontext";

const Comments = ({ postId, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useStateContext();

  useEffect(() => {
    if (!isOpen) return;

    const commentsRef = collection(db, "Posts", postId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId, isOpen]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    const userDoc = await getDoc(doc(usersCollection, user));

    try {
      const commentData = {
        postId: postId,
        userId: user,
        userName: userDoc.data().Name || "",
        userProfilePic: userDoc.data().ProfilePicture || "",
        initials: userDoc.data().Initials || "",
        content: newComment.trim(),
        timestamp: serverTimestamp(),
      };

      const commentsRef = collection(db, "Posts", postId, "comments");
      await addDoc(commentsRef, commentData);

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const commentRef = doc(db, "Posts", postId, "comments", commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 mb-14 md:mb-0"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">Comments</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            <div className="sidebar flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-[2px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-gray-300">
                        {comment.userProfilePic ? (
                          <img
                            src={comment.userProfilePic}
                            alt={`${comment.userName}'s profile`}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white font-medium text-lg">
                            {comment.initials}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-700/50 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-300 font-medium">
                          {comment.userName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {comment.timestamp?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-200">{comment.content}</p>
                      {user === comment.userId && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400 mt-2"
                        >
                          Delete
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="p-4 border-t border-gray-700 flex gap-4"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-700/50 rounded-xl px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <motion.button
                type="submit"
                disabled={!newComment.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-purple-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
              >
                <Send className="w-8 h-5" />
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Comments;
