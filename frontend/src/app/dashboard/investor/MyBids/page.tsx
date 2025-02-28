"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PercentageCircle } from "@/components/ui/percentage-circle"
import { db } from "@/app/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Loader2 } from "lucide-react"

export interface Bid {
  id: string
  userId: string
  applicationId: string
  loanAmount: string
  interestRate: string
  tenure: string
  status: string
  additionalDetails: string
}

export interface ApplicationDetails {
  id: number
  companyName: string
  fundingStatus: string
}

export default function MyBids() {
  const [bids, setBids] = useState<(Bid & { companyName: string; fundingStatus: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        router.push("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchBids = async () => {
      if (!uid) return
      try {
        const q = query(collection(db, "bids"), where("userId", "==", uid))
        const querySnapshot = await getDocs(q)
        const fetchedBids: (Bid & { companyName: string; fundingStatus: string })[] = []

        for (const docSnap of querySnapshot.docs) {
          const bidData = docSnap.data() as Bid
          const applicationRef = doc(db, "applications", bidData.applicationId)
          const applicationSnap = await getDoc(applicationRef)
          if (applicationSnap.exists()) {
            const applicationData = applicationSnap.data() as ApplicationDetails
            fetchedBids.push({
              ...bidData,
              id: docSnap.id,
              companyName: applicationData.companyName,
              fundingStatus: applicationData.fundingStatus,
            })
          }
        }
        setBids(fetchedBids)
      } catch (error) {
        console.error("Error fetching bids:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBids()
  }, [uid])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-500"
      case "finalized":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Button className="mb-6 bg-white text-black hover:bg-gray-200" onClick={() => router.push("/dashboard/investor")}>
        Back to Dashboard
      </Button>
      {bids.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-4xl">No bids yet :/</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="border border-[#333333] rounded-xl bg-black p-6 space-y-4 hover:border-gray-600 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{bid.companyName}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs text-black ${getStatusColor(bid.fundingStatus)}`}>
                  {bid.fundingStatus}
                </span>
              </div>

              <p className="text-sm text-gray-400">{bid.additionalDetails}</p>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#333333]">
                <div>
                  <p className="text-sm text-gray-400">Invested Amount</p>
                  <p className="text-white font-medium">{bid.loanAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tenure</p>
                  <p className="text-white font-medium">{bid.tenure}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-400 mb-2">Interest Rate</p>
                  <PercentageCircle percentage={parseFloat(bid.interestRate)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="mt-4 bg-blue-500 text-white hover:bg-blue-600" onClick={() => router.push(`/dashboard/investor/viewapplication/?id=${bid.applicationId}`)}>
                  View Application
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
