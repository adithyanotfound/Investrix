"use client";
/* eslint-disable */
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db, auth } from '@/app/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';

interface BidDetails {
  amount: string;
  interestRate: string;
  tenure: string;
  additionalDetails: string;
}

interface Company {
  id: string;
  name: string;
  type: string;
  industry: string;
  foundedYear: string;
  teamSize: string;
  location: string;
  purpose: string;
  requestedAmount: string;
  inrValue: string;
  description: string;
  workDescription: string;
  highlights: string[];
  annualRevenue: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  documents: string[];
  fundingReceived: number;
  fundingStatus: string;
  videoLink: string;
  tags: Array<{ tag: string; isSpecial: boolean }>;
  yearsInOperation: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Bid Placement</h2>
        <div className="mb-6">
          <p className="mb-4">By proceeding, you agree to the following terms:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your bid will be evaluated by the startup</li>
            <li>You will receive a notification if your bid is finalized</li>
            <li>Once finalized, payment must be made within 7 days</li>
            <li className='text-red-700'>Failure to make payment will result in account suspension</li>
          </ul>
          <a href="https://github.com/adithyanotfound/Investrix/blob/main/frontend/TermsandConditions.md" className="text-blue-500 hover:underline block mt-4">
            View Full Terms and Conditions
          </a>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BidPage() {
  const router = useRouter();
  const searchParams = useParams();
  const applicationId = searchParams.id;

  const [showNotification, setShowNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [bidDetails, setBidDetails] = useState<BidDetails>({
    amount: "",
    interestRate: "",
    tenure: "",
    additionalDetails: ""
  });
  const [currentAptosKey, setCurrentAptosKey] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid); // Assuming uid is the document ID
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log("Phone Number:", userSnap.data().phoneNumber);
          setCurrentAptosKey(userSnap.data().phoneNumber);
        } else {
          console.log("No such user!");
          return null;
        }
      } else {
        toast.error('Please login to continue');
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch application/company details

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) {
        toast.error('Application ID not found');
        router.push('/dashboard/investor');
        return;
      }

      try {
        const appRef = doc(db, 'applications', applicationId as string);
        const appSnap = await getDoc(appRef);

        if (appSnap.exists()) {
          const appData = appSnap.data();
          setCompany({
            id: Array.isArray(applicationId) ? applicationId[0] : applicationId,
            name: appData.companyName || "",
            type: appData.companyType || "",
            industry: appData.industry || "",
            foundedYear: appData.foundedYear || "",
            teamSize: appData.teamSize || "",
            location: appData.location || "",
            purpose: appData.loanPurpose || "",
            requestedAmount: `${Math.abs(appData.loanAmount) || ""} APT`,
            inrValue: `₹${appData.loanAmountInINR?.toLocaleString() || ""}`,
            description: appData.pitch || "",
            workDescription: appData.workDescription || "",
            highlights: appData.highlights || [],
            annualRevenue: appData.annualRevenue || "",
            businessType: appData.businessType || "",
            contactPerson: appData.contactPerson || "",
            phone: appData.phone || "",
            documents: appData.documents || [],
            fundingReceived: appData.fundingReceived || 0,
            fundingStatus: appData.fundingStatus || "",
            videoLink: appData.videoLink || "",
            tags: appData.tags || [],
            yearsInOperation: appData.yearsInOperation || ""
          });
          toast.success('Application details loaded');
        } else {
          toast.error('Application not found');
          router.push('/dashboard/investor');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load application details');
        router.push('/dashboard/investor');
      }
    };

    fetchApplication();
  }, [applicationId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error('Cannot submit bid: Company details not available');
      return;
    }
    setShowModal(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!userId || !applicationId) {
      toast.error('User ID or Application ID is missing');
      return;
    }

    setIsSubmitting(true);
    setShowModal(false);

    try {
      // Add document to Firestore
      const bidRef = await addDoc(collection(db, 'bids'), {
        userId: userId,
        investorUserId: currentAptosKey,
        applicationId: applicationId,
        loanAmount: bidDetails.amount,
        interestRate: bidDetails.interestRate,
        tenure: bidDetails.tenure,
        additionalDetails: bidDetails.additionalDetails,
        status: 'pending',
        createdAt: new Date()
      });

      console.log("Bid submitted with ID:", bidRef.id);

      // Show success notification
      setShowNotification(true);

      // Reset form
      setBidDetails({
        amount: "",
        interestRate: "",
        tenure: "",
        additionalDetails: ""
      });

      // Hide notification and redirect after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
        router.push('/dashboard/investor');
      }, 5000);

    } catch (error) {
      console.error("Error submitting bid:", error);
      toast.error('Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If company data is not loaded yet, show loading state
  if (!company) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4">Loading application details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-6 right-6 bg-green-500 text-black px-6 py-3 rounded-md shadow-lg flex items-center gap-2 transition-all duration-300">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Bid made successfully!</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmedSubmit}
      />

      <div className="max-w-6xl mx-auto">
        <Button
          className="mb-6 bg-white text-black hover:bg-gray-200"
          onClick={() => router.back()}
        >
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header */}
            <div className="border border-[#333333] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
                  <p className="text-gray-400">{company.businessType} • {company.industry}</p>
                  <div className="flex gap-2 mt-2">
                    {company.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-sm ${tag.isSpecial ? 'bg-blue-500' : 'bg-gray-700'
                          }`}
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Requested Amount</p>
                  <p className="text-xl font-bold">{company.requestedAmount}</p>
                  <p className="text-sm text-gray-500">{company.inrValue}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-sm text-gray-400">Founded</p>
                  <p className="text-white">{company.yearsInOperation} years ago</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Annual Revenue</p>
                  <p className="text-white">{company.annualRevenue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Contact</p>
                  <p className="text-white">{company.contactPerson}</p>
                  <p className="text-sm text-gray-400">{company.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Purpose</p>
                  <p className="text-white">{company.purpose}</p>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="border border-[#333333] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">About Company</h2>
              <p className="text-gray-400 mb-6">{company.description}</p>

              <h3 className="text-lg font-semibold mb-3">What they do</h3>
              {company.videoLink && (
                <div className="mb-6">
                  <video
                    controls
                    className="w-full rounded-lg"
                    poster={company.documents[0]}
                  >
                    <source src={company.videoLink} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              <p className="text-gray-400 mb-6">{company.workDescription}</p>
            </div>
          </div>

          {/* Bid Details Section remains the same */}
          <div className="lg:col-span-1">
            <div className="border border-[#333333] rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-6">Bid Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Loan Amount (APT)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="w-full bg-transparent border border-[#333333] rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                    value={bidDetails.amount}
                    onChange={(e) => setBidDetails({ ...bidDetails, amount: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter rate"
                    className="w-full bg-transparent border border-[#333333] rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                    value={bidDetails.interestRate}
                    onChange={(e) => setBidDetails({ ...bidDetails, interestRate: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Tenure (months)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter tenure"
                    className="w-full bg-transparent border border-[#333333] rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-white"
                    value={bidDetails.tenure}
                    onChange={(e) => setBidDetails({ ...bidDetails, tenure: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    placeholder="Any additional information..."
                    className="w-full bg-transparent border border-[#333333] rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-white min-h-[100px] resize-none"
                    value={bidDetails.additionalDetails}
                    onChange={(e) => setBidDetails({ ...bidDetails, additionalDetails: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200 py-6 text-lg mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Make Bid'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}