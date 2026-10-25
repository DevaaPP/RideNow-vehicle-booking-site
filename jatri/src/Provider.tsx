'use client'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import React from 'react'

interface ProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function Provider({ children, session }: ProviderProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}

export default Provider
