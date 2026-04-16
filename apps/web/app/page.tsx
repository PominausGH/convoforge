'use client'

import { useState, useEffect } from 'react'
import { initiateProPayment } from '@/lib/stripe'

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let id = localStorage.getItem('cf_user_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('cf_user_id', id)
    }
    setUserId(id)
  }, [])

  const handleUpgrade = async () => {
    if (userId) {
      await initiateProPayment(userId)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen space-y-6">
      <h1 className="text-4xl font-bold text-center">ConvoForge</h1>
      <p className="text-gray-600 text-center max-w-md">
        Master communication through behavioral intelligence and Carnegie principles.
      </p>

      {userId && (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-zinc-100 text-zinc-800 px-4 py-2 rounded-lg text-sm font-mono">
            User ID: {userId.slice(0, 8)}...
          </div>
          
          <button
            onClick={() => window.location.href = '/session'}
            className="bg-black text-white px-8 py-3 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
          >
            Start Forge Session
          </button>

          <button
            onClick={handleUpgrade}
            className="text-blue-600 font-medium hover:underline mt-4"
          >
            Upgrade to ConvoForge Pro
          </button>
        </div>
      )}
    </div>
  )
}
