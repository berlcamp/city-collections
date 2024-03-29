import React, { useEffect, useState } from 'react'
import { CustomButton } from '@/components/index'
import { useForm } from 'react-hook-form'
import { useSupabase } from '@/context/SupabaseProvider'
import { RenterDropdownTypes, RenterTypes } from '@/types'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/shadcn'
import { CheckIcon } from 'lucide-react'

interface FilterTypes {
  setFilterRenter: (id: number | null) => void
  setFilterStatus: (status: string) => void
  setFilterDate: (date: string) => void
}

interface FilterForm {
  renter: number | null
  status: string
  date: string
}

const Filters = ({
  setFilterRenter,
  setFilterStatus,
  setFilterDate,
}: FilterTypes) => {
  const [renters, setRenters] = useState<RenterDropdownTypes[] | []>([])

  const form = useForm<FilterForm>({
    defaultValues: { date: 'Last 12 Months', status: 'All' },
  })
  const { renters: rentersData } = useSupabase()

  const onSubmit = async (data: FilterForm) => {
    setFilterRenter(data.renter)
    setFilterStatus(data.status)
    setFilterDate(data.date)
  }

  // clear all filters
  const handleClear = () => {
    form.reset()
    setFilterRenter(null)
    setFilterStatus('')
    setFilterDate('')
  }

  useEffect(() => {
    // Fetch renters from context api
    ;(async () => {
      const rentersArray: RenterDropdownTypes[] = []
      if (rentersData) {
        rentersData.forEach((item: RenterTypes) => {
          rentersArray.push({ label: item.name, value: item.id })
        })
      }
      setRenters(rentersArray)
    })()
  }, [])

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="items-center space-x-2 space-y-1">
            <div className="items-center inline-flex app__filter_field_container">
              <FormField
                control={form.control}
                name="renter"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start justify-start">
                    <FormLabel className="app__form_label">Renter</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'justify-between',
                              !field.value && 'text-muted-foreground'
                            )}>
                            {field.value
                              ? renters.find(
                                  (renter) => renter.value === field.value
                                )?.label
                              : 'Filter by Renter'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="h-[300px]">
                        <Command>
                          <CommandInput
                            placeholder="Search Renter..."
                            className="h-9"
                          />
                          <CommandEmpty>Name not found.</CommandEmpty>
                          <CommandGroup>
                            {renters.map((renter) => (
                              <CommandItem
                                value={renter.label}
                                key={renter.value}
                                onSelect={() => {
                                  form.setValue('renter', renter.value)
                                }}>
                                {renter.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    renter.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="items-center inline-flex app__filter_field_container">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="w-[240px] flex flex-col items-start justify-start">
                    <FormLabel className="app__form_label">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          {/* Workaround for reset issue: https://github.com/shadcn-ui/ui/issues/549#issuecomment-1693745585 */}
                          {field.value ? (
                            <SelectValue placeholder="Select Status" />
                          ) : (
                            'Select Status'
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem
                          value="Unpaid Overdue"
                          className="pl-10">
                          - Overdue
                        </SelectItem>
                        <SelectItem
                          value="Unpaid Not Due"
                          className="pl-10">
                          - Not Due
                        </SelectItem>
                        <SelectItem value="Partially Paid">
                          Partially Paid
                        </SelectItem>
                        <SelectItem
                          value="Partially Paid Overdue"
                          className="pl-10">
                          - Overdue
                        </SelectItem>
                        <SelectItem
                          value="Partially Paid Not Due"
                          className="pl-10">
                          - Not Due
                        </SelectItem>
                        <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="items-center inline-flex app__filter_field_container">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="w-[240px] flex flex-col items-start justify-start">
                    <FormLabel className="app__form_label">
                      Invoice Date
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          {/* Workaround for reset issue: https://github.com/shadcn-ui/ui/issues/549#issuecomment-1693745585 */}
                          {field.value ? (
                            <SelectValue placeholder="Select Invoice Date" />
                          ) : (
                            'Select Invoice Date'
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Today">Today</SelectItem>
                        <SelectItem value="This Week">This Week</SelectItem>
                        <SelectItem value="Last Week">Last Week</SelectItem>
                        <SelectItem value="This Month">This Month</SelectItem>
                        <SelectItem value="Last Month">Last Month</SelectItem>
                        <SelectItem value="Last 6 Months">
                          Last 6 Months
                        </SelectItem>
                        <SelectItem value="Last 12 Months">
                          Last 12 Months
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <CustomButton
              containerStyles="app__btn_green"
              title="Apply Filter"
              btnType="submit"
              handleClick={form.handleSubmit(onSubmit)}
            />
            <CustomButton
              containerStyles="app__btn_gray"
              title="Clear Filter"
              btnType="button"
              handleClick={handleClear}
            />
          </div>
        </form>
      </Form>
    </div>
  )
}

export default Filters
