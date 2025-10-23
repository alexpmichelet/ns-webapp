import React from 'react'
import '../globals.css'

export const metadata = {
  description: 'Time & Materials Project Management System',
  title: 'Time & Materials Project Management System',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
