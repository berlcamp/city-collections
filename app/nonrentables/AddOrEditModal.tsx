'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { CustomButton } from '@/components/index'
import { Input } from '@/components/ui/input'
import React, { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  LocationDropdownTypes,
  LocationTypes,
  SectionDropdownTypes,
  SectionTypes,
  NonRentableTypes,
} from '@/types'
// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useFilter } from '@/context/FilterContext'
import { fetchLocations, logError } from '@/utils/fetchApi'

const FormSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required.',
    })
    .min(2, { message: 'Name is required.' }),
  section_id: z.string({
    required_error: 'Section is required.',
  }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface ModalProps {
  hideModal: () => void
  editData: NonRentableTypes | null
  refetchData: () => void
}

const AddOrEditModal = ({ editData, refetchData, hideModal }: ModalProps) => {
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const [locations, setLocations] = useState<LocationDropdownTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: editData ? editData.name : '',
      section_id: editData ? editData.section_id.toString() : undefined,
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
        section_id: formdata.section_id,
        status: 'Active',
      }

      const { data, error } = await supabase
        .from('ceedo_nonrentables')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create Nonrentables',
          'ceedo_nonrentables',
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
      const updatedData = {
        ...newData,
        id: data[0].id,
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully Created.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      )

      // Refetch the page
      refetchData()

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
        section_id: formdata.section_id,
      }

      const { data, error } = await supabase
        .from('ceedo_nonrentables')
        .update(newData)
        .eq('id', editData?.id)

      if (error) {
        void logError(
          'Update Nonrentables',
          'ceedo_nonrentables',
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
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id,
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully Updated.')

      // Refetch the page
      refetchData()

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
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
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Non-Rentable Product/Services Details
              </h5>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="app__form_label">Name</FormLabel>
                        <FormControl className="w-[340px]">
                          <Input
                            placeholder="E.g. Delivery Fee, Parking Fee..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
