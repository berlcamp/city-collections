import 'server-only'
import './globals.css'
import SupabaseListener from '@/utils/supabase-listener'
import SupabaseProvider from '@/context/SupabaseProvider'
import { createServerClient } from '@/utils/supabase-server'
import { FilterProvider } from '@/context/FilterContext'
import { Providers } from '@/GlobalRedux/provider'
import { Toaster } from 'react-hot-toast'

import type { Metadata } from 'next'
import type { AccountTypes, RenterTypes, UserAccessTypes } from '@/types/index'
import { logError } from '@/utils/fetchApi'
import LandingPage from '@/components/LandingPage'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'City Collections',
  description: 'By BTC',
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  let sysUsers: AccountTypes[] | null = []
  let sysAccess: UserAccessTypes[] | null = []
  let renters: RenterTypes[] | null = []

  if (session) {
    try {
      const { data: systemAccess, error } = await supabase
        .from('ceedo_system_access')
        .select()
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        void logError(
          'root layout system access',
          'ceedo_system_access',
          '',
          error.message
        )
        throw new Error(error.message)
      }

      const { data: systemUsers, error: error2 } = await supabase
        .from('ceedo_users')
        .select()
        .eq('status', 'Active')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error2) {
        void logError(
          'root layout ceedo_users',
          'ceedo_users',
          '',
          error2.message
        )
        throw new Error(error2.message)
      }

      const { data: rentersData, error: error3 } = await supabase
        .from('ceedo_renters')
        .select()
        .eq('status', 'Active')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error3) {
        void logError(
          'root layout ceedo_renters',
          'ceedo_renters',
          '',
          error3.message
        )
        throw new Error(error3.message)
      }

      sysAccess = systemAccess
      sysUsers = systemUsers
      renters = rentersData
    } catch (err) {
      console.log(err)
      return 'Something went wrong, please contact the system administrator.'
    }
  }

  return (
    <html lang="en">
      <body
        className={`${inter.className} relative ${
          session ? 'bg-white' : 'bg-gray-100'
        }`}>
        <SupabaseProvider
          systemAccess={sysAccess}
          session={session}
          systemUsers={sysUsers}
          renters={renters}>
          <SupabaseListener serverAccessToken={session?.access_token} />
          {!session && <LandingPage />}
          {session && (
            <Providers>
              <FilterProvider>
                <Toaster />
                {children}
              </FilterProvider>
            </Providers>
          )}
        </SupabaseProvider>
      </body>
    </html>
  )
}
