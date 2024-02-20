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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomButton } from '@/components/index'
import { differenceInDays, format } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { StallTypes } from '@/types'
import { generateRandomNumber } from '@/utils/text-helper'
import { logError } from '@/utils/fetchApi'

const FormSchema = z.object({
  period: z.string({
    required_error: 'Please select a Invoice Period.',
  }),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Confirmation is required' }),
  }),
})

interface ModalProps {
  hideModal: () => void
  refetchData: () => void
}

interface MonthYearOption {
  value: string
  label: string
}

const GenerateInvoice = ({ refetchData, hideModal }: ModalProps) => {
  const [periodOptions, setPeriodOptions] = useState<MonthYearOption[]>([])

  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    await handleGenerate(data)
  }

  const handleGenerate = async (formdata: z.infer<typeof FormSchema>) => {
    const [selectedMonth, selectedYear] = formdata.period.split('/')
    const firstDate = new Date(
      Number(selectedYear),
      Number(selectedMonth) - 1,
      1
    )
    const lastDate = new Date(Number(selectedYear), Number(selectedMonth), 0)

    try {
      const { data: generated } = await supabase
        .from('ceedo_generated_invoices')
        .select()
        .eq('period', formdata.period)
        .limit(1)
        .maybeSingle()

      if (generated) {
        form.setError('root', {
          message: 'Invoice already generated for this month',
        })
        return
      }

      const { data: stalls } = await supabase
        .from('ceedo_stalls')
        .select('*, renter:renter_id(id,status)')
        .eq('status', 'Active')
        .order('id', { ascending: true })
      if (!stalls) {
        form.setError('root', {
          message: 'No rentable stalls found',
        })
        return
      }

      const insertArray: any = []
      stalls.forEach((stall: StallTypes) => {
        if (stall.renter?.status === 'Active') {
          // Calculate the amount based on rent and type of rent
          const totalDays = differenceInDays(lastDate, firstDate) + 1
          let rentAmount = 0
          if (stall.rent_type === 'Daily') {
            rentAmount = Number(stall.rent) * totalDays
          } else {
            rentAmount = Number(stall.rent)
          }

          insertArray.push({
            renter_id: stall.renter_id,
            type: 'Monthly Rent',
            invoice_date: format(new Date(firstDate), 'MM/dd/yyyy'),
            due_date: format(new Date(lastDate), 'MM/dd/yyyy'),
            invoice_number: generateRandomNumber(),
            amount: rentAmount,
            org_id: process.env.NEXT_PUBLIC_ORG_ID,
            created_by: session.user.id,
            generated: true,
          })
        }
      })

      const { error } = await supabase
        .from('ceedo_invoices')
        .insert(insertArray)

      if (error) {
        void logError('Generate invoices', 'ceedo_invoices', '', error.message)
        setToast(
          'error',
          'Saving failed, please reload the page or contact Berl.'
        )
        throw new Error(error.message)
      }

      await supabase.from('ceedo_generated_invoices').insert({
        period: formdata.period,
        generated_by: session.user.id,
      })

      // Reload page data
      refetchData()

      setToast('success', 'Invoices generated successfully')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const generateMonthYearOptions = () => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const newOptions: MonthYearOption[] = []

      // Generate options for the current month and the next 12 months
      for (let i = 0; i < 2; i++) {
        const date = new Date(currentYear, currentMonth + i)
        const option: MonthYearOption = {
          value: `${date.getMonth() + 1}/${date.getFullYear()}`,
          label: `${date.toLocaleString('default', {
            month: 'long',
          })} ${date.getFullYear()}`,
        }
        newOptions.push(option)
      }

      setPeriodOptions(newOptions)
    }

    // Call the function to generate options
    generateMonthYearOptions()
  }, []) // Run only once on component mount

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Invoice Generator</h5>
              <button
                onClick={hideModal}
                disabled={form.formState.isSubmitting}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="app__modal_body space-y-6">
                <div className="font-light">
                  <div className="font-bold text-gray-800">
                    Monthly Rent Invoice Generator
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    This will automatically generate monthly rent invoices for
                    <span className="font-bold"> ALL</span> currently active
                    renters. Invoice Amount will based on the rental fee of the
                    Stall rented.
                  </div>
                  <div className="mt-2 text-xs text-gray-600 border bg-green-100 font-medium p-2">
                    To exclude a renter from auto-generated invoice, you need to
                    deactivate the renters account under &quot;Renters&quot;
                    menu.
                  </div>
                </div>
                <hr />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem className="w-[240px] ">
                      <FormLabel className="app__form_label">
                        Invoice Period
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Invoice Period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <div className="app__error_message">
                    {form.formState.errors.root.message}
                  </div>
                )}
                <div className="text-xs text-gray-600">
                  The Invoice Date will be first day of the month and the Due
                  Date will be the last day of the month.
                </div>
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
                          details are accurate and authorize the generation of
                          invoices.
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
                      form.formState.isSubmitting
                        ? 'Creating invoices...'
                        : 'Generate Invoice'
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
    </>
  )
}

export default GenerateInvoice
