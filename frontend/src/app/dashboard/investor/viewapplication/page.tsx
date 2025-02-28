"use client";
/* eslint-disable */
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/app/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Award,
  Calendar,
  DollarSign,
  IndianRupee,
  Phone,
  Tag,
  X,
  Building,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,

} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Types
interface Application {
  id: string | number;
  companyName: string;
  businessType: string;
  tags?: Array<string | { tag: string; isSpecial: boolean }>;
  loanPurpose: string;
  yearsInOperation: number | string;
  annualRevenue: number | string;
  phone: string;
  fundingStatus: string;
  fundingReceived: number;
  loanAmount: number | string;
  loanAmountInINR: number;
  pitch?: string;
  videoLink?: string;
  videoUrl?: string;
  companyDescription?: string;
  status?: string;
  contact?: {
    companyEmail: string;
    companyPhone: string;
  };
  documents?: {
    identityProof: string;
    bankStatements: string;
    taxReturns: string;
    addressProof: string;
  };
  contactPerson?: string;
  submittedDate?: string;
}

interface ShowGraphs {
  revenue: boolean;
  customers: boolean;
  market: boolean;
  burnRate: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Default categories if none are provided
const DEFAULT_CATEGORIES = ["Financial Services", "Technology", "Services"];

export default function ApplicationView() {
  const router = useRouter();
  const search = useSearchParams();
  const applicationId = search.get("id");
  const [application, setApplication] = useState<Application | null>(null);
  const [showGraphs, setShowGraphs] = useState<ShowGraphs>({
    revenue: false,
    customers: false,
    market: false,
    burnRate: false
  });
  const [showContactCard, setShowContactCard] = useState(false);

  // Generate current date if submittedDate is not available
  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) return;

      try {
        const appRef = doc(db, "applications", applicationId);
        const appSnap = await getDoc(appRef);

        if (appSnap.exists()) {
          const appData = appSnap.data() as Application;
          // Calculate INR value if not already present
          if (!appData.loanAmountInINR && appData.loanAmount) {
            appData.loanAmountInINR = Number(appData.loanAmount) * 777.36;
          }
          // Set default status if none exists
          if (!appData.status) {
            appData.status = appData.fundingStatus || "Under Review";
          }
          // Set pitch from companyDescription if pitch is not available
          if (!appData.pitch && appData.companyDescription) {
            appData.pitch = appData.companyDescription;
          }
          // Set videoLink from videoUrl if needed
          if (!appData.videoLink && appData.videoUrl) {
            appData.videoLink = appData.videoUrl;
          }
          // Add default tags if none exist
          if (!appData.tags) {
            appData.tags = DEFAULT_CATEGORIES.map(cat => cat);
          }
          // Add submission date if missing
          if (!appData.submittedDate) {
            appData.submittedDate = currentDate;
          }
          
          setApplication(appData);
          toast.success('Application found!');
        } else {
          toast.error("Application not found!");
        }
      } catch (error) {
        console.error("Error fetching application:", error);
        toast.error("Error fetching application!");
      }
    };

    fetchApplication();
  }, [applicationId, currentDate]);

  const toggleGraph = (metric: keyof ShowGraphs) => {
    setShowGraphs(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'under review':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getDocumentStatus = (status: string) => {
    // Just check if URL exists
    if (status && status.startsWith('https://')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  if (!application) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <p className="text-xl">Loading application details...</p>
      </div>
    );
  }

  const hasSpecialTag = application.tags?.some(
    (tag) => typeof tag === "object" && tag.isSpecial
  );

  // Extract loan details for clear presentation
  const loanDetails = {
    amount: typeof application.loanAmount === 'number' ? application.loanAmount.toString() : application.loanAmount,
    currency: "APT",
    inrValue: `₹${application.loanAmountInINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    purpose: application.loanPurpose,
    tenure: "12 months", // Default value
    interestRate: "12%", // Default value
    repaymentSchedule: "Monthly", // Default value
    expectedMonthlyPayment: `${(Number(application.loanAmount) * 0.095).toFixed(1)} APT` // Approximation
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
        <span className="text-xl font-medium">Investrix</span>
        <Button 
          variant="outline" 
          className="text-white bg-black hover:text-black hover:bg-white"
          onClick={() => router.push('/dashboard/investor')}
        >
          Back to Dashboard
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area - Loan Details and Video */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111111] p-6 rounded-lg border border-[#333333]">
              <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <div className="flex items-center mt-1">
                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{loanDetails.amount} APT</p>
                  </div>
                  <p className="text-sm text-gray-500">{loanDetails.inrValue}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Purpose</p>
                  <div className="flex items-center mt-1">
                    <Briefcase className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{loanDetails.purpose}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Founded Since</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    <p className="font-medium">{application.yearsInOperation} years</p>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Video Pitch Section */}
            {application.videoLink || application.videoUrl ? (
              <div className="border border-[#333333] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Company Pitch</h2>
                <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={application.videoLink || application.videoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            ) : null}
            
            

          </div>

          {/* Sidebar - Company Info & Documents */}
          <div className="space-y-6">
            <div className="bg-[#111111] p-6 rounded-lg border border-[#333333]">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2 text-gray-400" />
                    <p className="font-medium">{application.companyName}</p>
                  </div>
                  <p className="text-sm text-gray-400">{application.businessType}</p>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-400 mb-2">Tags</p>
                  {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {application.tags?.map((tag, index) => {
                  const tagText = typeof tag === "object" ? tag.tag : tag;
                  const isSpecial = typeof tag === "object" && tag.isSpecial;

                  return (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isSpecial ? "bg-green-500 text-black" : "bg-[#333333] text-white"
                      }`}
                    >
                      {tagText}
                    </span>
                  );
                })}
              </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-400 mb-3">Document Verification</p>
                  <div className="space-y-3">
                    {application.documents && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm">Identity Proof</p>
                          {getDocumentStatus(application.documents.identityProof)}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm">Bank Statements</p>
                          {getDocumentStatus(application.documents.bankStatements)}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm">Tax Returns</p>
                          {getDocumentStatus(application.documents.taxReturns)}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm">Address Proof</p>
                          {getDocumentStatus(application.documents.addressProof)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Card Modal */}
        {showContactCard && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-[#333333] rounded-xl p-6 max-w-md w-full relative">
              <button
                onClick={() => setShowContactCard(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6">Contact Information</h2>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-400">Company</h3>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{application.phone}</p>
                    </div>
                  </div>
                  {application.contactPerson && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Contact Person</p>
                        <p className="text-white">{application.contactPerson}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-white text-black hover:bg-gray-200"
                onClick={() => setShowContactCard(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
          variant="outline"
            className="flex-1 bg-black text-white border-white hover:bg-white hover:text-black py-6 text-lg"
            onClick={() => router.push(`/dashboard/investor/bid/${application.id}`)}
          >
            Place Bid
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white bg-black text-white hover:bg-white hover:text-black py-6 text-lg"
            onClick={() => setShowContactCard(true)}
          >
            Contact Company
          </Button>
        </div>
      </div>
    </div>
  );
}