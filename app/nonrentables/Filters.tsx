import React, { useEffect, useState } from 'react'
import { CustomButton } from '@/components/index'
import { useForm } from 'react-hook-form'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  LocationDropdownTypes,
  LocationTypes,
  RenterDropdownTypes,
  RenterTypes,
  SectionDropdownTypes,
  SectionTypes,
} from '@/types'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { fetchLocations } from '@/utils/fetchApi'

interface FilterTypes {
  setFilterSection: (id: number | null) => void
  setFilterStatus: (status: string) => void
}

interface FilterForm {
  renter: number | null
  status: string
  section_id: number | null
  date: string
}

const Filters = ({ setFilterSection, setFilterStatus }: FilterTypes) => {
  const [locations, setLocations] = useState<LocationDropdownTypes[] | []>([])

  const form = useForm<FilterForm>({
    defaultValues: { status: 'All' },
  })
  const { renters: rentersData } = useSupabase()

  const onSubmit = async (data: FilterForm) => {
    setFilterSection(data.section_id)
    setFilterStatus(data.status)
  }

  // clear all filters
  const handleClear = () => {
    form.reset()
    setFilterSection(null)
    setFilterStatus('')
  }

  useEffect(() => {
    // Fetch Sections
    ;(async () => {
      const result: any = await fetchLocations({}, 300, 0)
      const locationsArray: any = []
      if (result.data.length > 0) {
        // Loop all locations
        result.data.forEach((location: LocationTypes) => {
          if (location.ceedo_sections.length > 0) {
            const sectionsArray: SectionDropdownTypes[] = []
            // Loop all sections of location
            location.ceedo_sections.forEach((section: SectionTypes) => {
              if (section.status === 'Active') {
                sectionsArray.push({
                  label: section.name,
                  value: section.id,
                })
              }
            })

            // Add to location array in order to display to Select Group Dropdown
            locationsArray.push({
              location_label: location.name,
              sections: sectionsArray,
            })
          }
        })
        setLocations(locationsArray)
      }
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
                name="section_id"
                render={({ field }) => (
                  <FormItem className="w-[340px] flex flex-col items-start justify-start">
                    <FormLabel className="app__form_label">Section</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          {/* Workaround for reset issue: https://github.com/shadcn-ui/ui/issues/549#issuecomment-1693745585 */}
                          {field.value ? (
                            <SelectValue placeholder="Select Section" />
                          ) : (
                            'Select Section'
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location, i) => (
                          <SelectGroup key={i}>
                            <SelectLabel>{location.location_label}</SelectLabel>
                            {location.sections.map((section, j) => (
                              <SelectItem
                                key={j}
                                value={section.value.toString()}
                                className="pl-8">
                                {section.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
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
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
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
