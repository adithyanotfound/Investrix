"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import { 
  Rocket, 
  Mail, 
  Lock, 
  ArrowRight, 
  Wallet, 
  Lightbulb,
  Eye,
  EyeOff 
} from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!selectedRole) {
      setError("Please select a role before signing in.");
      return false;
    }

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success("Sign in successful");
      
      // Route based on selected role
      if (selectedRole === 'investor') {
        router.push('/dashboard/investor');
      } else if (selectedRole === 'investee') {
        router.push('/dashboard/investee');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError("Failed to sign in. Please try again.");
      toast.error("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden">
      {/* Animated Background */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <RetroGrid className="stroke-white" />
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />

      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-8 left-8 flex items-center gap-2"
      >
        <Rocket className="w-6 h-6 text-white" />
        <span className="text-white text-xl font-medium">Investrix</span>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-8 rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl"
      >
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              Welcome back
            </h1>
            <p className="text-base text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Sign In Form */}
          <div className="space-y-6">
            {/* Role Selector */}
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Select your role</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    id: 'investor', 
                    icon: <Wallet className="w-5 h-5" />, 
                    label: 'Investor',
                    gradient: 'from-white-300 via-green-400 to-green-500'
                  },
                  { 
                    id: 'investee', 
                    icon: <Lightbulb className="w-5 h-5" />, 
                    label: 'Investee',
                    gradient: 'from-white-300 via-emerald-400 to-emerald-500'
                  }
                ].map((role) => (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role.id)}
                    className={`
                      p-4 rounded-xl border relative overflow-hidden transition-all duration-300
                      ${selectedRole === role.id
                        ? 'border-green-400/30 text-white'
                        : 'border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Background gradient when selected */}
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`
                          absolute inset-0 bg-gradient-to-br ${role.gradient} 
                          opacity-10 backdrop-blur-sm
                        `}
                      />
                    )}
                    
                    {/* Glowing border effect when selected */}
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `
                            linear-gradient(45deg, 
                              rgba(74, 222, 128, 0.1), 
                              rgba(34, 197, 94, 0.1), 
                              rgba(21, 128, 61, 0.1)
                            )
                          `,
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative flex flex-col items-center gap-2">
                      <div className={`
                        ${selectedRole === role.id 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                        } transition-colors duration-300
                      `}>
                        {role.icon}
                      </div>
                      <span className={`
                        ${selectedRole === role.id 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                        } font-medium transition-colors duration-300
                      `}>
                        {role.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="h-12 pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-200 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="link"
                className="text-gray-500 hover:text-green-400 transition-colors duration-200"
                onClick={() => router.push("/signup")}
              >
                Don't have an account? Sign up
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="link"
                className="text-gray-500 hover:text-green-400 transition-colors duration-200"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}