import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import ForgotPasswordModal from "../UI/ForgetPasswordModal";
import { auth, usersCollection } from "../Firebase/Firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Logo from "../../assets/logo.svg";
import { useNavigate } from "react-router-dom";

const AuthSection = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home");
      }
    });
  }, [navigate]);

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = isSignUp ? e.target[1].value : e.target[0].value;
    const password = isSignUp ? e.target[2].value : e.target[1].value;
    const name = isSignUp ? e.target[0]?.value : null;

    const getInitials = (name) => {
      const [firstName, lastName] = name.split(" ");
      const initials = firstName.charAt(0) + lastName.charAt(0);
      return initials.toUpperCase();
    };
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const dataToSave = {
          id: userCredential.user.uid,
          Name: name,
          Email: email,
          Username : email.split("@")[0],
          ProfilePicture: null,
          Initials: getInitials(name),
          CreatedAt: new Date(),
        };

        await setDoc(doc(usersCollection, userCredential.user.uid), dataToSave);
        console.log("Account Details", userCredential);
        toast.success("Account created successfully 🎉", {
          pauseOnHover: false,
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        await getDoc(doc(usersCollection, userCredential.user.uid));
        toast.success("Signed in successfully 🎉", {
          pauseOnHover: false,
        });
      }
      navigate("/home");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <motion.div
          className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-gray-700/50"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-[#0F172A] rounded-xl flex items-center justify-center shadow-lg">
                <img src={Logo} alt="Logo" className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mt-6 mb-2">
                {isSignUp ? "Join NexThread" : "Welcome Back 🎉"}
              </h1>
              <p className="text-gray-400">
                {isSignUp ? "Create your account" : "Sign in to your account"}
              </p>
            </div>

            <motion.form
              key={isSignUp ? "signup" : "signin"}
              className="space-y-5"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleSubmit}
            >
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                    placeholder="Enter your First and Last Name"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                {showPassword ? (
                  <Eye
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <EyeOff
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 group shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                disabled={loading}
              >
                <span>
                  {loading
                    ? isSignUp
                      ? "Creating Account..."
                      : "Signing In..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </span>
              </motion.button>

              {!isSignUp && (
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center text-sm text-gray-400">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-violet-600 rounded border-gray-700/50 bg-gray-800/50"
                    />
                    <span className="ml-2">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-violet-400 hover:text-violet-300 transition-colors duration-200"
                    onClick={() => setIsForgotPasswordOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </motion.form>

            <div className="mt-8 text-center text-gray-400">
              <p>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-200"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </>
  );
};

export default AuthSection;
