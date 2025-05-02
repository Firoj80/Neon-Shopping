
"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.ComponentProps<"div"> {
  range?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

export function DateRangePicker({
  className,
  range,
  onRangeChange,
  numberOfMonths = 1, // Default to 1 month for mobile friendliness
  triggerClassName,
  align = "center", // Default alignment
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(range);

  // Update internal state when the external range prop changes
  React.useEffect(() => {
    setDate(range);
  }, [range]);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setDate(selectedRange);
    if (onRangeChange) {
      onRangeChange(selectedRange);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-primary/50 hover:border-secondary focus:border-secondary focus:shadow-secondary focus:ring-secondary [&[data-state=open]]:border-primary [&[data-state=open]]:shadow-primary",
              !date && "text-muted-foreground",
              triggerClassName // Allow overriding trigger styles
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-secondary/50" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            // Customize calendar appearance
            classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                day_range_middle: "aria-selected:bg-primary/20 aria-selected:text-primary",
                day_today: "bg-secondary/30 text-secondary-foreground font-bold",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
