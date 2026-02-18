import {
  Button, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader,
  CalendarHeaderCell, DateInput, DateRangePicker, DateSegment, Dialog,
  Group, Heading, Label, Popover, RangeCalendar,
  I18nProvider,
  RangeCalendarStateContext 
} from 'react-aria-components';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useContext } from 'react'; 


function CustomCalendarCell({ date }: { date: any }) {
  const state = useContext(RangeCalendarStateContext);
  
  // Calculamos manualmente se a data faz parte do intervalo selecionado!
  const isCustomSelected = state?.highlightedRange 
    ? date.compare(state.highlightedRange.start) >= 0 && date.compare(state.highlightedRange.end) <= 0 
    : false;
    
  const isCustomSelectionStart = state?.highlightedRange 
    ? date.compare(state.highlightedRange.start) === 0 
    : false;
    
  const isCustomSelectionEnd = state?.highlightedRange 
    ? date.compare(state.highlightedRange.end) === 0 
    : false;

  return (
    <CalendarCell
      date={date}
      className={({ isOutsideMonth, isToday, isSelected, isSelectionStart, isSelectionEnd }) => {
        
        // Juntamos o estado original com o nosso estado forçado
        const selected = isSelected || isCustomSelected;
        const start = isSelectionStart || isCustomSelectionStart;
        const end = isSelectionEnd || isCustomSelectionEnd;

        return cn(
          "flex h-9 w-9 items-center justify-center rounded-md text-sm outline-none transition-all cursor-pointer",
          "hover:bg-accent hover:text-accent-foreground",

          // 1. FORA DO MÊS (Não selecionado)
          isOutsideMonth && !selected && "text-muted-foreground/30",

          // 2. O MEIO DO INTERVALO (Dias normais do mês)
          selected && !start && !end && !isOutsideMonth && "bg-primary/20 text-primary",

          // 3. O MEIO DO INTERVALO (Dias FORA do mês)
          // Agora vai funcionar! Fundo e fonte levemente mais opacos que a cor principal
          selected && !start && !end && isOutsideMonth && "bg-primary/10 text-primary/40",

          // 4. INÍCIO DA SELEÇÃO
          start && !isOutsideMonth && "bg-primary text-primary-foreground rounded-l-md",
          start && isOutsideMonth && "bg-primary/60 text-primary-foreground/70 rounded-l-md",

          // 5. FIM DA SELEÇÃO
          end && !isOutsideMonth && "bg-primary text-primary-foreground rounded-r-md",
          end && isOutsideMonth && "bg-primary/60 text-primary-foreground/70 rounded-r-md",

          // 6. SELEÇÃO ÚNICA (Início e Fim no mesmo dia)
          start && end && "rounded-md",

          // 7. HOJE
          isToday && "border border-primary"
        );
      }}
    />
  );
}

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
          
          <DateInput slot="start" className="flex flex-1 justify-center">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="rounded-sm px-0.5 outline-none focus:bg-primary focus:text-primary-foreground"
              />
            )}
          </DateInput>

          <span aria-hidden="true" className="px-1 text-muted-foreground font-bold">–</span>

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
                    <CustomCalendarCell date={date} />
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