"use client";
/* eslint-disable */
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle, Loader2, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { getDocs, collection, updateDoc, DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import { useEdgeStore } from "@/lib/edgestore";
import { verifyDocument, VERIFICATION_PROMPTS } from "@/lib/verification"; // Import the verification functions and prompts

interface DocumentStatus {
  file: File | null;
  status: "idle" | "validating" | "verifying" | "verified" | "verification-failed" | "success" | "error";
  url: string;
  verificationResult?: {
    isValid: boolean;
    confidence: number;
    warnings: string[];
    analysis: string;
  };
}

// Map component document types to verification document types
const documentTypeMapping: Record<string, string> = {
  identityProof: "identityProof",
  bankStatements: "bankStatement",
  taxReturns: "incomeTax",
  addressProof: "addressProof"
};

export default function DocumentUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const userId = searchParams.get("userId");

  const [loggedInUser, setLoggedInUser] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { edgestore } = useEdgeStore();

  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({
    identityProof: { file: null, status: "idle", url: "" },
    bankStatements: { file: null, status: "idle", url: "" },
    taxReturns: { file: null, status: "idle", url: "" },
    addressProof: { file: null, status: "idle", url: "" },
  });

  const [showVerificationDetails, setShowVerificationDetails] = useState<Record<string, boolean>>({
    identityProof: false,
    bankStatements: false,
    taxReturns: false,
    addressProof: false,
  });

  const [video, setVideo] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState("");

  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([
    "Technology",
    "Manufacturing",
    "Healthcare",
    "Agribusiness",
    "Renewable-Energy",
    "Education",
    "E-commerce",
    "Infrastructure",
    "Financial-Services",
    "Consumer-Goods",
    "Artisanal-and-Handicrafts",
    "Sustainable-and-Social-Enterprises",
    "Green Buildings",
    "Sustainable Agriculture",
    "Sustainable Forestry",
    "Green Transportation",
    "Waste Management",
    "Recycling",
  ]);
  const [customTag, setCustomTag] = useState("");

  // Authentication check
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user.uid);
        // If there's a userId in the URL and it doesn't match the logged-in user, redirect
        if (userId && userId !== user.uid) {
          toast.error("Unauthorized access");
          router.push("/dashboard/investee");
        }
      } else {
        router.push("/login");
      }
    });
  }, [router, userId]);

  const validateFile = async (file: File, type: string): Promise<boolean> => {
    // For documents
    if (type !== "video") {
      // Validate file size (max 5MB for documents)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File size should be less than 5MB`);
        return false;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPEG, and PNG files are allowed");
        return false;
      }
    } else {
      // For video
      // Validate video size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video size should be less than 50MB");
        return false;
      }

      // Validate video type
      const allowedTypes = ["video/mp4", "video/quicktime"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only MP4 and MOV formats are allowed");
        return false;
      }
    }

    return true;
  };

  const handleFileChange = async (documentId: string, file: File | null) => {
    if (!file) return;

    // Update state to show validating
    setDocuments((prev) => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        file,
        status: "validating",
      },
    }));

    // Validate the file format and size
    const isValid = await validateFile(file, "document");
    if (!isValid) {
      setDocuments((prev) => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          status: "error",
        },
      }));
      return;
    }

    try {
      if (!edgestore) {
        toast.error("Upload service unavailable");
        setDocuments((prev) => ({
          ...prev,
          [documentId]: { ...prev[documentId], status: "error" },
        }));
        return;
      }

      // Upload to EdgeStore
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          console.log(`${documentId} upload progress:`, progress);
        },
      });

      // Set document status to verifying
      setDocuments((prev) => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          file,
          status: "verifying",
          url: res.url,
        },
      }));

      // Verify the document after upload
      try {
        toast(`Verifying ${documentId.replace(/([A-Z])/g, " $1").trim()}...`);
        
        // Get the verification document type from mapping
        const verificationType = documentTypeMapping[documentId];
        
        if (!verificationType) {
          throw new Error(`Unknown document type: ${documentId}`);
        }
        
        // Call the verification function
        const verificationResult = await verifyDocument(
          file,
          verificationType as "identityProof" | "addressProof" | "incomeTax" | "bankStatement"
        );

        // Update the document status based on verification result
        if (verificationResult.isValid && verificationResult.confidence >= 0.6) {
          setDocuments((prev) => ({
            ...prev,
            [documentId]: {
              file,
              status: "verified",
              url: res.url,
              verificationResult
            },
          }));
          toast.success(
            `${documentId.replace(/([A-Z])/g, " $1").trim()} verified successfully!`
          );
        } else {
          setDocuments((prev) => ({
            ...prev,
            [documentId]: {
              file,
              status: "verification-failed",
              url: res.url,
              verificationResult
            },
          }));
          
          if (verificationResult.warnings.length > 0) {
            toast.error(
              `${documentId.replace(/([A-Z])/g, " $1").trim()} verification failed: ${verificationResult.warnings[0]}`
            );
          } else {
            toast.error(
              `${documentId.replace(/([A-Z])/g, " $1").trim()} verification failed. Please upload a valid document.`
            );
          }
        }
      } catch (verificationError) {
        console.error(`Error verifying ${documentId}:`, verificationError);
        setDocuments((prev) => ({
          ...prev,
          [documentId]: {
            file,
            status: "verification-failed",
            url: res.url,
            verificationResult: {
              isValid: false,
              confidence: 0.1,
              warnings: ["Verification process failed."],
              analysis: "Document verification process failed due to technical issues."
            }
          },
        }));
        toast.error(
          `Failed to verify ${documentId.replace(/([A-Z])/g, " $1").trim()}. Please try again.`
        );
      }
    } catch (error) {
      console.error(`Error uploading ${documentId}:`, error);
      setDocuments((prev) => ({
        ...prev,
        [documentId]: { ...prev[documentId], status: "error" },
      }));
      toast.error(
        `Failed to upload ${documentId.replace(/([A-Z])/g, " $1").trim()}`
      );
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;

    setVideoStatus("validating");
    setVideoError(null);

    // Validate the video
    const isValid = await validateFile(file, "video");
    if (!isValid) {
      setVideoStatus("error");
      return;
    }

    try {
      if (!edgestore) {
        throw new Error("Upload service unavailable");
      }

      // Upload to EdgeStore
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          console.log("Video upload progress:", progress);
        },
      });

      setVideo(file);
      setVideoStatus("success");
      setVideoUrl(res.url);
      toast.success("Pitch video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      setVideoStatus("error");
      setVideoError("Failed to upload video. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, documentId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      await handleFileChange(documentId, droppedFile);
    },
    [edgestore]
  );

  const toggleVerificationDetails = (documentId: string) => {
    setShowVerificationDetails(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };

  const handleSubmit = async () => {
    // Validate that all required documents have been verified, video is uploaded, and at least one tag is provided
    const allDocumentsVerified = Object.entries(documents).every(
      ([_, doc]) => doc.status === "verified"
    );
    
    if (!allDocumentsVerified) {
      toast.error("Please ensure all documents are verified");
      return;
    }
    
    if (videoStatus !== "success") {
      toast.error("Please upload a pitch video");
      return;
    }
    
    if (selectedTags.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!applicationId || !loggedInUser) {
        throw new Error("Missing application ID or user information");
      }

      // Get all document URLs and verification results
      const documentData = Object.entries(documents).reduce((acc, [key, value]) => {
        acc[key] = {
          url: value.url,
          verified: value.status === "verified",
          confidence: value.verificationResult?.confidence || 0,
          warnings: value.verificationResult?.warnings || []
        };
        return acc;
      }, {} as Record<string, any>);

      // Find the application document and update it
      const applicationsRef = collection(db, "applications");
      const querySnapshot = await getDocs(applicationsRef);
      let applicationDoc: DocumentSnapshot<any> | null = null as DocumentSnapshot<any> | null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.id.toString() === applicationId) {
          applicationDoc = doc;
        }
      });

      if (!applicationDoc) {
        throw new Error("Application not found");
      }
      
      // Update the application with document data, video link, and tags
      await updateDoc(applicationDoc!.ref, {
        documents: documentData,
        videoLink: videoUrl,
        tags: selectedTags,
        verificationCompleted: true,
        verificationDate: new Date().toISOString()
      });

      toast.success("Application submitted successfully!");
      router.push(`/dashboard/investee/viewapplication?id=${applicationId}`);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render document status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validating":
        return <Loader2 className="text-yellow-500 h-5 w-5 animate-spin" />;
      case "verifying":
        return <Loader2 className="text-blue-500 h-5 w-5 animate-spin" />;
      case "verified":
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case "verification-failed":
        return <AlertCircle className="text-red-500 h-5 w-5" />;
      case "success":
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case "error":
        return <AlertCircle className="text-red-500 h-5 w-5" />;
      default:
        return null;
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "validating":
        return "border-yellow-500";
      case "verifying":
        return "border-blue-500";
      case "verified":
        return "border-green-500";
      case "verification-failed":
        return "border-red-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-500 hover:border-white";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
        <span className="text-xl font-medium">Investrix</span>
        <Button
          variant="ghost"
          className="text-white bg-black hover:bg-white hover:text-black"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Upload and Verify Documents</h1>
        <p className="text-sm text-gray-400 mb-6">
          All documents will be automatically verified for authenticity using AI. Verification results will be shown after upload.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Upload Section */}
          <div className="space-y-6">
            {Object.entries(documents).map(([docId, doc]) => (
              <div key={docId} className="p-4 border border-[#333333] rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium capitalize">
                      {docId.replace(/([A-Z])/g, " $1").trim()}
                    </h3>
                    <p className="text-sm text-gray-400">
                      PDF, JPEG or PNG (max. 5MB)
                    </p>
                    {doc.status === "verifying" && (
                      <p className="text-xs text-blue-400 mt-1">
                        Verifying document authenticity...
                      </p>
                    )}
                    {doc.status === "verified" && (
                      <p className="text-xs text-green-400 mt-1 flex items-center">
                        <Shield className="h-3 w-3 mr-1" /> 
                        Verified with {(doc.verificationResult?.confidence || 0) * 100}% confidence
                      </p>
                    )}
                    {doc.status === "verification-failed" && (
                      <p className="text-xs text-red-400 mt-1">
                        Verification failed. Please upload a valid document.
                      </p>
                    )}
                  </div>
                  {getStatusIcon(doc.status)}
                </div>

                <div
                  className={`mt-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${getStatusColorClass(doc.status)}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, docId)}
                >
                  <input
                    type="file"
                    id={docId}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileChange(docId, e.target.files?.[0] || null)
                    }
                  />
                  <label
                    htmlFor={docId}
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-6 w-6" />
                    {doc.file ? "Change File" : "Drag & drop or click to upload"}
                  </label>
                  {doc.file && (
                    <p className="text-sm text-gray-400 mt-2">
                      {doc.file.name}
                    </p>
                  )}
                </div>

                {(doc.status === "verified" || doc.status === "verification-failed") && 
                  doc.verificationResult && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleVerificationDetails(docId)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {showVerificationDetails[docId] ? "Hide" : "Show"} verification details
                    </button>
                    
                    {showVerificationDetails[docId] && (
                      <div className="mt-2 text-sm p-3 bg-gray-800 rounded-lg">
                        <p className="font-semibold mb-1">Confidence: {(doc.verificationResult.confidence * 100).toFixed(0)}%</p>
                        
                        {doc.verificationResult.warnings.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold">Warnings:</p>
                            <ul className="list-disc pl-5 text-yellow-400">
                              {doc.verificationResult.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <p className="font-semibold">Analysis:</p>
                          <p className="text-gray-300 whitespace-pre-wrap">{doc.verificationResult.analysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Video Upload and Tags Section */}
          <div className="space-y-6">
            <div className="p-4 border border-[#333333] rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">Pitch Video</h3>
                  <p className="text-sm text-gray-400">
                    Upload a short video (max. 50MB) pitching your business and loan requirement
                  </p>
                </div>
                {videoStatus === "success" && (
                  <CheckCircle className="text-green-500 h-5 w-5" />
                )}
                {videoStatus === "validating" && (
                  <Loader2 className="text-yellow-500 h-5 w-5 animate-spin" />
                )}
                {videoStatus === "error" && (
                  <AlertCircle className="text-red-500 h-5 w-5" />
                )}
              </div>

              <div
                className={`mt-4 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${videoStatus === "idle"
                    ? "border-gray-500 hover:border-white"
                    : ""
                  }
                  ${videoStatus === "validating" ? "border-yellow-500" : ""}
                  ${videoStatus === "success" ? "border-green-500" : ""}
                  ${videoStatus === "error" ? "border-red-500" : ""}`}
              >
                <input
                  type="file"
                  id="pitchVideo"
                  className="hidden"
                  accept="video/mp4,video/quicktime"
                  onChange={(e) =>
                    handleVideoUpload(e.target.files?.[0] || null)
                  }
                />
                <label
                  htmlFor="pitchVideo"
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="h-6 w-6" />
                  {video ? "Change Video" : "Drag & drop or click to upload"}
                </label>
                {video && (
                  <p className="text-sm text-gray-400 mt-2">{video.name}</p>
                )}
                {videoError && (
                  <p className="text-red-500 text-sm mt-2">{videoError}</p>
                )}
              </div>

              {video && videoStatus === "success" && (
                <video
                  className="mt-4 w-full rounded-lg"
                  controls
                  src={videoUrl || URL.createObjectURL(video)}
                />
              )}
            </div>
            
            {/* Tags Section */}
            <div className="p-4 border border-[#333333] rounded-lg">
              <h3 className="font-medium mb-2">Business Tags</h3>
              <p className="text-sm text-gray-400 mb-4">
                Select tags that best describe your business:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) => [...prev, tag]);
                      setAvailableTags((prev) => prev.filter((t) => t !== tag));
                    }}
                    className="px-3 py-1 rounded-full text-sm bg-gray-700 hover:bg-gray-600"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag"
                  className="flex-1 px-3 py-2 border rounded-lg border-gray-600 bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTag.trim()) {
                      setSelectedTags((prev) => [...prev, customTag.trim()]);
                      setCustomTag("");
                    }
                  }}
                  className="px-4 py-2 text-white bg-blue-800 rounded-lg"
                >
                  Add
                </button>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Selected Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-gray-800 text-white flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTags((prev) =>
                            prev.filter((t) => t !== tag)
                          );
                          // Only add back to available tags if it was originally there
                          if (availableTags.includes(tag) || 
                              ["Technology", "Manufacturing", "Healthcare", "Agribusiness", 
                               "Renewable-Energy", "Education", "E-commerce", "Infrastructure", 
                               "Financial-Services", "Consumer-Goods", "Artisanal-and-Handicrafts", 
                               "Sustainable-and-Social-Enterprises", "Green Buildings", 
                               "Sustainable Agriculture", "Sustainable Forestry", 
                               "Green Transportation", "Waste Management", "Recycling"].includes(tag)) {
                            setAvailableTags((prev) => [...prev, tag]);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Verification Status Summary */}
        <div className="mt-8 p-4 border border-[#333333] rounded-lg">
          <h2 className="font-bold mb-2">Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(documents).map(([docId, doc]) => (
              <div key={docId} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  doc.status === "verified" ? "bg-green-500" :
                  doc.status === "verifying" ? "bg-blue-500" :
                  doc.status === "validating" ? "bg-yellow-500" :
                  "bg-red-500"
                }`}></div>
                <span className="capitalize">{docId.replace(/([A-Z])/g, " $1").trim()}: </span>
                <span className={`text-sm ${
                  doc.status === "verified" ? "text-green-500" :
                  doc.status === "verifying" ? "text-blue-500" :
                  doc.status === "validating" ? "text-yellow-500" :
                  "text-red-500"
                }`}>
                  {doc.status === "verified" ? "Verified" :
                   doc.status === "verifying" ? "Verifying..." :
                   doc.status === "validating" ? "Validating..." :
                   doc.status === "idle" ? "Not uploaded" :
                   "Verification failed"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            variant="outline"
            className="border-white text-white bg-black hover:bg-white hover:text-black"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            className="bg-white text-black hover:bg-gray-200"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !Object.entries(documents).every(([_, doc]) => doc.status === "verified") ||
              videoStatus !== "success" ||
              selectedTags.length === 0
            }
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </div>
    </div>
  );
}