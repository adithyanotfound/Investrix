"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from '@/app/firebase';
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';

type LoanApplication = {
  businessType: String;
  id: string;
  userId: string;
  companyName: string;
  loanAmount: number;
  loanAmountInINR: number;
  fundingStatus: 'pending' | 'approved' | 'finalized';
  purpose: string;
  interestRateExpected: string;
  tenure: string;
  date: string;
  isSpecial: boolean;
  acceptedBid?: {
    interestRate: string;
    tenure: string;
  };
};

export default function InvesteeDashboard() {
  const router = useRouter();
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [finalizedLoans, setFinalizedLoans] = useState<LoanApplication[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user.uid);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (loggedInUser) {
      fetchLoanApplications();
    }
  }, [loggedInUser]);

  const fetchAcceptedBidForApplication = async (applicationId: string) => {
    try {
      const q = query(
        collection(db, 'bids'), 
        where('applicationId', '==', applicationId),
        where('status', '==', 'accepted')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const acceptedBid = querySnapshot.docs[0].data();
        return {
          interestRate: acceptedBid.interestRate,
          tenure: acceptedBid.tenure
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching accepted bid:', error);
      return null;
    }
  };

  const fetchLoanApplications = async () => {
    try {
      const docRef = getDocs(collection(db, "applications"));
      if (docRef) {
        const applications: LoanApplication[] = [];
        const finalized: LoanApplication[] = [];
        
        const docs = await docRef;
        
        for (const doc of docs.docs) {
          const application = { id: doc.id, ...doc.data() } as LoanApplication;
          if (application.userId === loggedInUser) {
            if (application.fundingStatus === 'finalized') {
              // Fetch accepted bid for finalized applications
              const acceptedBid = await fetchAcceptedBidForApplication(application.id);
              if (acceptedBid) {
                application.acceptedBid = acceptedBid;
              }
              finalized.push(application);
            } else {
              applications.push(application);
            }
          }
        }
        
        const sortedApplications = applications.sort((a, b) => {
          if (a.isSpecial === b.isSpecial) return 0;
          return a.isSpecial ? -1 : 1;
        });
        
        setLoanApplications(sortedApplications);
        setFinalizedLoans(finalized);
      } else {
        toast("No applications found!");
        setLoanApplications([]);
        setFinalizedLoans([]);
      }
    } catch (error) {
      toast.error("Error fetching loan applications!");
      console.error('Error fetching loan applications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      {/* Main Content */}
      <div className="p-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Investee Dashboard</h1>
          <Button 
            variant="outline" 
            className="border-white text-black hover:bg-white hover:text-black"
            onClick={() => router.push('/dashboard/investee/application')}
          >
            Create New Application
          </Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Loan Applications */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Active Applications</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {loanApplications.length === 0 ? (
                <div className="p-4 rounded-lg border border-[#333333] bg-black text-center">
                  No Active Loan Applications Found
                </div>
              ) : (
                loanApplications.map((app) => (
                  <div 
                    key={app.id} 
                    className={`p-4 rounded-lg border ${app.isSpecial ? 'border-green-500' : 'border-[#333333]'} bg-black hover:border-white transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{app.companyName}</h3>
                        {app.isSpecial && (
                          <span title="No transaction fees for this application!" className="text-green-500">
                            🌱
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-black text-sm rounded-full ${
                        app.fundingStatus === 'pending' ? 'bg-yellow-500' : 
                        app.fundingStatus === 'approved' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {app.fundingStatus.charAt(0).toUpperCase() + app.fundingStatus.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Amount</p>
                        <p className="text-white font-medium">{app.loanAmount} APT</p>
                        <p className="text-sm text-gray-500">₹{app.loanAmountInINR}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Purpose</p>
                        <p className="text-white font-medium">{app.businessType}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button 
                        className="bg-white text-black hover:bg-gray-200"
                        onClick={() => router.push(`/dashboard/investee/viewapplication?id=${app.id}`)}
                      >
                        View Details
                      </Button>
                      {app.fundingStatus !== 'finalized' && (
                        <Button 
                          className="bg-white text-black hover:bg-gray-200"
                          onClick={() => router.push(`/dashboard/investee/bids?id=${app.id}`)}
                        >
                          View Bids
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Loans and Chatbot */}
          <div className="space-y-8">
            {/* Active Loans Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Active Loans</h2>
                <p className="text-gray-400">
                  Total Borrowed: {finalizedLoans.reduce((sum, loan) => sum + loan.loanAmount, 0)} APT
                </p>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {finalizedLoans.length === 0 ? (
                  <div className="p-4 rounded-lg border border-[#333333] bg-black text-center">
                    No Active Loans Found
                  </div>
                ) : (
                  finalizedLoans.map((loan) => (
                    <div 
                      key={loan.id}
                      className="p-4 rounded-lg border border-[#333333] bg-black hover:border-white transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {loan.companyName.split(' ').map(word => word[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white text-lg">{loan.companyName}</h3>
                              <p className="text-sm text-gray-400">{loan.businessType}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500 text-black text-sm rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                            <div>
                              <p className="text-sm text-gray-400">Amount</p>
                              <p className="text-white font-medium">{loan.loanAmount} APT</p>
                              <p className="text-sm text-gray-500">₹{loan.loanAmountInINR}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Interest Rate</p>
                              <p className="text-white font-medium">10 %</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Tenure</p>
                              <p className="text-white font-medium">12 Months</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}