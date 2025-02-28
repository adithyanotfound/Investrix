"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  FileText,
  Shield,
  AlertCircle
} from "lucide-react";

// Mock selected bid data - replace with actual data from your state management
const selectedBid = {
  id: "BID001",
  investorName: "Harshit",
  investorType: "Individual Investor",
  bidAmount: "120",
  currency: "APT",
  inrValue: "₹93,283",
  interestRate: "10.5%",
  tenure: "12 months",
  monthlyPayment: "11 APT",
  disbursementDate: "2024-03-15",
  firstPaymentDate: "2024-04-15",
  documents: [
    "Loan Agreement",
    "Payment Schedule",
    "Terms & Conditions"
  ]
};


export default function BidConfirmation() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (showSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard/investee');
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSuccess, router]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      // API call to confirm bid would go here
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setShowSuccess(true);
    } catch (error) {
      console.error('Error confirming bid:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Bid Successfully Confirmed!</h1>
          <p className="text-gray-400">
            Your investment agreement has been finalized with {selectedBid.investorName}
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in {countdown} seconds...
          </p>
          <Button
            onClick={() => router.push('/dashboard/investee')}
            className="bg-white text-black hover:bg-gray-200"
          >
            Go to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
        <span className="text-xl font-medium">Investrix</span>
        <Button 
          variant="ghost" 
          className="text-gray-300 hover:text-white"
          onClick={() => router.push('/dashboard/investee/bids')}
        >
          Back to Bids
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Confirm Investment Agreement</h1>
          <p className="text-gray-400">
            Please review the final terms before confirming the investment
          </p>
        </div>

        {/* Investor Details */}
        <div className="bg-[#111111] rounded-lg border border-[#333333] p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <h2 className="text-lg font-medium">{selectedBid.investorName}</h2>
                <p className="text-sm text-gray-400">{selectedBid.investorType}</p>
              </div>
            </div>
            <Shield className="w-5 h-5 text-green-500" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400">Investment Amount</p>
              <div className="flex items-center mt-1">
                <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                <p className="font-medium">
                  {selectedBid.bidAmount} {selectedBid.currency}
                </p>
              </div>
              <p className="text-sm text-gray-500">{selectedBid.inrValue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Interest Rate</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
                <p className="font-medium">{selectedBid.interestRate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tenure</p>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                <p className="font-medium">{selectedBid.tenure}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">Monthly Payment</p>
              <p className="font-medium mt-1">{selectedBid.monthlyPayment}</p>
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <div className="bg-[#111111] rounded-lg border border-[#333333] p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Important Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400">Disbursement Date</p>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                <p className="font-medium">{selectedBid.disbursementDate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">First Payment Due</p>
              <div className="flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                <p className="font-medium">{selectedBid.firstPaymentDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-[#111111] rounded-lg border border-[#333333] p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">Required Documents</h3>
          <div className="space-y-3">
            {selectedBid.documents.map((doc, index) => (
              <div key={index} className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">Important Notice</p>
              <p className="text-sm text-gray-400 mt-1">
                By confirming this agreement, you are entering into a legally binding contract.
                Please ensure you have reviewed all terms and conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="border-[#333333] text-black hover:bg-[#222222]"
            onClick={() => router.push('/dashboard/investee/bids')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="bg-green-500 text-white hover:bg-green-600"
          >
            {isConfirming ? (
              'Confirming...'
            ) : (
              <>
                Confirm Agreement
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}