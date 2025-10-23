import Link from 'next/link'
import { Button } from '@/components/atoms/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Welcome to the NativeSquare Web App
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Your all-in-one platform for managing projects, tracking time, and collaborating with
              your team.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-in">Log in</Link>
              </Button>

              <Button variant="outline" size="lg">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
