'use client';
/* eslint-disable */
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Building,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { db, auth } from '@/app/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

// Types
interface Bid {
  bidId: string;
  userId: string;
  applicationId: string;
  interestRate: string;
  tenure: string;
  status: string;
  loanAmount: string;
  currency: string;
  inrValue: string;
  monthlyPayment: string;
  bidDate: string;
  smeuserId?: string;
  investorDetails?: {
    portfolioSize: string;
    successfulInvestments: number;
    averageInvestmentSize: string;
    verificationStatus: string;
    description: string;
    previousInvestments: string[];
  };
}

interface UserData {
  displayName: string;
  finalizedBid?: {
    applicationId: string;
    finalized: boolean;
  };
  portfolioSize?: string;
  successfulInvestments?: number;
  averageInvestmentSize?: string;
  verificationStatus?: string;
  description?: string;
  previousInvestments?: string[];
}

export default function BidsOverview() {
  const [filteredBids, setFilteredBids] = useState<Bid[]>([]);
  const [names, setNames] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentAptosKey, setCurrentAptosKey] = useState<string | null>(null);
  const search = useSearchParams();
  const router = useRouter();
  const id = search.get("id");

  useEffect(() => {
    // Get current user ID
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentAptosKey(user.phoneNumber);
        const userRef = doc(db, "users", user.uid); // Assuming uid is the document ID
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log("Phone Number:", userSnap.data().phoneNumber);
          setCurrentAptosKey(userSnap.data().phoneNumber);
        } else {
          console.log("No such user!");
          return null;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFilteredBids = async () => {
      if (!id) return;

      try {
        const q = query(collection(db, 'bids'), where('applicationId', '==', id));
        const querySnapshot = await getDocs(q);

        const bidsPromises = querySnapshot.docs.map(async (document) => {
          const bid = { ...document.data(), bidId: document.id } as Bid;
          const userRef = doc(db, 'users', bid.userId.toString());
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data() as UserData;
            setNames(prevNames => ({ ...prevNames, [bid.userId]: userData.displayName }));

            // Add investor details to bid
            bid.investorDetails = {
              portfolioSize: userData.portfolioSize || "N/A",
              successfulInvestments: userData.successfulInvestments || 0,
              averageInvestmentSize: userData.averageInvestmentSize || "N/A",
              verificationStatus: userData.verificationStatus || "unverified",
              description: userData.description || "No description available",
              previousInvestments: userData.previousInvestments || []
            };
          }
          return bid;
        });

        const bidsData = await Promise.all(bidsPromises);
        setFilteredBids(bidsData);
      } catch (error) {
        console.error('Error fetching filtered bids:', error);
      }
    };

    fetchFilteredBids();
  }, [id]);

  const toggleBidDetails = (bidId: string) => {
    setExpandedBid(expandedBid === bidId ? null : bidId);
  };

  const handleFinalizeBid = async (bid: Bid) => {
    try {
      // Add smeuserId to the selected bid
      const selectedBidRef = doc(db, 'bids', bid.bidId);
      await updateDoc(selectedBidRef, {
        smeuserId: currentAptosKey,
        status: 'payment'
      });

      // Update all other bids for this application to 'payment' status
      const querySnapshot = await getDocs(
        query(collection(db, 'bids'), where('applicationId', '==', bid.applicationId))
      );

      const updatePromises = querySnapshot.docs.map(async (document) => {
        if (document.id !== bid.bidId) {  // Skip the selected bid as we've already updated it
          await updateDoc(doc(db, 'bids', document.id), { status: 'payment' });
        }
      });

      await Promise.all(updatePromises);

      // Update application status
      const applicationRef = doc(db, 'applications', bid.applicationId);
      await updateDoc(applicationRef, { fundingStatus: 'payment' });

      // Update user document
      const userRef = doc(db, 'users', bid.userId.toString());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          finalizedBid: {
            applicationId: bid.applicationId,
            finalized: true,
          },
        });
      }

      //send email

      setShowModal(false);
      router.push('/dashboard/investee/bidconfirmation');
    } catch (error) {
      console.error('Error finalizing bid:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
        <span className="text-xl font-medium">Investrix</span>
        <Button
          variant="outline"
          className="text-gray-300 bg-black hover:text-black hover:bg-white"
          onClick={() => router.push('/dashboard/investee')}
        >
          Back to Dashboard
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Active Bids</h1>
            <p className="text-gray-400">Review and finalize investment bids for your application</p>
          </div>
          {selectedBid && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalize Selected Bid
            </Button>
          )}
        </div>

        {/* Bids List */}
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <div
              key={bid.bidId}
              className={`bg-[#111111] rounded-lg border ${selectedBid?.bidId === bid.bidId
                  ? 'border-green-500'
                  : 'border-[#333333]'
                }`}
            >
              {/* Bid Header */}
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium">{names[bid.userId] || "Unknown"}</h3>
                      {bid.investorDetails?.verificationStatus === "verified" && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className={`border-[#333333] ${selectedBid?.bidId === bid.bidId
                          ? 'bg-green-500 text-black hover:bg-green-600'
                          : 'text-black hover:bg-black hover:text-white ]'
                        }`}
                      onClick={() => setSelectedBid(selectedBid?.bidId === bid.bidId ? null : bid)}
                    >
                      {selectedBid?.bidId === bid.bidId ? 'Selected' : 'Select Bid'}
                    </Button>
                    <button
                      onClick={() => toggleBidDetails(bid.bidId)}
                      className="text-gray-400 hover:text-white"
                    >
                      {expandedBid === bid.bidId ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bid Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-400">Bid Amount</p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      <p className="font-medium">{bid.loanAmount} {bid.currency}</p>
                    </div>
                    <p className="text-sm text-gray-500">{bid.inrValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Interest Rate</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
                      <p className="font-medium">{bid.interestRate}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tenure</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      <p className="font-medium">{bid.tenure}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Monthly Payment</p>
                    <p className="font-medium mt-1">{bid.monthlyPayment}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBid === bid.bidId && bid.investorDetails && (
                <div className="px-6 pb-6 border-t border-[#333333] mt-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Investor Profile</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-400">Portfolio Size</p>
                          <p className="font-medium">{bid.investorDetails.portfolioSize}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Successful Investments</p>
                          <p className="font-medium">{bid.investorDetails.successfulInvestments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Average Investment</p>
                          <p className="font-medium">{bid.investorDetails.averageInvestmentSize}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Previous Investments</h4>
                      <div className="flex flex-wrap gap-2">
                        {bid.investorDetails.previousInvestments.map((company) => (
                          <span
                            key={company}
                            className="px-3 py-1 rounded-full bg-[#333333] text-sm"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400">
                        {bid.investorDetails.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredBids.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Bids</h3>
            <p className="text-gray-400">
              There are currently no bids on your application.
              Check back later or adjust your application details.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedBid && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#111111] p-8 rounded-lg border border-[#333333]">
            <h3 className="text-xl font-medium mb-4">Confirm Bid Finalization</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to finalize this bid? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-[#333333] text-black"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleFinalizeBid(selectedBid)}
                className="bg-green-500 hover:bg-green-600"
              >
                Confirm Finalization
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}