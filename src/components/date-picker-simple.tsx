import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar" // Importando o arquivo que acabamos de resetar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SmartDatePicker({ value, onChange, label }: any) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Tratamento de segurança para a data
  const date = React.useMemo(() => {
    if (!value) return undefined
    // Se já for objeto Date, usa. Se for string, tenta fazer parse.
    const parsed = value instanceof Date ? value : parseISO(value)
    // Só retorna se for uma data válida
    return isValid(parsed) ? parsed : undefined
  }, [value])

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
          </Button>
        </PopoverTrigger>
        {/* w-auto e p-0 são essenciais aqui */}
        <PopoverContent className="w-auto p-0 " align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              // Envia formato ISO (YYYY-MM-DD...) para o formulário
              if (d) {
                const formattedDate = format(d, "yyyy-MM-dd");
                onChange(formattedDate);
              } else {
                onChange("");
              }
              setIsOpen(false) // Fecha o popover após selecionar
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}