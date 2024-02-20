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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, CheckIcon } from 'lucide-react'
import { CustomButton } from '@/components/index'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import React, { useEffect, useState } from 'react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabase } from '@/context/SupabaseProvider'
import { InvoiceTypes, RenterDropdownTypes, RenterTypes } from '@/types'
import { generateRandomNumber } from '@/utils/text-helper'
// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useFilter } from '@/context/FilterContext'
import { logError } from '@/utils/fetchApi'

const FormSchema = z
  .object({
    type: z.string({
      required_error: 'Please select a Invoice Type.',
    }),
    renter_id: z.number({
      required_error: 'Renter is required.',
    }),
    invoice_date: z.date({
      required_error: 'Invoice Date is required.',
    }),
    due_date: z.date({
      required_error: 'Due Date is required.',
    }),
    amount: z.coerce // use coerce to cast to string to number https://stackoverflow.com/questions/76878664/react-hook-form-and-zod-inumber-input
      .number({
        required_error: 'Amount is required.',
        invalid_type_error: 'Amount is required',
      })
      .positive({
        message: 'Amount is required...',
      }),
    confirmed: z.literal(true, {
      errorMap: () => ({ message: 'Confirmation is required' }),
    }),
  })
  .refine((data) => data.due_date >= data.invoice_date, {
    message: 'Due date cannot be earlier than Invoice date.',
    path: ['due_date'],
  })

interface ModalProps {
  hideModal: () => void
  editData: InvoiceTypes | null
}

const SingleInvoice = ({ editData, hideModal }: ModalProps) => {
  const { supabase, renters: rentersData } = useSupabase()
  const { setToast } = useFilter()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const [renters, setRenters] = useState<RenterDropdownTypes[] | []>([])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      renter_id: editData ? editData.renter_id : undefined,
      amount: editData ? editData.amount : 0, // add zero to prevent error
      type: editData ? editData.type : undefined,
      invoice_date: editData ? new Date(editData.invoice_date) : undefined,
      due_date: editData ? new Date(editData.due_date) : undefined,
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
        renter_id: formdata.renter_id,
        invoice_date: formdata.invoice_date,
        due_date: formdata.due_date,
        invoice_number: generateRandomNumber(),
        type: formdata.type,
        amount: formdata.amount,
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      }

      const { data, error } = await supabase
        .from('ceedo_invoices')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create invoice',
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
      const updatedData = {
        ...newData,
        invoice_date: format(new Date(formdata.invoice_date), 'MMMM d, yyyy'), // convert to string on redux to prevent error
        due_date: format(new Date(formdata.due_date), 'MMMM d, yyyy'), // convert to string on redux to prevent error
        id: data[0].id,
        renter,
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Invoice Successfully Created.')

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
        renter_id: formdata.renter_id,
        invoice_date: formdata.invoice_date,
        due_date: formdata.due_date,
        type: formdata.type,
        amount: formdata.amount,
      }

      const { data, error } = await supabase
        .from('ceedo_invoices')
        .update(newData)
        .eq('id', editData?.id)

      if (error) {
        void logError(
          'Update invoice',
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
        invoice_date: format(new Date(formdata.invoice_date), 'MM/dd/yyyy'), // Serialize the dates first before storing to Redux
        due_date: format(new Date(formdata.due_date), 'MM/dd/yyyy'), // Serialize the dates first before storing to Redux
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
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Invoice Details</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              {renters.length === 0 && (
                <div className="text-gray-600 h-32 pb-8">
                  No Renters added yet,{' '}
                  <Link
                    className="text-blue-500"
                    href={'/renters'}>
                    create
                  </Link>{' '}
                  new Renter first.
                </div>
              )}
              {renters.length > 0 && (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6">
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
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="w-[240px]">
                          <FormLabel className="app__form_label">
                            Invoice Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Invoice Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Electricty Bill">
                                Electricty Bill
                              </SelectItem>
                              <SelectItem value="Monthly Rent">
                                Montlhy Rent
                              </SelectItem>
                              <SelectItem value="Occupancy Fee">
                                Occupancy Fee
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoice_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="app__form_label">
                            Invoice Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-[240px] pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}>
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date('1900-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="due_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="app__form_label">
                            Due Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-[240px] pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}>
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date('1900-01-01')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormDescription>
                      A surcharge will be imposed on the renter for payments
                      that are past due.
                    </FormDescription>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__form_label">
                            Amount
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Enter Amount"
                              className="w-[240px]"
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
                              By checking this, you acknowledge that the
                              provided details are accurate.
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SingleInvoice
