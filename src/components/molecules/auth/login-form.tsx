'use client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/atoms/field'
import { Input } from '@/components/atoms/input'
import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setEmailError(null)
    setPasswordError(null)
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      if (fieldErrors.email?.[0]) setEmailError(fieldErrors.email[0])
      if (fieldErrors.password?.[0]) setPasswordError(fieldErrors.password[0])
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await authClient.signIn.email(
        { email, password, callbackURL: '/dashboard', rememberMe: true },
        {
          onSuccess: () => {
            toast({ variant: 'success', title: 'Welcome back!' })
            router.push('/dashboard')
          },
          onError: (ctx) => {
            const status = ctx.error?.status
            const message = ctx.error?.message || 'Login failed'
            if (status === 401) {
              setPasswordError('Invalid email or password')
            } else if (status === 429) {
              setFormError('Too many attempts. Please try again later.')
            } else {
              setFormError(message)
            }
          },
        },
      )
      if (error) {
        const status = (error as any)?.status
        const message = error.message || 'Login failed'
        if (status === 401) {
          setPasswordError('Invalid email or password')
        } else if (status === 429) {
          setFormError('Too many attempts. Please try again later.')
        } else {
          setFormError(message)
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  onBlur={() => {
                    const res = loginSchema.pick({ email: true }).safeParse({ email })
                    setEmailError(
                      res.success ? null : res.error.flatten().fieldErrors.email?.[0] || null,
                    )
                  }}
                />
                {emailError ? (
                  <FieldDescription className="text-red-600">{emailError}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(null)
                  }}
                  onBlur={() => {
                    const res = loginSchema.pick({ password: true }).safeParse({ password })
                    setPasswordError(
                      res.success ? null : res.error.flatten().fieldErrors.password?.[0] || null,
                    )
                  }}
                />
                {passwordError ? (
                  <FieldDescription className="text-red-600">{passwordError}</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </Button>
                  <Link href="/forgot-password" className="text-sm underline self-center">
                    Forgot password?
                  </Link>
                </div>
                {formError ? (
                  <FieldDescription className="text-red-600">{formError}</FieldDescription>
                ) : null}
                <FieldDescription className="text-center">
                  Having trouble signing in ?{' '}
                  <a href="mailto:alexandre.pelloux@nativesquare.fr">contact support</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
