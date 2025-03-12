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
  Network,
  AptosConfig,
  Aptos,
  APTOS_COIN,
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
  smeWalletAddress?: string; // Added for wallet transfer
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, transactionHash }) => {
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

          {transactionHash && (
            <a
              href={`https://explorer.aptoslabs.com/txn/${transactionHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline block mt-4"
            >
              View transaction on Aptos Labs
            </a>
          )}
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Get wallet functions from Aptos wallet adapter
  const { account, connected, connect, disconnect, wallets, signAndSubmitTransaction, network } = useWallet();

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

  // Check wallet connection
  useEffect(() => {
    if (!connected && account === null) {
      // Optional: You can auto-connect here or prompt user to connect
      console.log("Wallet not connected");
    } else if (connected && account) {
      console.log("Connected wallet:", account.address);
    }
  }, [connected, account]);

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
          let smeWalletAddress = data.smeWalletAddress || "";

          try {
            if (data.applicationId) {
              const applicationDoc = await getDoc(doc(db, "applications", data.applicationId));
              if (applicationDoc.exists()) {
                const appData = applicationDoc.data();
                companyName = appData.companyName || "";

                // Get SME wallet address from user profile if available
                if (appData.userId) {
                  const userDoc = await getDoc(doc(db, "users", appData.userId));
                  if (userDoc.exists()) {
                    smeWalletAddress = userDoc.data().walletAddress || "";
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error fetching company details:", err);
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
            smeWalletAddress: smeWalletAddress,
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

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      // If wallet is already connected, disconnect it
      if (connected && account) {
        await disconnect();
        toast.success("Wallet disconnected");
        return;
      }

      // If wallets are available, connect to the first one or show options
      if (wallets && wallets.length > 0) {
        // You might want to let the user choose which wallet to connect
        // For simplicity, we'll connect to the first available wallet
        await connect(wallets[0].name);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("No wallets found. Please install an Aptos wallet extension");
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
    }
  };
  // Disconnect wallet function
  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  // New implementation of proceedToPayment using Aptos wallet
  async function proceedToPayment(bid: FinalizedBid) {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Processing payment...");

      const bidRef = doc(db, "bids", bid.id);
      const bidSnap = await getDoc(bidRef);
      const appRef = doc(db, "applications", bidSnap.data()?.applicationId);
      const receiverId = bidSnap.data()?.smeuserId;
      const amount = safeParseFloat(bidSnap.data()?.loanAmount);

      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);

      if (!bidSnap.exists()) {
        toast.dismiss(loadingToast);
        toast.error("Bid not found");
        return;
      }

      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: [APTOS_COIN],
          functionArguments: [receiverId, amount * 100000000], // 1 is in Octas
        },
      });
      // if you want to wait for transaction
      try {
        await aptos.waitForTransaction({ transactionHash: response.hash });
        setTransactionHash(String(response.hash));
      } catch (error) {
        console.error(error);
      }

      await updateDoc(bidRef, {
        status: 'finalized',
        // transactionHash: pendingTransaction.hash
      });
      await updateDoc(appRef, {
        fundingStatus: 'finalized'
      });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Payment completed successfully!");

      setIsModalOpen(true);
    } catch (e) {
      toast.error("An error occurred. Try Again.")
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
          <div>
            <Button
              variant="outline"
              className="border-white bg-black text-white hover:bg-white hover:text-black mr-4"
              onClick={() => router.push('/dashboard/investor/MyBids')}
            >
              View My Bids
            </Button>

            {!connected && (
              <Button
                variant="outline"
                className="border-green-500 bg-black text-green-500 hover:bg-green-500 hover:text-black"
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </Button>
            )}

            {connected && account && (
              <Button
                variant="outline"
                className="border-red-500 bg-black text-red-500 hover:bg-red-500 hover:text-black"
                onClick={handleDisconnectWallet}
              >
                Disconnect Wallet
              </Button>
            )}
          </div>

          <h1 className="text-2xl font-bold">Investor Dashboard</h1>

          <Button
            variant="outline"
            className="border-white bg-black text-white hover:bg-white hover:text-black"
            onClick={() => router.push('/dashboard/investor/preferences')}
          >
            View Personalised Preferences
          </Button>
        </div>

        {connected && account && (
          <div className="mb-6 p-4 rounded-lg border border-green-500 bg-green-500 bg-opacity-10">
            <p className="text-green-400">
              Connected: <span className="font-mono">{String(account.address).substring(0, 6)}...{String(account.address).substring(String(account.address).length - 4)}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">Network: {network?.name || 'Unknown'}</p>
          </div>
        )}

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
                              disabled={isProcessing || !connected}
                            >
                              {isProcessing ? "Processing..." : "Proceed to Payment"}
                            </Button>
                            {!connected && (
                              <p className="text-sm text-yellow-400 mt-2">
                                Please connect your wallet to make a payment
                              </p>
                            )}
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