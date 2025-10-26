import React from 'react'
import { AppSidebar } from '@/components/molecules/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/atoms/sidebar'
import { getServerSidePayloadAuth } from '@/lib/auth/server'
import { payloadAction } from '@/lib/data/payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AppLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const payloadAuth = await getServerSidePayloadAuth()

  const session = await payloadAuth.betterAuth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const userId = (session as any).user.id as string
  const userRole = ((session as any).user.role as string) || 'client'

  const projectsResult = await payloadAction.find({
    collection: 'payload-projects',
    where:
      userRole === 'admin'
        ? {}
        : {
            clientId: {
              equals: userId,
            },
          },
    limit: 100,
    sort: '-createdAt',
  } as any)

  const projects = Array.isArray((projectsResult as any)?.docs)
    ? (projectsResult as any).docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        createdAt: d.createdAt,
      }))
    : []

  return (
    <SidebarProvider>
      <AppSidebar projects={projects} />
      <SidebarInset>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2">
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
