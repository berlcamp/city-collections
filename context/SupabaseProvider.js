'use client'

import { createContext, useContext, useState } from 'react'
import { createBrowserClient } from '../utils/supabase-browser'

const Context = createContext()

export default function SupabaseProvider ({ children, session, systemAccess, systemUsers, renters }) {
  const [supabase] = useState(() => createBrowserClient())

  return (
    <Context.Provider value={{ supabase, session, systemAccess, systemUsers, renters }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = () => useContext(Context)
