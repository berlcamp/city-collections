import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { CustomButton, OneColLayoutLoading } from '@/components/index'

// Types
import { LocationTypes, type SectionTypes } from '@/types/index'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchLocations } from '@/utils/fetchApi'
import { nanoid } from 'nanoid'

interface ModalProps {
  hideModal: () => void
  editData: SectionTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [locationId, setLocationId] = useState('')
  const [locations, setLocations] = useState<LocationTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<SectionTypes>({
    mode: 'onSubmit',
  })

  const onSubmit = async (formdata: SectionTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: SectionTypes) => {
    try {
      const newData = {
        name: formdata.name,
        location_id: formdata.location_id,
        status: 'Active',
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      }

      const { data, error } = await supabase
        .from('ceedo_sections')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      // Append new data in redux
      const updatedData = {
        ...newData,
        id: data[0].id,
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      )

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: SectionTypes) => {
    if (!editData) return

    const newData = {
      name: formdata.name,
      location_id: formdata.location_id,
    }

    try {
      const { error } = await supabase
        .from('ceedo_sections')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id,
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      location_id: editData ? editData.location_id : '',
    })

    // Reset dynamic dropdowns
    setLocationId(
      editData ? (editData.location_id ? editData.location_id : '') : ''
    )
  }, [editData, reset])

  useEffect(() => {
    const fetchLocationsData = async () => {
      const result = await fetchLocations({}, 300, 0)
      setLocations(result.data.length > 0 ? result.data : [])
    }

    void fetchLocationsData()
  }, [])

  const tempPassword = Math.floor(Math.random() * 8999) + 1000

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Section Details</h5>
              <button
                disabled={saving}
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn">
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="app__modal_body">
              {!saving ? (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Section Name</div>
                      <div>
                        <input
                          {...register('name', { required: true })}
                          type="text"
                          className="app__select_standard"
                        />
                        {errors.name && (
                          <div className="app__error_message">
                            Section Name is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Location:</div>
                      <div>
                        <select
                          {...register('location_id', { required: true })}
                          value={locationId}
                          onChange={(e) => setLocationId(e.target.value)}
                          className="app__select_standard">
                          <option value="">Choose Location</option>
                          {locations?.map((item) => (
                            <option
                              key={nanoid()}
                              value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {errors.location_id && (
                          <div className="app__error_message">
                            Location is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <OneColLayoutLoading />
              )}
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Submit'}
                  containerStyles="app__btn_green"
                />
                <CustomButton
                  btnType="button"
                  isDisabled={saving}
                  title="Cancel"
                  handleClick={hideModal}
                  containerStyles="app__btn_gray"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
