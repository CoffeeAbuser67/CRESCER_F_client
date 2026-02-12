import {
  Button, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader,
  CalendarHeaderCell, DateInput, DateRangePicker, DateSegment, Dialog,
  Group, Heading, Label, Popover, RangeCalendar
} from 'react-aria-components';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

import {
  I18nProvider
} from 'react-aria-components';


export function SmartDateRangePicker({ label, value, onChange, ...props }: any) {
  return (

    <I18nProvider locale="pt-BR">
      <DateRangePicker
        value={value}
        onChange={onChange}
        className="group flex flex-col gap-1"
        {...props}
      >
        {label && <Label className="text-sm font-extrabold text-foreground">{label}</Label>}

        <Group className="flex h-10 w-full md:w-[320px] items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">

          {/* DateInput START - Centralizado */}
          <DateInput slot="start" className="flex flex-1 justify-center">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded-sm px-0.5 outline-none focus:bg-primary focus:text-primary-foreground"
              />
            )}
          </DateInput>

          {/* Separador Centralizado */}
          <span aria-hidden="true" className="px-1 text-muted-foreground font-bold">–</span>

          {/* DateInput END - Centralizado */}
          <DateInput slot="end" className="flex flex-1 justify-center">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded-sm px-0.5 outline-none focus:bg-primary focus:text-primary-foreground"
              />
            )}
          </DateInput>

          <Button className="ml-2 rounded-sm p-1 outline-none hover:bg-muted focus:bg-muted">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Group>

        <Popover className="z-50 rounded-md border bg-popover p-4 shadow-md outline-none border-muted">
          <Dialog>
            <RangeCalendar className="w-full">
              <header className="flex items-center justify-between pb-4">
                <Button slot="previous" className="flex h-7 w-7 items-center justify-center rounded-md border bg-transparent opacity-50 hover:opacity-100">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Heading className="text-sm font-medium" />
                <Button slot="next" className="flex h-7 w-7 items-center justify-center rounded-md border bg-transparent opacity-50 hover:opacity-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </header>

              <CalendarGrid className="border-collapse">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="text-xs font-semibold text-muted-foreground pb-2 text-center">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      date={date}
                      className={cn(
                        // Estilo Base
                        "flex h-9 w-9 items-center justify-center rounded-md text-sm outline-none transition-all cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground",

                        // Fora do mês
                        "outside-month:text-muted-foreground/30",

                        // Seleção do RANGE (O MEIO)
                        "data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary",

                        // INÍCIO DA SELEÇÃO
                        "data-[selection-start=true]:bg-primary data-[selection-start=true]:text-primary-foreground data-[selection-start=true]:rounded-l-md",

                        // FIM DA SELEÇÃO
                        "data-[selection-end=true]:bg-primary data-[selection-end=true]:text-primary-foreground data-[selection-end=true]:rounded-r-md",

                        // Seleção ÚNICA (mesmo dia início e fim)
                        "data-[selection-start=true]:data-[selection-end=true]:rounded-md",

                        // Hoje
                        "data-[today=true]:border data-[today=true]:border-primary"
                      )}
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </RangeCalendar>
          </Dialog>
        </Popover>
      </DateRangePicker>
    </I18nProvider>






  );
}