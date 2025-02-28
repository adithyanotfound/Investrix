/* eslint-disable */

import { Account, Aptos, AptosConfig, Network, AccountAddress, NetworkToNetworkName, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
console.log(app);
const db = getFirestore(app);
const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const COIN_STORE = `0x1::coin::CoinStore<${APTOS_COIN}>`;
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

async function get_acc_no(id: number) {
  const collectionRef = collection(db, "applications");
  const q = query(collectionRef, where("id", "==", id));
  const querySnapshot = await getDocs(q);
  let data1: string = "";

  querySnapshot.forEach((doc) => {
    const data: any = doc.data();
    data1 = data["acc_no"];
  });

  return data1;

}


async function push_acc_no(id: number, acc_hash: any) {
  const collectionRef = collection(db, "applications");
  const q = query(collectionRef, where("applicationId", "==", id));

  // Get the matching documents
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(async (docSnap) => {
    const docRef = doc(db, "applications", docSnap.id);
    await updateDoc(docRef, {
      ["acc_hash"]: acc_hash,
    });

    console.log(`Field 'acc_hash' updated successfully for document with applicationId: ${id} and the hash is ${acc_hash}`);
  });
}

export async function createStartup(startup_id: number) {
  const startup_acc = Account.generate();
  console.log(`Startup created with hash:  ${startup_acc.accountAddress}`);
  try {
    push_acc_no(startup_id, startup_acc.accountAddress);
  }
  catch (error) {
    console.error("Firebase errror!");
  }
}

export async function fundStartup(startupId: number, amt: number) {
  try {
    const investorStringKey = process.env.NEXT_PUBLIC_INVESTOR_PRIVATE_KEY || "";
    const investorPrivateKey = new Ed25519PrivateKey(investorStringKey);


    const investorAccount = Account.fromPrivateKey({
      privateKey: investorPrivateKey
    });
    console.log("Investor pvt: ", investorAccount.privateKey);

    const startupAddress = await get_acc_no(startupId);
    console.log(startupAddress);

    const startupStringKey = process.env.NEXT_PUBLIC_STARTUP_PRIVATE_KEY || "";

    const startupPrivateKey = new Ed25519PrivateKey(startupStringKey);

    const startupAccount = Account.fromPrivateKey({
      privateKey: startupPrivateKey
    });

    console.log("Startup pvt: ", startupAccount.privateKey);

    const aliceBalance = await balance("Investor", investorAccount.accountAddress);
    const bobBalance = await balance("Startup", startupAccount.accountAddress);

    console.log("Balances are : ", aliceBalance, bobBalance);


    // await aptos.fundAccount({ accountAddress: investorAccount.accountAddress, amount: 100_000_000 });
    // await aptos.fundAccount({ accountAddress: startupAccount.accountAddress, amount: 1_000 });


    const transaction = await aptos.transferCoinTransaction({
      sender: investorAccount.accountAddress,
      recipient: startupAccount.accountAddress,
      amount: amt,
    });


    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: investorAccount,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });


    console.log("Transaction submitted:", response.hash);
    console.log("Transaction confirmed!: ", response.hash);

    return response.hash;
  } catch (error) {
    console.error("Error funding startup:", error);
  }
}

const balance = async (name: string, accountAddress: AccountAddress, versionToWaitFor?: bigint): Promise<number> => {
  const amount = await aptos.getAccountAPTAmount({
    accountAddress,
    minimumLedgerVersion: versionToWaitFor,
  });
  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};