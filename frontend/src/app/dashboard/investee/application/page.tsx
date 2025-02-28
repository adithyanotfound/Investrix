"use client";
/* eslint-disable */
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/app/firebase';

interface FormData {
  companyName: string;
  ownerName: string;
  contactNumber: string;
  businessType: string;
  yearsInOperation: string;
  annualRevenue: string;
  loanAmount: string;
  purpose: string;
  companyDescription: string;
  agreeToTerms: boolean;
}

export default function NewApplication() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState("");
  const [submittedApplicationId, setSubmittedApplicationId] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    ownerName: "",
    contactNumber: "",
    businessType: "",
    yearsInOperation: "",
    annualRevenue: "",
    loanAmount: "",
    purpose: "",
    companyDescription: "",
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication check
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user.uid);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  const businessTypes = [
    "Manufacturing",
    "Retail",
    "Technology",
    "Services",
    "Healthcare",
    "Food & Beverage",
    "Construction",
    "Other",
  ];

  const loanPurposes = [
    "Working Capital",
    "Equipment Purchase",
    "Expansion",
    "Inventory",
    "Debt Refinancing",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName) newErrors.companyName = "Company name is required";
    if (!formData.ownerName) newErrors.ownerName = "Owner name is required";
    if (!formData.contactNumber) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid 10-digit number";
    }
    if (!formData.businessType) newErrors.businessType = "Business type is required";
    if (!formData.yearsInOperation) newErrors.yearsInOperation = "Years in operation is required";
    if (!formData.annualRevenue) newErrors.annualRevenue = "Annual revenue is required";
    if (!formData.loanAmount) newErrors.loanAmount = "Loan amount is required";
    if (!formData.purpose) newErrors.purpose = "Loan purpose is required";
    if (!formData.companyDescription) newErrors.companyDescription = "Company description is required";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const randomID = () => {
    return Math.floor(Math.random() * 1000000000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const applicationId = randomID();
        setSubmittedApplicationId(applicationId);
        
        // Map form data to application data structure
        const applicationData = {
          userId: loggedInUser,
          id: applicationId,
          applicationId,
          companyName: formData.companyName,
          contactPerson: formData.ownerName,
          phone: formData.contactNumber,
          businessType: formData.businessType,
          yearsInOperation: formData.yearsInOperation,
          annualRevenue: formData.annualRevenue,
          loanAmount: formData.loanAmount,
          loanPurpose: formData.purpose,
          companyDescription: formData.companyDescription,
          loanAmountInINR: parseInt(formData.loanAmount) * 777.36,
          fundingReceived: 0,
          fundingStatus: "pending",
          agreeTerms: formData.agreeToTerms
        };

        // Save to Firestore
        const applicationRef = doc(db, "applications", applicationId.toString());
        await setDoc(applicationRef, applicationData);

        toast.success("Application submitted successfully!");
        router.push(`/dashboard/investee/application/documents?id=${applicationId}&userId=${loggedInUser}`);
      } catch (error) {
        console.error("Error submitting application:", error);
        toast.error("Failed to submit the application. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
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

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">New Loan Application</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`bg-transparent border-[#333333] ${
                    errors.companyName ? 'border-red-500' : ''
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Owner Name</label>
                <Input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className={`bg-transparent border-[#333333] ${
                    errors.ownerName ? 'border-red-500' : ''
                  }`}
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contact Number</label>
                <Input
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  type="tel"
                  className={`bg-transparent border-[#333333] ${
                    errors.contactNumber ? 'border-red-500' : ''
                  }`}
                />
                {errors.contactNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>
                )}
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className={`w-full p-2 bg-transparent border rounded-md border-[#333333] ${
                    errors.businessType ? 'border-red-500' : ''
                  }`}
                >
                  <option value="" className="bg-black">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type} className="bg-black">
                      {type}
                    </option>
                  ))}
                </select>
                {errors.businessType && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years in Operation</label>
                <Input
                  name="yearsInOperation"
                  value={formData.yearsInOperation}
                  onChange={handleInputChange}
                  type="number"
                  className="bg-transparent border-[#333333]"
                />
                {errors.yearsInOperation && (
                  <p className="text-red-500 text-sm mt-1">{errors.yearsInOperation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Annual Revenue (in APT)</label>
                <Input
                  name="annualRevenue"
                  value={formData.annualRevenue}
                  onChange={handleInputChange}
                  type="number"
                  className="bg-transparent border-[#333333]"
                />
                {errors.annualRevenue && (
                  <p className="text-red-500 text-sm mt-1">{errors.annualRevenue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loan Amount (in APT)</label>
              <Input
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                type="number"
                className="bg-transparent border-[#333333]"
              />
              {errors.loanAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Purpose of Loan</label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className={`w-full p-2 bg-transparent border rounded-md border-[#333333] ${
                  errors.purpose ? 'border-red-500' : ''
                }`}
              >
                <option value="" className="bg-black">Select loan purpose</option>
                {loanPurposes.map((purpose) => (
                  <option key={purpose} value={purpose} className="bg-black">
                    {purpose}
                  </option>
                ))}
              </select>
              {errors.purpose && (
                <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brief Company Description</label>
              <Input
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleInputChange}
                className="bg-transparent border-[#333333]"
                placeholder="Brief description of your company and business model"
              />
              {errors.companyDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.companyDescription}</p>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="h-4 w-4"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-300">
              I agree to the terms and conditions
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Continue to Document Upload"}
          </Button>
        </form>
      </div>
    </div>
  );
}