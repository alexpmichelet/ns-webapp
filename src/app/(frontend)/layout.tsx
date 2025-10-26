import React from 'react'
import '../globals.css'
import Providers from './providers'
import { Toaster } from '@/components/atoms/sonner'

export const metadata = {
  description: 'Time & Materials Project Management System',
  title: 'Time & Materials Project Management System',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </Providers>
      </body>
    </html>
  )
}
