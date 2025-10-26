'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/atoms/button'
import { Separator } from '@/components/atoms/separator'

type Props = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value
    }
  }, [value])

  const exec = (cmd: string) => {
    document.execCommand(cmd)
    if (ref.current) onChange(ref.current.innerText || '')
  }

  return (
    <div className="border rounded-md">
      <div className="flex gap-1 p-2 border-b bg-muted/50">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('bold')}>
          Bold
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('italic')}>
          Italic
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertUnorderedList')}>
          • List
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertOrderedList')}>
          1. List
        </Button>
      </div>
      <div
        ref={ref}
        className="min-h-32 max-h-80 overflow-y-auto p-3 outline-none"
        contentEditable
        data-placeholder={placeholder}
        onInput={() => ref.current && onChange(ref.current.innerText || '')}
        onBlur={() => ref.current && onChange(ref.current.innerText || '')}
        suppressContentEditableWarning
      />
    </div>
  )
}

