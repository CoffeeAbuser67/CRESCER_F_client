import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  type SortingState,
  type GroupingState,
  type ExpandedState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronRight, ChevronDown, Layers } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  disableGrouping?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  disableGrouping = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "profissional", desc: false }])
  const [grouping, setGrouping] = useState<GroupingState>(disableGrouping ? [] : ["profissional"])  
  const [expanded, setExpanded] = useState<ExpandedState>(true) 

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      grouping,
      expanded,
    },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <TableRow key={row.id} className="bg-muted/50 hover:bg-muted/80">
                    <TableCell colSpan={columns.length} className="font-medium py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-2 h-8 p-0 px-2 w-full justify-start hover:bg-transparent"
                      >
                        {row.getIsExpanded() ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Layers className="h-4 w-4 mr-2 text-primary" />
                        
                        <span className="text-base font-semibold">
                           {String(row.getValue("profissional.nome") || "Sem Profissional")}
                        </span>

                        <span className="ml-2 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                           {row.subRows.length} lançamentos
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              }

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.getIsGrouped()) return null

                    return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum lançamento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}