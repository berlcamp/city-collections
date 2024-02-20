'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/utils/shadcn'
import { Button } from '@/components/ui/button'
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
import { Calendar as CalendarIcon } from 'lucide-react'
import { CustomButton } from '@/components/index'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupabase } from '@/context/SupabaseProvider'
import { RenterTypes } from '@/types'
import { generateRandomNumber } from '@/utils/text-helper'
import { useFilter } from '@/context/FilterContext'

const FormSchema = z
  .object({
    invoice_type: z.string({
      required_error: 'Please select a Invoice Type.',
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
  renter: RenterTypes
}

const CreateInvoice = ({ renter, hideModal }: ModalProps) => {
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      // always have default values to avoid error https://stackoverflow.com/questions/77201810/shadcn-input-form-zod-a-component-is-changing-an-uncontrolled-input-to-be-c#
      amount: 0,
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    await handleCreate(data)
  }

  const handleCreate = async (formdata: z.infer<typeof FormSchema>) => {
    try {
      const newData = {
        renter_id: renter.id,
        invoice_date: formdata.invoice_date,
        due_date: formdata.due_date,
        invoice_number: generateRandomNumber(),
        type: formdata.invoice_type,
        amount: formdata.amount,
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      }

      const { data, error } = await supabase
        .from('ceedo_invoices')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      // pop up the success message
      setToast('success', 'Invoice Successfully Created.')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

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
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <div className="font-light">
                    <div className="font-bold text-gray-800">
                      Invoice For{' '}
                      <span className="text-blue-600">{renter.name}</span>
                    </div>
                  </div>
                  <hr />
                  <FormField
                    control={form.control}
                    name="invoice_type"
                    render={({ field }) => (
                      <FormItem className="w-[240px] ">
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
                              disabled={(date) => date < new Date('1900-01-01')}
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
                              disabled={(date) => date < new Date('1900-01-01')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDescription>
                    A surcharge will be imposed on the renter for payments that
                    are past due.
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

export default CreateInvoice
