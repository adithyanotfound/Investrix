"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";
import {
  Rocket,
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Lightbulb,
  Eye,
  EyeOff,
  Check,
  Phone,
  AlertCircle,
  Key
} from "lucide-react";

type Step = {
  id: number;
  title: string;
  subtitle: string;
};

const steps: Step[] = [
  {
    id: 1,
    title: "Choose your role",
    subtitle: "Select how you'll use Investrix"
  },
  {
    id: 2,
    title: "Create account",
    subtitle: "Enter your basic information"
  }
];

export default function Signup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    companyName: "",
    phoneNumber: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.role) {
          setError("Please select a role to continue");
          return false;
        }
        break;
      case 2:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError("Please fill in all fields");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      setError("");
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, {
        displayName: formData.fullName || formData.email.split("@")[0],
      });

      // Store additional user data
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: formData.role,
        fullName: formData.fullName,
        companyName: formData.role === 'investee' ? formData.companyName : null,
        phoneNumber: formData.phoneNumber
      });

      toast.success("Account created successfully");

      // Route based on selected role
      if (formData.role === 'investor') {
        router.push('/dashboard/investor');
      } else if (formData.role === 'investee') {
        router.push('/dashboard/investee');
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to create account");
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component remains the same...
  // (Keep all the renderStepContent and return JSX exactly as it was)
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: 'investor',
                  icon: <Wallet className="w-6 h-6" />,
                  label: 'Investor',
                  description: 'I want to invest in companies',
                  gradient: 'from-white-300 via-green-400 to-green-500'
                },
                {
                  id: 'investee',
                  icon: <Lightbulb className="w-6 h-6" />,
                  label: 'Investee',
                  description: 'I want to raise funds for my company',
                  gradient: 'from-grey-300 via-emerald-400 to-emerald-500'
                }
              ].map((role) => (
                <motion.button
                  key={role.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`
                    p-6 rounded-xl border relative overflow-hidden text-left
                    ${formData.role === role.id
                      ? 'border-green-400/30 text-white'
                      : 'border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5'
                    }
                  `}
                >
                  {formData.role === role.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        absolute inset-0 bg-gradient-to-br ${role.gradient} 
                        opacity-10 backdrop-blur-sm
                      `}
                    />
                  )}
                  <div className="relative space-y-2">
                    <div className={`
                      ${formData.role === role.id ? 'text-green-400' : 'text-gray-400'}
                      transition-colors duration-300
                    `}>
                      {role.icon}
                    </div>
                    <div>
                      <h3 className={`
                        font-medium text-lg
                        ${formData.role === role.id ? 'text-green-400' : 'text-gray-300'}
                      `}>
                        {role.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="email"
                name="email"
                placeholder="Email address"
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
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                name="fullName"
                placeholder="Full name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
              />
            </div>
            {formData.role === 'investee' && (
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="text"
                  name="companyName"
                  placeholder="Company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
                />
              </div>
            )}
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="tel"
                name="phoneNumber"
                placeholder="APTOS Private Key"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-400/30 focus:ring-0 rounded-xl"
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <RetroGrid className="stroke-white" />
      </motion.div>

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
        className="z-10 w-full max-w-2xl p-8 rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${currentStep > step.id
                    ? 'bg-green-400 text-black'
                    : currentStep === step.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-white/5 text-gray-500 border border-white/10'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5 rounded-full" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-full h-1 mx-2
                    ${currentStep > step.id + 1
                      ? 'bg-green-400'
                      : 'bg-white/10'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-medium text-white">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-400 mt-1">
              {steps[currentStep - 1].subtitle}
            </p>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-white/10 bg-black text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-gray-400 hover:bg-black hover:text-white"
            >
              Already have an account? Log in
            </Button>
          )}

          <Button
            onClick={currentStep === steps.length ? handleSubmit : handleNext}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-8"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {currentStep === steps.length ? 'Create Account' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}