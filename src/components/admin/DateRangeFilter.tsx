import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  onDateRangeChange: (range: { startDate: Date; endDate: Date } | null) => void;
  onPresetChange: (days: number) => void;
}

export const DateRangeFilter = ({ onDateRangeChange, onPresetChange }: DateRangeFilterProps) => {
  const [date, setDate] = useState<DateRange | undefined>();
  const [activePreset, setActivePreset] = useState<number>(30);

  const handlePresetClick = (days: number) => {
    setActivePreset(days);
    setDate(undefined);
    onPresetChange(days);
    onDateRangeChange(null);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    setActivePreset(0);
    if (range?.from && range?.to) {
      onDateRangeChange({ startDate: range.from, endDate: range.to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-2">
        <Button
          variant={activePreset === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(7)}
        >
          Last 7 days
        </Button>
        <Button
          variant={activePreset === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(30)}
        >
          Last 30 days
        </Button>
        <Button
          variant={activePreset === 90 ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(90)}
        >
          Last 90 days
        </Button>
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === 0 && date ? "default" : "outline"}
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
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
              <span>Custom range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
