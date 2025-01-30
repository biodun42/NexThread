
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  X,
  ArrowRight,
  Send,
  Check,
  AlertCircle,
  Key,
  LogIn,
} from "lucide-react";

const ForgotPasswordModal = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const showNotification = () => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const validateEmail = () => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateCode = () => {
    return /^\d{6}$/.test(code);
  };

  const validatePassword = () => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const handleSubmitEmail = async () => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showNotification("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep(2);
      showNotification(
        "Verification code sent successfully! Please check your email.",
        "success"
      );
      setAttempts(0);
    } catch (error) {
      showNotification(
        "Failed to send verification code. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    e.preventDefault();
    if (!validateCode(code)) {
      showNotification("Please enter a valid 6-digit code", "error");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (code === "123456") {
        setStep(3);
        showNotification("Code verified successfully!", "success");
        setCode("");
      } else {
        setAttempts((prev) => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          showNotification(
            "Too many failed attempts. Please request a new code.",
            "error"
          );
          setTimeout(() => setStep(1), 2000);
        } else {
          showNotification(
            `Invalid code. ${maxAttempts - attempts - 1} attempts remaining.`,
            "error"
          );
        }
        setCode("");
      }
    } catch (error) {
      showNotification("Failed to verify code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      showNotification(
        "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep(4);
      showNotification("Password reset successfully!", "success");
    } catch (error) {
      showNotification("Failed to reset password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setAttempts(0);
    }, 200);
  };

  // Reduced animation variants
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "tween", duration: 0.2 },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const stepVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.2 } },
    exit: { x: -20, opacity: 0, transition: { duration: 0.15 } },
  };

  const NotificationMessage = ({
    notification,
  }) => (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-0 left-0 right-0 p-4 rounded-t-2xl flex items-center justify-center gap-2 ${
            notification.type === "success"
              ? "bg-green-500/10 text-green-400 border-b border-green-500/20"
              : "bg-red-500/10 text-red-400 border-b border-red-500/20"
          }`}
        >
          {notification.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.form
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
            onSubmit={handleSubmitEmail}
          >
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Enter your email address to receive a verification code.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-white transition-all duration-200"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              ) : (
                <>
                  <span>Send Code</span>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </motion.button>
          </motion.form>
        );

      case 2:
        return (
          <motion.form
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
            onSubmit={handleVerifyCode}
          >
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Enter the 6-digit verification code sent to{" "}
              <span className="text-violet-400">{email}</span>.
            </p>
            <div className="relative">
              <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-white transition-all duration-200 tracking-wider font-mono"
                placeholder="Enter 6-digit code"
                required
                disabled={loading}
                maxLength={6}
                pattern="\d{6}"
              />
            </div>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </motion.button>
            <button
              type="button"
              className="w-full text-gray-400 hover:text-white text-xs sm:text-sm pt-2 transition-colors duration-200"
              onClick={() => {
                setStep(1);
                setCode("");
                setAttempts(0);
              }}
              disabled={loading}
            >
              Back to email
            </button>
          </motion.form>
        );

      case 3:
        return (
          <motion.form
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
            onSubmit={handleSetNewPassword}
          >
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Create a new password for your account.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <Key className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-white transition-all duration-200"
                  placeholder="New password"
                  required
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-white transition-all duration-200"
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Password must contain:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      newPassword.length >= 8 ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  One uppercase letter
                </li>
                <li className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      /[a-z]/.test(newPassword) ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  One lowercase letter
                </li>
                <li className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      /[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  One number
                </li>
                <li className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      /[^A-Za-z0-9]/.test(newPassword)
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  />
                  One special character
                </li>
              </ul>
            </div>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              ) : (
                <>
                  <span>Set New Password</span>
                  <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </motion.button>
          </motion.form>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center space-y-6"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl" />
              <div className="relative w-16 h-16 mx-auto">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Password Reset Complete!
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Your password has been successfully reset. You can now log in
                with your new password.
              </p>
            </div>
            <motion.button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span>Continue to Login</span>
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 py-6 sm:p-0">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />
          <motion.div
            className="relative w-full max-w-sm sm:max-w-md mx-auto"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="relative bg-[#0F172A]/95 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700/50 shadow-xl backdrop-blur-xl w-full overflow-hidden">
              <NotificationMessage notification={notification} />

              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-full blur-3xl" />

              <div className="relative">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-xl transition-all duration-200 rounded-xl" />
                      <div className="relative w-10 h-10">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 transition-all duration-200">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Reset Password
                    </h2>
                  </div>
                  <button
                    className="text-gray-400 hover:text-white p-1 transition-colors duration-200"
                    onClick={handleClose}
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

                {step < 4 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1 rounded-full w-8 transition-all duration-200 ${
                          step === s
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600"
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
