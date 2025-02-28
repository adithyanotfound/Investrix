"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/app/firebase';

// Type definitions
type Category = {
  name: string;
  sustainable: boolean;
};

type InvestorInfo = {
  amount: string;
  duration: string;
  goals: string;
};

export default function Preferences() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [investorInfo, setInvestorInfo] = useState<InvestorInfo>({
    amount: "",
    duration: "",
    goals: ""
  });
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Categories with sustainability flags
  const categories: Category[] = [
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

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const togglePreference = (category: string) => {
    setSelectedPreferences(prev =>
      prev.includes(category)
        ? prev.filter(p => p !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    const preferencesId = Math.floor(Math.random() * 1000000000);
    try {
      const preferenceData = {
        preferencesId,
        amountToInvest: investorInfo.amount,
        investmentDuration: investorInfo.duration,
        goals: investorInfo.goals,
        preferences: selectedPreferences,
        userId
      };
      
      await setDoc(doc(db, "preferences", preferencesId.toString()), preferenceData);
      router.push(`/dashboard/investor/recom/${preferencesId}`);
    } catch (error) {
      console.error("Error adding/updating document: ", error);
      // You might want to add error handling UI here
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
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
                value={investorInfo.amount}
                onChange={(e) => setInvestorInfo(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-black border border-[#333333] rounded-lg p-3 text-white placeholder:text-gray-600 focus:border-white focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Investment Duration</label>
              <input
                type="text"
                placeholder="e.g., 2 years"
                value={investorInfo.duration}
                onChange={(e) => setInvestorInfo(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-black border border-[#333333] rounded-lg p-3 text-white placeholder:text-gray-600 focus:border-white focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Goals and Objectives</label>
              <textarea
                placeholder="Describe your investment goals"
                value={investorInfo.goals}
                onChange={(e) => setInvestorInfo(prev => ({ ...prev, goals: e.target.value }))}
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
          onClick={handleSubmit}
        >
          Submit Details
        </Button>
      </div>
    </div>
  );
}