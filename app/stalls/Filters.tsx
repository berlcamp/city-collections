import React, { useState } from "react";
import { MagnifyingGlassIcon, TagIcon } from "@heroicons/react/20/solid";
import { CustomButton } from "@/components/index";

interface FilterTypes {
  setFilterStatus: (type: string) => void;
  setFilterKeyword: (id: string) => void;
}

const Filters = ({ setFilterKeyword, setFilterStatus }: FilterTypes) => {
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");

  const handleApply = () => {
    if (status === "" && keyword === "") return;

    // pass filter values to parent
    setFilterStatus(status);
    setFilterKeyword(keyword);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === "" && keyword === "") return;

    // pass filter values to parent
    setFilterStatus(status);
    setFilterKeyword(keyword);
  };

  // clear all filters
  const handleClear = () => {
    setFilterStatus("");
    setStatus("");
    setFilterKeyword("");
    setKeyword("");
  };

  return (
    <div className="">
      <div className="items-center space-x-2 space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center inline-flex app__filter_field_container"
        >
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
              <input
                placeholder="Search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="app__filter_input"
              />
            </div>
            <div className="app__filter_container">
              <TagIcon className="w-4 h-4 mr-1" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Status: All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div className="flex items-center space-x-2 mt-4">
        <CustomButton
          containerStyles="app__btn_green"
          title="Apply Filter"
          btnType="button"
          handleClick={handleApply}
        />
        <CustomButton
          containerStyles="app__btn_gray"
          title="Clear Filter"
          btnType="button"
          handleClick={handleClear}
        />
      </div>
    </div>
  );
};

export default Filters;
