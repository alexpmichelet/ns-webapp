'use client'
import { useState } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/atoms/field'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setFormError(null)
    setFormSuccess(null)

    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors
      if (errs.email?.[0]) setEmailError(errs.email[0])
      return
    }

    setIsSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await authClient.requestPasswordReset({ email, redirectTo })
      if (error) {
        const status = (error as any)?.status
        const message = error.message || 'Request failed'
        if (status === 429) {
          setFormError('Too many requests. Please try again later.')
        } else {
          setFormError(message)
        }
        return
      }
      setFormSuccess('If an account exists, a reset link was sent. Check server logs for the link.')
      toast({
        variant: 'success',
        title: 'Reset link sent',
        description: 'Check the server console for the link.',
      })
    } catch (err: any) {
      setFormError(err?.message || 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('flex min-h-svh w-full items-center justify-center p-6 md:p-10')}>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>Enter your email to receive a reset link.</CardDescription>
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
                      const res = schema.pick({ email: true }).safeParse({ email })
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending…' : 'Send reset link'}
                    </Button>
                  </div>
                  {formError ? (
                    <FieldDescription className="text-red-600">{formError}</FieldDescription>
                  ) : null}
                  {formSuccess ? (
                    <FieldDescription className="text-green-600">{formSuccess}</FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
