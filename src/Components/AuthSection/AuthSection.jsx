import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Camera,
  ArrowLeft,
  ArrowRight,
  Check,
  UserCircle,
} from "lucide-react";
import { auth, usersCollection } from "../Firebase/Firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AuthSection = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    profilePicture: null,
    previewUrl: null,
  });
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [imageFetching, setImageFetching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) navigate("/home");
    });
  }, [navigate]);

  const checkUsername = async (username) => {
    if (username.length < 3) return false;
    const q = query(usersCollection, where("Username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleUsernameChange = async (e) => {
    const username = e.target.value;
    setFormData((prev) => ({ ...prev, username }));
    if (username.length >= 3) {
      const isAvailable = await checkUsername(username);
      setUsernameAvailable(isAvailable);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
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
    setImageFetching(true);

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
      setFormData((prev) => ({ ...prev, previewUrl: data.secure_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setImageFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const initials = formData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        await setDoc(doc(usersCollection, userCredential.user.uid), {
          id: userCredential.user.uid,
          Name: formData.name,
          Email: formData.email,
          Username: formData.username,
          ProfilePicture: formData.previewUrl,
          Initials: initials,
          CreatedAt: new Date(),
          followers: [],
          following: [],
          bio: "",
          location: "",
          isOnline: false,
          lastSeen: serverTimestamp(),
        });

        toast.success("Welcome to NexThread! 🎉");
      } else {
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        toast.success("Welcome back to NexThread! 🎉");
      }
      navigate("/home");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step1" variants={stepVariants} className="space-y-4">
            <h2 className="text-xl text-white mb-4">Basic Information</h2>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 border ${
                  formData.username.length >= 3
                    ? usernameAvailable
                      ? "border-green-500/50"
                      : "border-red-500/50"
                    : "border-gray-700/50"
                } rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200`}
                placeholder="Username"
                value={formData.username}
                onChange={handleUsernameChange}
                required
              />
              {formData.username.length >= 3 && (
                <span
                  className={`text-sm ${
                    usernameAvailable ? "text-green-400" : "text-red-400"
                  } mt-1 block`}
                >
                  {usernameAvailable ? "Username available" : "Username taken"}
                </span>
              )}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" variants={stepVariants} className="space-y-4">
            <h2 className="text-xl text-white mb-4">Account Security</h2>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                  checkPasswordStrength(e.target.value);
                }}
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
            <div className="flex gap-1 mt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < passwordStrength ? "bg-violet-500" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" variants={stepVariants} className="space-y-4">
            <h2 className="text-xl text-white mb-4">Profile Picture</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-800/50 border-2 border-violet-500/50">
                {formData.previewUrl ? (
                  <img
                    src={formData.previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadImageToCloudinary}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 transition-colors">
                  <Camera className="w-5 h-5" />
                  <span>Choose Photo</span>
                </div>
              </label>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" variants={stepVariants} className="space-y-4">
            <h2 className="text-xl text-white mb-4">Review & Complete</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <User className="w-5 h-5" />
                <span>{formData.name}</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <UserCircle className="w-5 h-5" />
                <span>{formData.username}</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5" />
                <span>{formData.email}</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Lock className="w-5 h-5" />
                <span>Password set</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              {formData.profilePicture && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Camera className="w-5 h-5" />
                  <span>Profile picture uploaded</span>
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div
        className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl p-4 w-full max-w-md border border-gray-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mt-6 mb-2">
              {isSignUp ? "Join Us" : "Welcome Back"}
            </h1>
            <p className="text-gray-400">
              {isSignUp
                ? `Step ${currentStep} of 4`
                : "Sign in to your account"}
            </p>
            {isSignUp && (
              <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      step === currentStep ? "bg-violet-500" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                renderStepContent()
              ) : (
                <motion.div
                  key="signin"
                  variants={stepVariants}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
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
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between gap-4">
              {isSignUp && currentStep > 1 && (
                <motion.button
                  type="button"
                  className="flex-1 bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700/70 transition-all duration-200"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              )}
              <motion.button
                type="submit"
                className={`flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 group shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 ${
                  loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {isSignUp
                        ? currentStep < 4
                          ? "Continue"
                          : "Create Account"
                        : "Sign In"}
                    </span>
                    {isSignUp && currentStep < 4 && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-8 text-center text-gray-400">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setCurrentStep(1);
                  setFormData({
                    name: "",
                    email: "",
                    username: "",
                    password: "",
                    profilePicture: null,
                    previewUrl: null,
                  });
                }}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-200"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default AuthSection;
