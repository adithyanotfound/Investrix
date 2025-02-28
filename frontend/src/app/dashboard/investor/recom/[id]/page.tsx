"use client";
/* eslint-disable */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/firebase";
import { useParams } from "next/navigation";

// Type definitions
type Application = {
  applicationId: number;
  companyName: string;
  businessType: string;
  annualRevenue: string;
  contactPerson: string;
  loanAmount: number;
  loanAmountInINR: number;
  yearsInOperation: string;
  fundingStatus: string;
  loanPurpose: string;
  tags: string[];
};

export default function Preferences() {
  const router = useRouter();
  const params = useParams();
  const preferencesId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [prefsFetched, setPrefsFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Auth check
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

  // Fetch preferences
  useEffect(() => {
    if (!preferencesId) {
      setError("Missing preferences ID");
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const prefDoc = await getDoc(doc(db, "preferences", String(preferencesId)));

        if (!prefDoc.exists()) {
          setError("Preferences not found");
          setIsLoading(false);
          return;
        }

        const data = prefDoc.data();

        if (!data.preferences || !Array.isArray(data.preferences)) {
          setError("Invalid preferences format");
          setIsLoading(false);
          return;
        }

        setSelectedPreferences(data.preferences);
        setPrefsFetched(true);
      } catch (error) {
        console.error("Error fetching preferences:", error);
        setError("Failed to load preferences");
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [preferencesId]);

  // Fetch applications
  useEffect(() => {
    if (!prefsFetched || selectedPreferences.length === 0) {
      return;
    }

    const fetchApplications = async () => {
      try {
        const q = query(collection(db, "applications"));
        const querySnapshot = await getDocs(q);

        const allApps = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            applicationId: data.applicationId,
            companyName: data.companyName || "Unnamed Company",
            businessType: data.businessType || "Unknown",
            annualRevenue: data.annualRevenue || "0",
            contactPerson: data.contactPerson || "Unknown",
            loanAmount: data.loanAmount || 0,
            loanAmountInINR: data.loanAmountInINR || 0,
            yearsInOperation: data.yearsInOperation || "0",
            fundingStatus: data.fundingStatus || "pending",
            loanPurpose: data.loanPurpose || "Not specified",
            tags: Array.isArray(data.tags) ? data.tags : []
          } as Application;
        });

        const filteredApps = allApps.filter(app =>
          app.tags && app.tags.some(tag => selectedPreferences.includes(tag))
        );

        setApplications(filteredApps);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [prefsFetched, selectedPreferences]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "finalized":
        return { text: "Active", className: "bg-green-900/60 text-green-400" };
      case "pending":
        return { text: "Pending", className: "bg-yellow-900/60 text-yellow-400" };
      default:
        return { text: status, className: "bg-gray-900/60 text-gray-400" };
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

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Matching Investments</h1>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && applications.length === 0 && (
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No matching applications found based on your preferences.</p>
          </div>
        )}

        {!isLoading && !error && applications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {applications.map(app => {
              const status = getStatusDisplay(app.fundingStatus);

              return (
                <div key={app.applicationId} className="bg-black border border-[#333333] rounded-xl p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-2xl font-bold">{app.companyName}</h2>
                      <p className="text-gray-400">{app.businessType}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${status.className}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 mt-3">
                    <div>
                      <p className="text-gray-400 text-sm">Loan Amount</p>
                      <p className="font-bold">{Math.abs(app.loanAmount)} APT</p>
                      <p className="text-sm text-gray-500">{formatCurrency(app.loanAmountInINR)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Annual Revenue</p>
                      <p className="font-bold">{app.annualRevenue}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Years in Operation</p>
                      <p className="font-bold">{app.yearsInOperation} years</p>
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-400 text-sm">Loan Purpose</p>
                      <p className="font-medium">{app.loanPurpose}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex justify-end">
                    <Button
                      onClick={() => router.push(`/dashboard/investor/viewapplication?id=${app.applicationId}`)}
                      className="bg-white hover:bg-gray-200 text-black"
                    >
                      View Application
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
