'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import { Progress } from '@/components/atoms/progress'
import { useToast } from '@/hooks/use-toast'

export type UploadedFile = {
  file: File
  previewUrl?: string
  status: 'queued' | 'uploading' | 'uploaded' | 'error'
  progress: number
  mediaId?: string
  url?: string
  error?: string
}

type Props = {
  accept?: string[]
  maxSizeMb?: number
  onChange?: (files: UploadedFile[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export default function FileUploadArea({
  accept = ['image/*', 'application/pdf', 'text/plain'],
  maxSizeMb = 20,
  onChange,
  onUploadingChange,
}: Props) {
  const { toast } = useToast()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File) => {
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > maxSizeMb) {
      return `File exceeds ${maxSizeMb}MB`
    }
    if (accept.length > 0) {
      const ok = accept.some((a) => {
        if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', ''))
        return file.type === a
      })
      if (!ok) return 'Unsupported file type'
    }
    return null
  }

  const addFiles = (list: FileList | File[]) => {
    const next: UploadedFile[] = []
    Array.from(list).forEach((file) => {
      const err = validateFile(file)
      if (err) {
        toast({ variant: 'warning', title: `${file.name}: ${err}` })
        return
      }
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      next.push({ file, previewUrl, status: 'queued', progress: 0 })
    })
    if (next.length === 0) return
    setFiles((prev) => {
      const merged = [...prev, ...next]
      onChange?.(merged)
      return merged
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
  }

  const removeAt = (idx: number) => {
    setFiles((prev) => {
      const copy = [...prev]
      const item = copy[idx]
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      copy.splice(idx, 1)
      onChange?.(copy)
      return copy
    })
  }

  const uploadOne = async (idx: number) => {
    setFiles((prev) => {
      const copy = [...prev]
      if (!copy[idx]) return prev
      copy[idx] = { ...copy[idx], status: 'uploading', progress: 0 }
      return copy
    })
    onUploadingChange?.(true)
    try {
      const file = files[idx].file
      const form = new FormData()
      form.append('file', file)
      form.append('alt', file.name)
      const xhr = new XMLHttpRequest()
      const promise = new Promise<{ id: string; url?: string }>((resolve, reject) => {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100)
            setFiles((prev) => {
              const copy = [...prev]
              if (!copy[idx]) return prev
              copy[idx] = { ...copy[idx], progress: pct }
              return copy
            })
          }
        }
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText)
                resolve({ id: json?.doc?.id || json?.id, url: json?.doc?.url || json?.url })
              } catch (e) {
                resolve({ id: '' })
              }
            } else {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', '/api/payload-media')
        xhr.setRequestHeader('Accept', 'application/json')
        xhr.send(form)
      })
      const result = await promise
      setFiles((prev) => {
        const copy = [...prev]
        if (!copy[idx]) return prev
        copy[idx] = {
          ...copy[idx],
          status: 'uploaded',
          progress: 100,
          mediaId: result.id,
          url: result.url,
        }
        onChange?.(copy)
        return copy
      })
    } catch (e: any) {
      const msg = e?.message || 'Upload failed'
      setFiles((prev) => {
        const copy = [...prev]
        if (!copy[idx]) return prev
        copy[idx] = { ...copy[idx], status: 'error', error: msg }
        return copy
      })
      toast({ variant: 'destructive', title: msg })
    } finally {
      const stillUploading = files.some((f, i) =>
        i === idx ? false : f.status === 'uploading' || f.status === 'queued',
      )
      onUploadingChange?.(stillUploading)
    }
  }

  const uploadAll = async () => {
    const indices = files.map((_, i) => i)
    for (const i of indices) {
      if (files[i]?.status === 'queued') {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(i)
      }
    }
  }

  useEffect(() => {
    // Auto-start uploads when new files added
    if (files.some((f) => f.status === 'queued')) {
      uploadAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length])

  return (
    <div>
      <div
        className={cn(
          'border border-dashed rounded-md p-4 text-center transition-colors',
          isDragging ? 'border-primary bg-muted' : 'border-muted-foreground/30',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p className="text-sm text-muted-foreground">Drag & drop files here, or</p>
        <div className="mt-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept.join(',')}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Max size {maxSizeMb}MB. Allowed: {accept.join(', ')}
        </p>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 space-y-3">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-md border p-2">
              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.file.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs">
                  {f.file.type.split('/')[1] || 'file'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{f.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(f.file.size / (1024 * 1024)).toFixed(2)} MB • {f.status}
                </div>
                <Progress value={f.progress} className="mt-2" />
                {f.error ? <div className="text-xs text-red-600 mt-1">{f.error}</div> : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => removeAt(idx)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

