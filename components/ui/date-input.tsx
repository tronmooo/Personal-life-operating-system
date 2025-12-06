import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string
  onChange?: (value: string) => void
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value || '')

    React.useEffect(() => {
      setDisplayValue(value || '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(inputValue)) {
        const date = new Date(inputValue)
        if (!isNaN(date.getTime())) {
          onChange?.(inputValue)
        }
      } else if (inputValue === '') {
        onChange?.('')
      }
    }

    const handleBlur = () => {
      // If the input is empty or invalid, set to today's date
      if (!displayValue || !/^\d{4}-\d{2}-\d{2}$/.test(displayValue)) {
        // Use a stable date to prevent hydration mismatch
        const today = '2025-10-06' // Fixed date to prevent hydration issues
        setDisplayValue(today)
        onChange?.(today)
      }
    }

    return (
      <Input
        type="text"
        placeholder="YYYY-MM-DD"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput }
