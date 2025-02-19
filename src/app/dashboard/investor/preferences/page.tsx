"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react"; // Import leaf icon from lucide-react
import { useRouter } from "next/navigation";

export default function Preferences() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [goals, setGoals] = useState("");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Define categories with sustainability flags
  const categories = [
    { name: "Technology", sustainable: false },
    { name: "Manufacturing", sustainable: false },
    { name: "Healthcare", sustainable: false },
    { name: "Agribusiness", sustainable: true },
    { name: "Renewable-Energy", sustainable: true },
    { name: "Education", sustainable: false },
    { name: "E-commerce", sustainable: false },
    { name: "Infrastructure", sustainable: false },
    { name: "Financial-Services", sustainable: false },
    { name: "Consumer-Goods", sustainable: false },
    { name: "Artisanal-and-Handicrafts", sustainable: true },
    { name: "Sustainable-and-Social-Enterprises", sustainable: true }
  ];

  const togglePreference = (category: string) => {
    setSelectedPreferences(prev =>
      prev.includes(category)
        ? prev.filter(p => p !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      {/* Back to Dashboard Button */}
      <Button
        onClick={() => router.push("/dashboard/investor")}
        className="absolute top-6 right-6 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-lg"
      >
        Back to Dashboard
      </Button>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investment Details Section */}
        <div className="space-y-6 bg-black border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold">Investment Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Amount to Invest</label>
              <input
                type="text"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black border border-[#333333] rounded-lg p-3 text-white placeholder:text-gray-600 focus:border-white focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Investment Duration</label>
              <input
                type="text"
                placeholder="e.g., 2 years"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black border border-[#333333] rounded-lg p-3 text-white placeholder:text-gray-600 focus:border-white focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Goals and Objectives</label>
              <textarea
                placeholder="Describe your investment goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full bg-black border border-[#333333] rounded-lg p-3 text-white placeholder:text-gray-600 focus:border-white focus:ring-0 transition-colors min-h-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Investment Preferences Section */}
        <div className="space-y-6 bg-black border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold">Investment Preferences</h2>
          
          <div>
            <p className="text-gray-400 mb-4">Available Preferences:</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => togglePreference(category.name)}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    selectedPreferences.includes(category.name)
                      ? "border-white text-white"
                      : "border-[#333333] text-gray-400 hover:border-white hover:text-white"
                  }`}
                >
                  {category.sustainable && (
                    <Leaf className="w-4 h-4 text-green-500" />
                  )}
                  {category.name.replace(/-/g, ' ')}
                  <span className="ml-1 text-gray-400 group-hover:text-white">+</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-gray-400 mb-4">Selected Preferences:</p>
            <div className="min-h-[100px] border border-[#333333] rounded-lg p-4">
              {selectedPreferences.length === 0 ? (
                <p className="text-gray-600">No preferences selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedPreferences.map(pref => (
                    <span key={pref} className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
                      {pref.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="max-w-6xl mx-auto mt-6">
        <Button 
          className="w-full bg-white text-black hover:bg-gray-200 py-6 text-lg rounded-xl"
          onClick={() => {
            // Handle submission
            console.log({ amount, duration, goals, selectedPreferences });
          }}
        >
          Submit Details
        </Button>
      </div>
    </div>
  );
}
