'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type React from 'react'
import { useState } from 'react'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  // NOTE: place all third party context providers here
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <div>{children}</div>
    </QueryClientProvider>
  )
}
