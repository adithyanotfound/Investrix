"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  LineChart
} from "lucide-react";

const mockApplication = {
  id: "APP123",
  status: "Under Review", // Can be: "Pending", "Under Review", "Approved", "Rejected"
  submittedDate: "2024-02-20",
  loanDetails: {
    amount: "100",
    currency: "APT",
    inrValue: "₹77,736",
    purpose: "Working Capital",
    tenure: "12 months",
    interestRate: "12%",
    repaymentSchedule: "Monthly",
    expectedMonthlyPayment: "9.5 APT"
  },
  companyDetails: {
    name: "Tech Solutions Inc",
    industry: "Technology",
    yearsInOperation: 3,
    annualRevenue: "₹5 Cr",
    employeeCount: "50-100",
    categories: [
      "B2B",
      "SaaS",
      "Enterprise Software",
      "Cloud Services",
      "AI/ML",
      "Tech-enabled"
    ],
    businessModel: "Subscription-based",
    marketSize: "₹1000 Cr",
    growthRate: "40% YoY"
  },
  documents: {
    identityProof: "verified",
    bankStatements: "verified",
    taxReturns: "pending",
    addressProof: "verified"
  }
};

export default function ApplicationDetails() {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'under review':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
        <span className="text-xl font-medium">Investrix</span>
        <Button 
          variant="ghost" 
          className="text-gray-300 hover:text-white"
          onClick={() => router.push('/dashboard/investee')}
        >
          Back to Dashboard
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">Loan Application #{mockApplication.id}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(mockApplication.status)} text-black`}>
                {mockApplication.status}
              </span>
            </div>
            <p className="text-gray-400">
              Submitted on {new Date(mockApplication.submittedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Loan Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111111] p-6 rounded-lg border border-[#333333]">
              <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <div className="flex items-center mt-1">
                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{mockApplication.loanDetails.amount} APT</p>
                  </div>
                  <p className="text-sm text-gray-500">{mockApplication.loanDetails.inrValue}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Purpose</p>
                  <div className="flex items-center mt-1">
                    <Briefcase className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{mockApplication.loanDetails.purpose}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tenure</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{mockApplication.loanDetails.tenure}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Interest Rate</p>
                  <p className="font-medium mt-1">{mockApplication.loanDetails.interestRate}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Repayment</p>
                  <p className="font-medium mt-1">{mockApplication.loanDetails.repaymentSchedule}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Monthly Payment</p>
                  <p className="font-medium mt-1">{mockApplication.loanDetails.expectedMonthlyPayment}</p>
                </div>
              </div>
            </div>

            {/* Document Status */}
            <div className="bg-[#111111] p-6 rounded-lg border border-[#333333]">
              <h2 className="text-xl font-semibold mb-4">Document Status</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(mockApplication.documents).map(([doc, status]) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-[#333333] rounded-lg">
                    <span className="capitalize">{doc.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {getDocumentStatus(status)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Categories and Details */}
          <div className="space-y-6">
            <div className="bg-[#111111] p-6 rounded-lg border border-[#333333]">
              <h2 className="text-xl font-semibold mb-4">Company Categories</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                    <p className="font-medium">{mockApplication.companyDetails.name}</p>
                  </div>
                  <p className="text-sm text-gray-400">{mockApplication.companyDetails.industry}</p>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-400 mb-3">Business Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {mockApplication.companyDetails.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm bg-[#333333] text-white hover:bg-[#444444] transition-colors"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#333333]">
                  <div>
                    <p className="text-sm text-gray-400">Business Model</p>
                    <p className="font-medium">{mockApplication.companyDetails.businessModel}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Team Size</p>
                    </div>
                    <p className="font-medium">{mockApplication.companyDetails.employeeCount}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Growth Rate</p>
                    </div>
                    <p className="font-medium">{mockApplication.companyDetails.growthRate}</p>
                  </div>
                </div>
              </div>
            </div>

            {mockApplication.status === 'Under Review' && (
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Application Under Review</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your application is currently under review. You will be notified once a decision is made.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}