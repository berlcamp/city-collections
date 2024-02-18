import type { ReactNode, MouseEventHandler } from 'react'

export interface SelectUserNamesProps {
  settingsData: any[]
  multiple: boolean
  type: string
  handleManagerChange: (newdata: any[], type: string) => void
  title: string
}

export interface UserAccessTypes {
  user_id: string
  type: string
  ceedo_user: namesType
}

export interface searchUser {
  firstname: string
  middlename: string
  lastname: string
  uuid?: string
  id: string
}

export interface namesType {
  firstname: string
  middlename: string
  lastname: string
  avatar_url: string
  id: string
}

export interface CustomButtonTypes {
  isDisabled?: boolean
  btnType?: 'button' | 'submit'
  containerStyles?: string
  textStyles?: string
  title: string
  rightIcon?: ReactNode
  handleClick?: MouseEventHandler<HTMLButtonElement>
}

export interface NotificationTypes {
  id: string
  message: string
  created_at: string
  url: string
  type: string
  user_id: string
  reference_id?: string
  reference_table: string
  is_read: boolean
}

export interface AccountTypes {
  id: string
  name: string
  firstname: string
  middlename: string
  lastname: string
  status: string
  password: string
  avatar_url: string
  email: string
  org_id: string
  created_by: string
  ceedo_users: AccountTypes
  temp_password: string
  department_id: string
}

export interface LocationTypes {
  id: string
  name: string
  status: string
}

export interface SectionTypes {
  id: string
  location_id: string
  name: string
  status: string
  location: LocationTypes
}

export interface StallTypes {
  id: string
  location_id: string
  section_id: string
  renter_id: string
  name: string
  status: string
  rent: string
  rent_type: string
  occupancy_fee: string
  occupancy_renewal_period: string
  section: SectionTypes
  renter: RenterTypes
}

export interface RenterTypes {
  id: string
  section_id: string
  stall_id: string
  name: string
  status: string
  section: SectionTypes
  stall: StallTypes
}

export interface excludedItemsTypes {
  id: string
}

export interface LogsTypes {
  id: string
  created_at: string
  log: any
  user: AccountTypes
}

export interface LogMessageTypes {
  field: string
  old_value: string
  new_value: string
}
