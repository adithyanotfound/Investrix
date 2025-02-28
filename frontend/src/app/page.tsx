"use client";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Shield, Rocket, ChartBar, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Investments",
      description: "AI-powered matching with verified investors"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Enterprise-grade security for your investments"
    },
    {
      icon: <ChartBar className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Track your investment performance live"
    }
  ];

  // Add error boundaries around router pushes
  const handleNavigation = (path: string) => {
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Animated Background Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 -z-10"
      >
        <RetroGrid className="stroke-white" />
      </motion.div>
      <RetroGrid className="stroke-white opacity-0.9 " />
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-sm border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-8 h-8 text-white" />
            <span className="text-white text-xl font-medium">Investrix</span>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-black hover:bg-white/90 transition-all duration-300"
              onClick={() => handleNavigation('/login')}
            >
              Log in
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-100 transition-all duration-300"
              onClick={() => handleNavigation('/signup')}
            >
              Sign up
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-5xl text-center space-y-8"
        >
          {/* Main Heading */}
          <div className="space-y-6">
            <div className="relative inline-block">
              <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-7xl md:text-8xl font-bold tracking-tight"
              >
                <span className="relative">
                  <span className="text-white">Invest</span>
                  {/* Animated underline for "Invest" */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: 1,
                      delay: 0.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 0.5
                    }}
                    className="absolute bottom-2 left-0 w-full h-0.5 origin-left "
                    style={{
                      background: "linear-gradient(90deg, #22c55e, #10b981, #22c55e)",
                      backgroundSize: "200% 100%",
                      animation: "gradientMove 2s linear infinite"
                    }}
                  />
                </span>
                <span className="text-white">rix</span>
              </motion.h1>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-400"
            >
              Where Innovation Meets Investment
            </motion.p>

            {/* Make in India line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-lg md:text-xl font-medium text-white"
            >
              Support{" "}
              <span className="text-[#FF9933]">#Ma</span>
              <span className="text-[#FFFFFF]">ke</span>
              <span className="text-[#138808]">In</span>
              <span className="text-[#0cb1cf]">India</span>
              {" "}by Investing today!
            </motion.p>
          </div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="text-white mb-4">{feature.icon}</div>
                <h3 className="text-white text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-12"
          >
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 px-8 py-6 text-lg rounded-full group transition-all duration-300"
              onClick={() => handleNavigation('/signup')}
            >
              Get Started for free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-green-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}