import { AccountTypes, LocationTypes, RenterTypes, SectionTypes, StallTypes } from '@/types/index'
import { createBrowserClient } from '@supabase/ssr'
import { fullTextQuery } from './text-helper'

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function fetchAccounts (filters: { filterUser?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_users')
      .select('*', { count: 'exact' })
      .neq('email', 'berlcamp@gmail.com')
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterUser && filters.filterUser !== '') {
      query = query.eq('id', filters.filterUser)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: AccountTypes[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchLocations (filters: { filterKeyword?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_locations')
      .select('*,ceedo_sections(id,location_id,name,status)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`name.ilike.%${filters.filterKeyword}%`)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: LocationTypes[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchSections (filters: { filterKeyword?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_sections')
      .select('*, location:location_id(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`name.ilike.%${filters.filterKeyword}%`)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchStalls (filters: { filterSection?: number | null, filterRenter?: number | null, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_stalls')
      .select('*, renter:renter_id(name, status), section:section_id(name, location:location_id(name))', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)


    // Filter section
    if (filters.filterSection) {
      query = query.eq('section_id', filters.filterSection)
    }

    // Filter renter
    if (filters.filterRenter) {
      query = query.eq('renter_id', filters.filterRenter)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== 'All') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: StallTypes[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchNonRentables (filters: { filterSection?: number | null, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_nonrentables')
      .select('*, section:section_id(name, location:location_id(name))', { count: 'exact' })


    // Filter section
    if (filters.filterSection) {
      query = query.eq('section_id', filters.filterSection)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== 'All') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchRenters (filters: { filterSection?: number | null, filterRenter?: number | null, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_renters')
      .select('*, stall:stall_id(name, rent, rent_type, section:section_id(name, location:location_id(name)))', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Filter section
    if (filters.filterSection) {
      query = query.eq('section_id', filters.filterSection)
    }

    // Filter renter
    if (filters.filterRenter) {
      query = query.eq('id', filters.filterRenter)
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== 'All') {
      query = query.eq('status', filters.filterStatus)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchInvoices (filters: { filterRenter?: number | null, filterStatus?: string, filterDate?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('ceedo_invoices')
      .select('*, renter:renter_id(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Filter Renter
    if (filters.filterRenter) {
      query = query.eq('renter_id', filters.filterRenter)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}

export async function logError (transaction: string, table: string, data: string, error: string) {
  await supabase
    .from('error_logs')
    .insert({
      system: 'ceedo',
      transaction,
      table,
      data,
      error
    })
}

export async function logChanges (log: any, referenceColumn: string, referenceValue: string, userId: string) {
  const { error } = await supabase
    .from('ceedo_change_logs')
    .insert({
      log,
      user_id: userId,
      [referenceColumn]: referenceValue,
    })
  return { error: error }
}

export async function fetchErrorLogs (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}
