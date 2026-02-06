"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

export default function JourneyButton() {
  const { user, loading: userLoading } = useUser();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if user has data in the 'onboarding' table
      fetch('/api/onboarding')
        .then((res) => res.json())
        .then((json) => {
          // If the 'data' object exists and has keys (like 'mobile'), they are onboarded
          if (json.data && Object.keys(json.data).length > 0) {
            setIsOnboarded(true);
          }
          setCheckingStatus(false);
        })
        .catch(() => setCheckingStatus(false));
    } else {
      setCheckingStatus(false);
    }
  }, [user]);

  const isLoading = userLoading || (user && checkingStatus);

  if (isLoading) {
    return (
      <button className="mt-14 px-14 py-4 bg-[#1F2937] text-[#F5F6F3] rounded-full font-serif text-lg opacity-80 cursor-wait">
        Loading...
      </button>
    );
  }

  // Case 1: Logged in AND Onboarded -> Go to Dashboard
  if (user && isOnboarded) {
    return (
      <Link href="/dashboard">
        <button className="mt-14 px-14 py-4 bg-[#1F2937] text-[#F5F6F3] rounded-full font-serif text-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
          Go to Dashboard
        </button>
      </Link>
    );
  }

  // Case 2: Logged in BUT NOT Onboarded -> Go to Onboarding Form
  if (user && !isOnboarded) {
    return (
      <Link href="/dashboard">
        <button className="mt-14 px-14 py-4 bg-[#1F2937] text-[#F5F6F3] rounded-full font-serif text-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
          Complete Setup
        </button>
      </Link>
    );
  }

  // Case 3: Not Logged in -> Sign In
  return (
    <a href="/api/auth/google">
      <button className="mt-14 px-14 py-4 bg-[#1F2937] text-[#F5F6F3] rounded-full font-serif text-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
        Begin the Journey
      </button>
    </a>
  );
}