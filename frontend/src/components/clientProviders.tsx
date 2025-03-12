'use client'

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react"
import { EdgeStoreProvider } from "@/lib/edgestore"
import { Toaster } from "react-hot-toast"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <EdgeStoreProvider>
      <AptosWalletAdapterProvider optInWallets={["Petra"]}>
        <Toaster position="bottom-right" />
        {children}
      </AptosWalletAdapterProvider>
    </EdgeStoreProvider>
  )
}