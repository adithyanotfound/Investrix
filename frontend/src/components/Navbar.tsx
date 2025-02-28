'use client';
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        toast.success('Sign out successful');
        setUser(null);
        router.push('/');
      })
      .catch((error) => {
        console.error(error);
        toast.error('Unable to sign out');
      });
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-black border-b border-[#333333]">
      <Rocket className="w-8 h-8 text-white" />
      <span className="text-white text-xl font-medium">Investrix</span>
      <div className="flex gap-4">
        {user ? (
          <Button variant="ghost" className="text-gray-300" onClick={handleSignOut}>Sign Out</Button>
        ) : (
          <Button variant="ghost" className="text-gray-300" onClick={() => router.push('/login')}>Login</Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
