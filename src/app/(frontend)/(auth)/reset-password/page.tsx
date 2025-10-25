'use client'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/atoms/field'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const tokenFromUrl = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!tokenFromUrl) {
      setFormError('Invalid or missing token')
    }
  }, [tokenFromUrl])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setConfirmError(null)
    setFormError(null)
    setFormSuccess(null)

    const parsed = schema.safeParse({ password, confirm })
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors as any
      if (errs.password?.[0]) setPasswordError(errs.password[0])
      if (errs.confirm?.[0]) setConfirmError(errs.confirm[0])
      return
    }

    if (!tokenFromUrl) {
      setFormError('Missing token')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: tokenFromUrl,
      })
      if (error) {
        const status = (error as any)?.status
        const message = error.message || 'Reset failed'
        if (status === 400) {
          setFormError('Invalid or expired token')
        } else if (status === 429) {
          setFormError('Too many requests. Please try again later.')
        } else {
          setFormError(message)
        }
        return
      }
      setFormSuccess('Password has been reset. You can now sign in.')
      toast({ variant: 'success', title: 'Password reset', description: 'You can now sign in.' })
      setTimeout(() => router.push('/sign-in'), 1200)
    } catch (err: any) {
      setFormError(err?.message || 'Reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('flex min-h-svh w-full items-center justify-center p-6 md:p-10')}>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Enter a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>
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
                      const res = schema
                        .pick({ password: true, confirm: true })
                        .safeParse({ password, confirm })
                      if (!res.success) {
                        const errs = res.error.flatten().fieldErrors as any
                        setPasswordError(errs.password?.[0] || null)
                      } else {
                        setPasswordError(null)
                      }
                    }}
                  />
                  {passwordError ? (
                    <FieldDescription className="text-red-600">{passwordError}</FieldDescription>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value)
                      if (confirmError) setConfirmError(null)
                    }}
                    onBlur={() => {
                      const res = schema.safeParse({ password, confirm })
                      if (!res.success) {
                        const errs = res.error.flatten().fieldErrors as any
                        setConfirmError(errs.confirm?.[0] || null)
                      } else {
                        setConfirmError(null)
                      }
                    }}
                  />
                  {confirmError ? (
                    <FieldDescription className="text-red-600">{confirmError}</FieldDescription>
                  ) : null}
                </Field>
                <Field>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || !tokenFromUrl}>
                      {isSubmitting ? 'Resetting…' : 'Reset password'}
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
