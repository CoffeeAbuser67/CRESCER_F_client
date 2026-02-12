// *******************
// MODIFIQUE AQUI!
// client/src/components/ui/calendar.tsx
// *******************
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// *******************
// MODIFIQUE AQUI!
// client/src/components/ui/calendar.tsx
// *******************

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4",
        month: "space-y-4",
        
        // TOPO: < Fevereiro 2026 >
        // O h-9 e o relative garantem que as setas tenham onde se ancorar
        month_caption: "flex justify-center items-center h-9 relative mb-4", 
        caption_label: "text-sm font-medium",
        
        // NAVEGAÇÃO: Prende as setas nas extremidades internas do header
        nav: "flex items-center justify-between absolute inset-x-0 w-full px-2", 
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-50 hover:opacity-100 z-10 cursor-pointer"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-50 hover:opacity-100 z-10 cursor-pointer"
        ),

        // GRID: Resolve o "segterqua..." e alinha os números
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between", // Espaçamento entre os nomes dos dias
        weekday: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2", // Espaçamento entre as linhas de dias
        
        day: "p-0 text-center text-sm relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => orientation === "left" ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }