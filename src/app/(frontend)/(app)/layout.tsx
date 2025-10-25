import React from 'react'
import { AppSidebar } from '@/components/molecules/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/atoms/breadcrumb'
import { Separator } from '@/components/atoms/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/atoms/sidebar'
import Link from 'next/link'
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
