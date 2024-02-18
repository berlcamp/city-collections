import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFilter } from "@/context/FilterContext";
import { CustomButton, OneColLayoutLoading } from "@/components/index";

// Types
import type { RenterTypes } from "@/types/index";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { useSupabase } from "@/context/SupabaseProvider";
import { nanoid } from "nanoid";
import { handleLogChanges } from "@/utils/text-helper";

interface ModalProps {
  hideModal: () => void;
  editData: RenterTypes | null;
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase, session } = useSupabase();
  const [saving, setSaving] = useState(false);

  const [stallId, setStallId] = useState("");
  const [stalls, setStalls] = useState<RenterTypes[] | []>([]);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<RenterTypes>({
    mode: "onSubmit",
  });

  const onSubmit = async (formdata: RenterTypes) => {
    if (saving) return;

    setSaving(true);

    if (editData) {
      void handleUpdate(formdata);
    } else {
      void handleCreate(formdata);
    }
  };

  const handleCreate = async (formdata: RenterTypes) => {
    try {
      const newData = {
        name: formdata.name,
        stall_id: formdata.stall_id,
        status: "Active",
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      };

      const { data, error } = await supabase
        .from("ceedo_stalls")
        .insert(newData)
        .select();

      if (error) throw new Error(error.message);

      // Append new data in redux
      const updatedData = {
        ...newData,
        id: data[0].id,
      };
      dispatch(updateList([updatedData, ...globallist]));

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      );

      setSaving(false);

      // hide the modal
      hideModal();

      // reset all form fields
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (formdata: RenterTypes) => {
    if (!editData) return;

    const newData = {
      name: formdata.name,
    };

    try {
      const { error } = await supabase
        .from("ceedo_stalls")
        .update(newData)
        .eq("id", editData.id);

      if (error) throw new Error(error.message);

      // Log changes
      handleLogChanges(
        { name: formdata.name },
        editData,
        "renter_id",
        editData.id,
        session.user.id
      );

      // Update data in redux
      const items = [...globallist];
      const updatedData = {
        ...newData,
        id: editData.id,
      };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));

      // pop up the success message
      setToast("success", "Successfully saved.");

      setSaving(false);

      // hide the modal
      hideModal();

      // reset all form fields
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : "",
      stall_id: editData ? editData.stall_id : "",
    });
  }, [editData, reset]);

  useEffect(() => {
    const fetchStallsData = async () => {
      const { data } = await supabase
        .from("ceedo_stalls")
        .select("*, section:section_id(name, location:location_id(name))")
        .is("renter_id", null);

      setStalls(data);
    };

    void fetchStallsData();
  }, []);

  const tempPassword = Math.floor(Math.random() * 8999) + 1000;

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Renter Details</h5>
              <button
                disabled={saving}
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              {!saving ? (
                <>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Renter Name</div>
                      <div>
                        <input
                          {...register("name", { required: true })}
                          type="text"
                          className="app__select_standard"
                        />
                        {errors.name && (
                          <div className="app__error_message">
                            Renter Name is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Stall:</div>
                      {!editData ? (
                        <div>
                          <select
                            {...register("stall_id", { required: true })}
                            value={stallId}
                            onChange={(e) => setStallId(e.target.value)}
                            className="app__select_standard"
                          >
                            <option value="">Choose Stall</option>
                            {stalls?.map((item) => (
                              <option key={nanoid()} value={item.id}>
                                {item.id} / {item.name} / {item.section.name} /{" "}
                                {item.section.location.name}
                              </option>
                            ))}
                          </select>
                          {errors.section_id && (
                            <div className="app__error_message">
                              Stall is required
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="app__label_value">
                          {editData.stall?.name} /{" "}
                          {editData.stall?.section?.name} /{" "}
                          {editData.stall?.section?.location?.name}
                        </div>
                      )}
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
                  title={saving ? "Saving..." : "Submit"}
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
  );
};

export default AddEditModal;
