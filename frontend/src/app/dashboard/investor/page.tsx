"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { doc, collection, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from '@/app/firebase';
import { onAuthStateChanged } from "firebase/auth";
import toast from 'react-hot-toast';
import { fundStartup } from "@/lib/contracts";
import {
  Account,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";


// Types
type LoanApplication = {
  id: string;
  companyName: string;
  loanAmount: number;
  loanAmountInINR?: number;
  fundingStatus: string;
  isSpecial?: boolean;
};

type FinalizedBid = {
  id: string;
  applicationId: string;
  additionalDetails?: string;
  interestRate: string | number;
  loanAmount: string | number;
  status: string;
  tenure: string;
  userId: string;
  createdAt?: any;
  companyName?: string;
  amount?: string | number;
  inrValue?: string;
  date?: string;
  fundingReceived?: number;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-8 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-6">
          <p className="mb-4">Thank you for using Innvestrix! Your payment is complete.</p>

          <a
            href={`https://explorer.aptoslabs.com/txn/0x22f5bc72d3208e409edd28f3a4ba3743ef6dcad2eac38ef49628e5a9e1b4e78d?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline block mt-4"
          >
            View transaction on Aptos Labs
          </a>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InvestorDashboard() {
  const router = useRouter();
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [finalizedBids, setFinalizedBids] = useState<FinalizedBid[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchFinalizedBids(user.uid);
        fetchLoanApplications(user.uid);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  const fetchLoanApplications = async (userId: string) => {
    try {
      const docRef = getDocs(collection(db, "applications"));
      if (docRef) {
        const applications: LoanApplication[] = [];
        (await docRef).forEach((doc) => {
          applications.push({ id: doc.id, ...doc.data() } as LoanApplication);
        });

        const sortedApplications = applications.sort((a, b) => {
          if (a.isSpecial === b.isSpecial) return 0;
          return a.isSpecial ? -1 : 1;
        });
        setLoanApplications(sortedApplications);
      } else {
        toast.error("No applications found");
        setLoanApplications([]);
      }
    } catch (error) {
      toast.error("Failed to load applications");
      console.error('Error fetching loan applications:', error);
    }
  };

  const fetchFinalizedBids = async (userId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, "bids"));
      const bids: FinalizedBid[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        if ((data.status === 'finalized' || data.status === 'payment') && data.userId === userId) {
          // Get company name from application if needed
          let companyName = data.companyName || "";
          try {
            if (!companyName && data.applicationId) {
              const applicationDoc = await getDoc(doc(db, "applications", data.applicationId));
              if (applicationDoc.exists()) {
                companyName = applicationDoc.data().companyName || "";
              }
            }
          } catch (err) {
            console.error("Error fetching company name:", err);
          }

          bids.push({
            id: docSnapshot.id,
            applicationId: data.applicationId || "",
            companyName: companyName,
            amount: data.amount || data.loanAmount || "0",
            inrValue: data.inrValue || `${(parseFloat(String(data.loanAmount || "0")) * 777.36).toFixed(2)}`,
            date: data.date || (data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString()),
            status: data.status || "unknown",
            interestRate: data.interestRate || "0",
            tenure: data.tenure || "0",
            userId: data.userId || "",
            fundingReceived: data.fundingReceived || 0,
            loanAmount: data.loanAmount || "0",
          });
        }
      }

      setFinalizedBids(bids);
    } catch (error) {
      console.error('Error fetching finalized bids:', error);
      toast.error('Failed to load bids');
    }
  };

  const handleFund = async (applicationId: string, amount: number) => {
    try {
      const transactionHash = await fundStartup(Number(applicationId), amount * 10);
      setTransactionHash(transactionHash ?? null);
      setIsModalOpen(true);
      toast.success("Startup funded successfully!");

      // Find the relevant bid
      const bidsSnapshot = await getDocs(collection(db, "bids"));
      let targetBid: FinalizedBid | null = null as FinalizedBid | null;

      bidsSnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        if (data.applicationId === applicationId && data.userId === userId) {
          targetBid = {
            ...data as FinalizedBid,
            id: docSnapshot.id
          };
        }
      });

      if (targetBid) {
        const docRef = doc(db, "bids", targetBid.id);
        // Safely convert funding values to numbers
        const currentFundingReceived = parseFloat(String(targetBid.fundingReceived || 0));
        const newFundingReceived = currentFundingReceived + amount;
        const targetLoanAmount = parseFloat(String(targetBid.loanAmount || 0));

        await updateDoc(docRef, { fundingReceived: newFundingReceived });

        if (newFundingReceived >= targetLoanAmount) {
          await updateDoc(docRef, { status: "completed" });
          if (newFundingReceived > targetLoanAmount) {
            toast("Funding exceeds requested amount");
          } else {
            toast.success("Bid fully funded!");
          }
        }

        // Update the application's loan amount
        const applicationRef = doc(db, "applications", applicationId);
        const applicationSnapshot = await getDoc(applicationRef);

        if (applicationSnapshot.exists()) {
          const applicationData = applicationSnapshot.data();
          const currentAppLoanAmount = parseFloat(String(applicationData.loanAmount || 0));
          const newLoanAmount = Math.max(0, currentAppLoanAmount - amount);
          await updateDoc(applicationRef, { loanAmount: newLoanAmount });
          fetchLoanApplications(userId!);
        }
      }

      fetchFinalizedBids(userId!);
    } catch (error) {
      console.error("Error funding the startup:", error);
      toast.error("Failed to fund startup");
    }
  };

    const { account, signAndSubmitTransaction } = useWallet();


    async function proceedToPayment(bid: FinalizedBid) {
    try {
      // Get the bid document
      const bidRef = doc(db, "bids", bid.id);
      const bidSnap = await getDoc(bidRef);

      if (!bidSnap.exists()) {
        toast.error("Bid not found");
        return;
      }

      // Get required data
      const bidData = bidSnap.data();
      const amount = parseFloat(String(bidData.loanAmount || "0"));

      // Ensure we have an account
      if (!account) {
        toast.error("Wallet not connected");
        return;
      }

      // Create the transaction
      try {
        const pendingTransaction = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: "0x1::aptos_account::transfer",
            typeArguments: [],
            functionArguments: [bidData.smeuserId, Math.floor(amount * 100000000)] // Convert to octas (10^8)
          },
        });

        // Set transaction hash immediately
        setTransactionHash(pendingTransaction.hash);

        // Configure Aptos client
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);

        // Wait for transaction to complete
        toast.loading("Processing transaction...");
        const executedTransaction = await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });

        // Update status in database
        await updateDoc(bidRef, {
          status: 'finalized',
          // transactionHash: pendingTransaction.hash
        });

        // Show success
        toast.dismiss();
        toast.success("Payment successful!");
        setIsModalOpen(true);

        // Refresh data
        if (userId) {
          fetchFinalizedBids(userId);
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        toast.error(error.message || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    }
  }

  const safeParseFloat = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    try {
      return parseFloat(value.toString()) || 0;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); router.push('/dashboard/investor'); }}
        transactionHash={transactionHash}
      />

      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            className="border-white bg-black text-white hover:bg-white hover:text-black"
            onClick={() => router.push('/dashboard/investor/MyBids')}
          >
            View My Bids
          </Button>
          <h1 className="text-2xl font-bold">Investor Dashboard</h1>
          <Button
            variant="outline"
            className="border-white bg-black text-white hover:bg-white hover:text-black"
            onClick={() => router.push('/dashboard/investor/preferences')}
          >
            View Personalised Preferences
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">SMEs looking for funding</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {loanApplications.map((application) => (
                <div
                  key={application.id}
                  className={`p-4 rounded-lg border ${application.isSpecial ? 'border-green-500' : 'border-[#333333]'} bg-black hover:border-white transition-colors`}
                >
                  <div className="relative group">
                    <h3 className="text-lg font-medium mb-2">
                      {application.companyName}
                      {application.isSpecial && (
                        <span className="ml-2" title="No transaction fees for this application!">🌱</span>
                      )}
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-2">
                    Amount: {application.loanAmount} APT (₹{application.loanAmountInINR || (application.loanAmount * 777.36)})
                  </p>
                  <p className="text-gray-400 mb-3">Status: {application.fundingStatus}</p>
                  <div className="flex gap-3">
                    <Button
                      className="bg-white text-black hover:bg-gray-200"
                      onClick={() => router.push(`/dashboard/investor/viewapplication/?id=${application.id}`)}
                    >
                      View Application
                    </Button>
                    <Button
                      className="bg-white text-black hover:bg-gray-200"
                      onClick={() => router.push(`/dashboard/investor/bid/${application.id}`)}
                    >
                      Bid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Finalized Bids</h2>
              <p className="text-gray-400">
                Total Invested: {finalizedBids.reduce((acc, bid) => acc + safeParseFloat(bid.amount || bid.loanAmount), 0).toFixed(2)} APT
              </p>
            </div>

            {finalizedBids.length === 0 ? (
              <div className="text-gray-400 text-center py-6">
                No finalized bids found.
              </div>
            ) : (
              <div className="space-y-4">
                {finalizedBids.map((bid) => (
                  <div key={bid.id} className="p-4 rounded-lg border border-[#333333] bg-black hover:border-white transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {bid.companyName && bid.companyName.length > 0
                          ? bid.companyName.slice(0, 2).toUpperCase()
                          : "SM"}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-white text-lg">{bid.companyName || "Unknown Company"}</h3>
                            <p className="text-sm text-gray-400">Amount: {bid.amount || bid.loanAmount || "0"} APT</p>
                          </div>
                          <span className={`px-3 py-1 ${bid.status === 'payment' ? 'bg-yellow-500' : 'bg-green-500'} text-black text-sm rounded-full`}>
                            {bid.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                          <div>
                            <p className="text-sm text-gray-400">Interest Rate</p>
                            <p className="text-white font-medium">{bid.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Tenure</p>
                            <p className="text-white font-medium">{bid.tenure}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <p className="text-white font-medium">{bid.status}</p>
                          </div>
                        </div>

                        {bid.status === 'payment' && (
                          <div className="mt-4">
                            <p className="text-sm text-red-400 mb-2">
                              Failure to complete payment within 7 days will result in account suspension.
                            </p>
                            <Button
                              className="bg-yellow-500 text-black hover:bg-yellow-600"
                              onClick={() => proceedToPayment(bid)}
                            >
                              Proceed to Payment
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}