'use client'

import * as React from 'react'
import {
  GalleryVerticalEnd,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  Ticket,
  SquarePlus,
  Hourglass,
  ListChecks,
  FlaskConical,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/atoms/sidebar'
import { Button } from '@/components/atoms/button'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { useEffect, useMemo, useState } from 'react'
import { useSelectedProjectStore } from '@/hooks/use-selected-project'

// App navigation configuration
const nav = [
  {
    title: 'Tickets',
    url: '/tickets',
    icon: Ticket,
    items: [
      { title: 'All Tickets', url: '/tickets', icon: Ticket },
      { title: 'New Ticket', url: '/tickets/new', icon: SquarePlus },
      { title: 'Estimation Queue', url: '/tickets/estimation-queue', icon: Hourglass },
      { title: 'Pending Reviews', url: '/tickets/pending-reviews', icon: ListChecks },
      { title: 'Testing', url: '/tickets/testing', icon: FlaskConical },
    ],
  },
]

type ProjectItem = { id: string; name: string; createdAt?: string }

export function AppSidebar({
  projects: projectsProp,
  ...sidebarProps
}: React.ComponentProps<typeof Sidebar> & {
  projects: ProjectItem[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Array<ProjectItem>>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const setSelectedProject = useSelectedProjectStore((s) => s.setSelectedProject)

  const isLoadingProjects = false

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast({ variant: 'success', title: 'Signed out' })
            router.push('/sign-in')
          },
          onError: () => {
            toast({ variant: 'destructive', title: 'Sign out failed' })
          },
        },
      })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Sign out failed' })
    }
  }

  useEffect(() => {
    const incoming = Array.isArray(projectsProp) ? projectsProp : []
    setProjects(incoming)
    if (incoming.length > 0 && !selectedProjectId) {
      setSelectedProjectId(incoming[0].id)
    }
    if (incoming.length === 0) {
      setSelectedProjectId(null)
    }
  }, [projectsProp, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  )

  useEffect(() => {
    if (selectedProject) {
      setSelectedProject({ id: selectedProject.id, name: selectedProject.name })
    } else {
      setSelectedProject(null)
    }
  }, [selectedProject, setSelectedProject])

  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                    <span className="truncate font-medium">
                      {isLoadingProjects
                        ? 'Loading projects...'
                        : selectedProject?.name ||
                          (projects.length === 0 ? 'No projects' : 'Select project')}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">Project</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
              >
                <DropdownMenuLabel>Projects</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects.length === 0 ? (
                  <DropdownMenuItem disabled>No projects available</DropdownMenuItem>
                ) : (
                  projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onSelect={(e) => {
                        e.preventDefault()
                        setSelectedProjectId(p.id)
                        setSelectedProject({ id: p.id, name: p.name })
                      }}
                    >
                      {p.name}
                      {p.id === selectedProjectId && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip="Dashboard">
                <Link href="/dashboard" className="font-medium flex items-center gap-2">
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {nav.map((item) => {
              const Icon = (item as any).icon as React.ComponentType<any> | undefined
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link href={item.url} className="font-medium flex items-center gap-2">
                      {Icon ? <Icon className="size-4" /> : null}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((sub) => {
                        const SubIcon = (sub as any).icon as React.ComponentType<any> | undefined
                        return (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                              <Link href={sub.url} className="flex items-center gap-2">
                                {SubIcon ? <SubIcon className="size-4" /> : null}
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
          Logout
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
