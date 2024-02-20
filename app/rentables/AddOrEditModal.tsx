'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/utils/shadcn'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
  FormDescription,
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
import { CustomButton } from '@/components/index'
import { Input } from '@/components/ui/input'
import React, { useEffect, useState } from 'react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  LocationDropdownTypes,
  LocationTypes,
  RenterDropdownTypes,
  RenterTypes,
  SectionDropdownTypes,
  SectionTypes,
  StallTypes,
} from '@/types'
// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useFilter } from '@/context/FilterContext'
import { fetchLocations, logError } from '@/utils/fetchApi'
import { CheckIcon } from 'lucide-react'
import { nanoid } from 'nanoid'

const FormSchema = z.object({
  name: z.string({
    required_error: 'Name is required.',
  }),
  renter_id: z.number().optional(),
  section_id: z.number({
    required_error: 'Section is required.',
    invalid_type_error: 'Section is required..',
  }),
  rent_type: z.string({
    required_error: 'Rent Type is required.',
  }),
  rent: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
    .number({
      required_error: 'Rent Amount is required.',
      invalid_type_error: 'Rent Amount is required..',
    })
    .positive({
      message: 'Rent Amount is required...',
    }),
  occupancy_renewal_period: z.string({
    required_error: 'Occupancy Renewal Period is required.',
  }),
  occupancy_fee: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
    .number({
      required_error: 'Occupancy Fee is required.',
    })
    .positive({
      message: 'Occupancy Fee is required...',
    }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface ModalProps {
  hideModal: () => void
  editData: StallTypes | null
}

const AddOrEditModal = ({ editData, hideModal }: ModalProps) => {
  const { supabase, renters: rentersData } = useSupabase()
  const { setToast } = useFilter()

  const [locations, setLocations] = useState<LocationDropdownTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const [renters, setRenters] = useState<RenterDropdownTypes[] | []>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: editData ? editData.name : undefined,
      renter_id: editData ? editData.renter_id : undefined,
      section_id: editData ? editData.section_id : undefined,
      rent: editData ? editData.rent : 0, // add zero to prevent error
      rent_type: editData ? editData.rent_type : undefined,
      occupancy_fee: editData ? editData.occupancy_fee : undefined,
      occupancy_renewal_period: editData
        ? editData.occupancy_renewal_period
        : undefined,
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (editData) {
      await handleUpdate(data)
    } else {
      await handleCreate(data)
    }
  }

  const handleCreate = async (formdata: z.infer<typeof FormSchema>) => {
    try {
      const newData = {
        name: formdata.name,
        renter_id: formdata.renter_id,
        section_id: formdata.section_id,
        rent: formdata.rent,
        rent_type: formdata.rent_type,
        occupancy_fee: formdata.occupancy_fee,
        occupancy_renewal_period: formdata.occupancy_renewal_period,
        status: 'Active',
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      }

      const { data, error } = await supabase
        .from('ceedo_stalls')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create stalls',
          'ceedo_stalls',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Append new data in redux
      const renter = rentersData.find((r: any) => r.id === formdata.renter_id)
      const updatedData = {
        ...newData,
        id: data[0].id,
        renter,
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Rentable Successfully Created.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      )

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: z.infer<typeof FormSchema>) => {
    if (!editData) return

    try {
      const newData = {
        name: formdata.name,
        renter_id: formdata.renter_id,
        section_id: formdata.section_id,
        rent: formdata.rent,
        rent_type: formdata.rent_type,
        occupancy_fee: formdata.occupancy_fee,
        occupancy_renewal_period: formdata.occupancy_renewal_period,
      }

      const { data, error } = await supabase
        .from('ceedo_stalls')
        .update(newData)
        .eq('id', editData?.id)

      if (error) {
        void logError(
          'Update stalls',
          'ceedo_invoices',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      // Append new data in redux
      const renter = rentersData.find((r: any) => r.id === formdata.renter_id)
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id,
        renter,
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Invoice Successfully Updated.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    // Fetch renters from context api
    ;(async () => {
      const rentersArray: any = []
      if (rentersData) {
        rentersData.forEach((item: RenterTypes) => {
          rentersArray.push({ label: item.name, value: item.id })
        })
      }
      setRenters(rentersArray)
    })()

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
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Rentable Details</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <FormField
                    control={form.control}
                    name="section_id"
                    render={({ field }) => (
                      <FormItem className="w-[340px] flex flex-col items-start justify-start">
                        <FormLabel className="app__form_label">
                          Section
                        </FormLabel>
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
                                <SelectLabel>
                                  {location.location_label}
                                </SelectLabel>
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
                  <FormField
                    control={form.control}
                    name="renter_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-start justify-start">
                        <FormLabel className="app__form_label">
                          Renter
                        </FormLabel>
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
                                  : 'Select Renter'}
                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          {field.value?.toString().trim() !== '' && (
                            <PopoverContent className="h-[200px]">
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
                                        form.setValue('renter_id', renter.value)
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
                          )}
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__form_label">
                          Rental Fee
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Enter Rental Fee"
                            className="w-[340px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rent_type"
                    render={({ field }) => (
                      <FormItem className="w-[340px]">
                        <FormLabel className="app__form_label">
                          Rent Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Rent Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDescription>
                    A surcharge will be imposed on the renter for payments that
                    are past due.
                  </FormDescription>
                  <hr />
                  <FormField
                    control={form.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-gray-600 text-xs">
                            By checking this, you acknowledge that the provided
                            details are accurate.
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="app__modal_footer">
                    <CustomButton
                      btnType="submit"
                      isDisabled={form.formState.isSubmitting}
                      title={
                        form.formState.isSubmitting ? 'Saving...' : 'Submit'
                      }
                      containerStyles="app__btn_green"
                    />
                    <CustomButton
                      btnType="button"
                      isDisabled={form.formState.isSubmitting}
                      title="Cancel"
                      handleClick={hideModal}
                      containerStyles="app__btn_gray"
                    />
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddOrEditModal
