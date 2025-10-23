'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { Badge } from '@/components/atoms/badge'
import { createTimeLog } from '@/app/actions/time-logs'
import { useToast } from '@/hooks/use-toast'
import { Play, Pause, Square } from 'lucide-react'

type TimeTrackerProps = {
  tickets: Array<{ id: string; title: string; client: any }>
  onLogCreated?: () => void
}

export function TimeTracker({ tickets, onLogCreated }: TimeTrackerProps) {
  const { toast } = useToast()
  const [selectedTicket, setSelectedTicket] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved timer state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timeTracker')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.isRunning && data.startTime) {
        setSelectedTicket(data.ticketId || '')
        setDescription(data.description || '')
        setStartTime(new Date(data.startTime))
        setIsRunning(true)

        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000)
        setElapsedSeconds(elapsed)
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Save timer state to localStorage
  useEffect(() => {
    if (isRunning && startTime) {
      localStorage.setItem(
        'timeTracker',
        JSON.stringify({
          isRunning: true,
          startTime: startTime.toISOString(),
          ticketId: selectedTicket,
          description,
        })
      )
    } else {
      localStorage.removeItem('timeTracker')
    }
  }, [isRunning, startTime, selectedTicket, description])

  function handleStart() {
    if (!selectedTicket) {
      toast({
        title: 'Error',
        description: 'Please select a ticket first',
        variant: 'destructive',
      })
      return
    }

    setStartTime(new Date())
    setIsRunning(true)
    setElapsedSeconds(0)
  }

  function handlePause() {
    setIsRunning(false)
  }

  function handleResume() {
    setIsRunning(true)
  }

  async function handleStop() {
    if (!selectedTicket || !startTime) return

    setIsSubmitting(true)

    const hours = Math.round((elapsedSeconds / 3600) * 4) / 4 // Round to nearest 0.25

    const result = await createTimeLog({
      ticket: selectedTicket,
      description: description || 'Work on ticket',
      hours,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      isBillable: true,
    })

    if (result.success) {
      toast({
        title: 'Time Logged',
        description: `${hours} hours logged successfully`,
      })

      // Reset
      setIsRunning(false)
      setElapsedSeconds(0)
      setStartTime(null)
      setDescription('')
      setSelectedTicket('')
      localStorage.removeItem('timeTracker')

      if (onLogCreated) {
        onLogCreated()
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to log time',
        variant: 'destructive',
      })
    }

    setIsSubmitting(false)
  }

  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const hours = Math.round((elapsedSeconds / 3600) * 4) / 4

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Time Tracker</span>
          {isRunning && <Badge variant="destructive">Recording</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Ticket</label>
          <Select
            value={selectedTicket}
            onValueChange={setSelectedTicket}
            disabled={isRunning}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a ticket" />
            </SelectTrigger>
            <SelectContent>
              {tickets.map((ticket) => (
                <SelectItem key={ticket.id} value={ticket.id}>
                  {ticket.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            disabled={isRunning}
            rows={3}
          />
        </div>

        <div className="bg-muted p-6 rounded-lg text-center">
          <div className="text-5xl font-mono font-bold mb-2">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-sm text-muted-foreground">
            {hours} hours (rounded to 0.25h)
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {!isRunning && elapsedSeconds === 0 && (
            <Button onClick={handleStart} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          )}

          {isRunning && (
            <>
              <Button onClick={handlePause} size="lg" variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleStop}
                size="lg"
                variant="destructive"
                disabled={isSubmitting}
              >
                <Square className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Stop & Save'}
              </Button>
            </>
          )}

          {!isRunning && elapsedSeconds > 0 && (
            <>
              <Button onClick={handleResume} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleStop}
                size="lg"
                variant="destructive"
                disabled={isSubmitting}
              >
                <Square className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Stop & Save'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
