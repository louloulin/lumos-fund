"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  className?: string
  value?: Date
  onChange?: (date?: Date) => void
}

export function DatePicker({ 
  date, 
  setDate, 
  className,
  value,
  onChange
}: DatePickerProps) {
  // 支持两种用法：date+setDate 或 value+onChange
  const selectedDate = value || date
  const handleDateChange = (newDate?: Date) => {
    if (onChange) {
      onChange(newDate)
    } else if (setDate) {
      setDate(newDate)
    }
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>选择日期</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 