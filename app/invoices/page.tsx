/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { fetchInvoices } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  Sidebar,
  PerPage,
  TopBar,
  TableRowLoading,
  ShowMore,
  Title,
  Unauthorized,
  CustomButton,
  MainSideBar,
  LogsModal,
} from '@/components/index'
import { superAdmins } from '@/constants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
// Types
import type { InvoiceTypes } from '@/types/index'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import {
  ChevronDownIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/20/solid'
import GenerateInvoice from './GenerateInvoice'
import SingleInvoice from './SingleInvoice'
import { format } from 'date-fns'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [reFetch, setReFetch] = useState(false)
  const [list, setList] = useState<InvoiceTypes[]>([])

  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] =
    useState(false)
  const [showSingleInvoiceModal, setShowSingleInvoiceModal] = useState(false)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editData, setEditData] = useState<InvoiceTypes | null>(null)

  // Filters
  const [filterRenter, setFilterRenter] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // change logs modal
  const [showLogsModal, setShowLogsModal] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchInvoices(
        { filterRenter, filterStatus, filterDate },
        perPageCount,
        0
      )

      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0,
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchInvoices(
        { filterRenter, filterStatus, filterDate },
        perPageCount,
        list.length
      )

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0,
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    setShowSingleInvoiceModal(true)
    setEditData(null)
  }

  const handleEdit = (item: InvoiceTypes) => {
    setShowSingleInvoiceModal(true)
    setEditData(item)
  }

  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Fetch data
  useEffect(() => {
    setList([])
    void fetchData()
  }, [filterRenter, filterDate, perPageCount, filterStatus, reFetch])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('collections') && !superAdmins.includes(session.user.email))
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Invoices" />
            <CustomButton
              containerStyles="app__btn_green"
              title="Create Invoice"
              btnType="button"
              handleClick={handleAdd}
            />
            <CustomButton
              containerStyles="app__btn_blue"
              title="Monthly Rent Invoice Generator"
              btnType="button"
              handleClick={() => setShowGenerateInvoiceModal(true)}
            />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterStatus={setFilterStatus}
              setFilterRenter={setFilterRenter}
              setFilterDate={setFilterDate}
            />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4"></th>
                  <th className="app__th">Invoice Type/No.</th>
                  <th className="hidden md:table-cell app__th">Renter</th>
                  <th className="hidden md:table-cell app__th">Invoice Date</th>
                  <th className="hidden md:table-cell app__th">Due Date</th>
                  <th className="hidden md:table-cell app__th">Amount</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: InvoiceTypes, index) => (
                    <tr
                      key={index}
                      className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        <Menu
                          as="div"
                          className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDownIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="app__dropdown_items">
                              <div className="py-1">
                                <Menu.Item>
                                  <div
                                    onClick={() => handleEdit(item)}
                                    className="app__dropdown_item">
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Edit Details</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                    onClick={() => {
                                      setShowLogsModal(true)
                                      setSelectedId(item.id)
                                    }}
                                    className="app__dropdown_item">
                                    <EyeIcon className="w-4 h-4" />
                                    <span>View Change Logs</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div>{item.type}</div>
                        <div className="font-light">{item.invoice_number}</div>
                        {/* Mobile View */}
                        <div className="md:hidden app__td_mobile">
                          <div>
                            <span className="app_td_mobile_label">Renter:</span>{' '}
                            {item.renter?.name}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Invoice Date:
                            </span>{' '}
                            {format(
                              new Date(item.invoice_date),
                              'MMMM d, yyyy'
                            )}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Due Date:
                            </span>{' '}
                            {format(new Date(item.due_date), 'MMMM d, yyyy')}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">Amount:</span>{' '}
                            {item.amount}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        {item.renter?.name}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {format(new Date(item.invoice_date), 'MMMM d, yyyy')}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {format(new Date(item.due_date), 'MMMM d, yyyy')}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                {loading && (
                  <TableRowLoading
                    cols={6}
                    rows={3}
                  />
                )}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>
      {/* Generate Invoice Modal */}
      {showGenerateInvoiceModal && (
        <GenerateInvoice
          refetchData={() => setReFetch(!reFetch)}
          hideModal={() => setShowGenerateInvoiceModal(false)}
        />
      )}
      {/* Single Invoice Modal */}
      {showSingleInvoiceModal && (
        <SingleInvoice
          editData={editData}
          hideModal={() => setShowSingleInvoiceModal(false)}
        />
      )}
      {/* Logs Modal */}
      {showLogsModal && selectedId && (
        <LogsModal
          refCol="renter_id"
          refValue={selectedId}
          onClose={() => {
            setShowLogsModal(false)
            setSelectedId(null)
          }}
        />
      )}
    </>
  )
}
export default Page
