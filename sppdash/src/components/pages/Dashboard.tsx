import React, { useState, useEffect } from "react";
import { useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import Select from "react-select";

const Dashboard: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [finalBatch, setFinalBatch] = useState<string>("");
  const [masterBatch, setMasterBatch] = useState<string>("");

  // Fetch items from ERPNext using useFrappeGetDocList
  const { data: itemsData, isLoading: isItemsLoading, error: itemsError } = useFrappeGetDocList("Item", {
    fields: ["name", "item_name", "item_group"],
    filters: [["item_group", "=", "Compound"]],
    limit: 500,
  });

  // Map itemsData to options for react-select
  const options = itemsData
    ? itemsData.map((item: { name: string; item_name: string }) => ({
        value: item.name,
        label: `${item.item_name} (${item.name})`,
      }))
    : [];

  // Fetch BOM details for the selected item
  const { data: bomData, isLoading: isBOMLoading, error: bomError, mutate } = useFrappeGetCall(
    "spp.api.get_bom_details_by_item_code",
    {
      params: { item_code: selectedItem },
    }
  );

  const handleFetchDetails = () => {
    if (!selectedItem) {
      alert("Please select an item.");
      return;
    }
    mutate({
      params: { item_code: selectedItem },
    });
  };
console.log(bomData)
  // Extract rm_compound from bomData
  const rm_compound = bomData?.message?.items || [];

  // Update finalBatch and masterBatch based on rm_compound
  useEffect(() => {
    rm_compound.forEach((item: { item_code: string; item_name: string }) => {
      if (item.item_code.includes("FB")) {
        setFinalBatch(item.item_name);
      } else if (item.item_code.includes("MB")) {
        setMasterBatch(item.item_name);
      }
    });
  }, [rm_compound]);

  return (
    <div>
      <div className="flex w-full">
        <div className="flex-1 border border-gray-300 p-2">
          <label htmlFor="compound-item-select" className="block text-sm font-medium text-gray-700">
            Compound Item
          </label>
          <div className="mt-1">
            <Select
              id="compound-item-select"
              options={options}
              isLoading={isItemsLoading}
              isClearable
              placeholder={isItemsLoading ? "Loading..." : "Search and select an item"}
              onChange={(selectedOption) => setSelectedItem(selectedOption?.value || null)}
              className="react-select-container"
              classNamePrefix="react-select"
            />
            {itemsError && <p className="text-sm text-red-500 mt-2">Error loading items: {itemsError.message}</p>}
          </div>
          <button
            type="button"
            onClick={handleFetchDetails}
            className="mt-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isBOMLoading ? "Fetching..." : "Fetch Details"}
          </button>
          {bomError && <p className="text-sm text-red-500 mt-2">Error fetching BOM: {bomError.message}</p>}
  
        </div>
        <div className="flex-1 border border-gray-300 p-2">coloum 2</div>
      </div>
      <div className="flex w-full mt-4">
        <div className="flex-1 border border-gray-300 p-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="final-batch" className="text-sm font-medium text-gray-700">
                Final Batch
              </label>
              <input
                type="text"
                id="final-batch"
                value={finalBatch}
                readOnly
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="final-batch-ref" className="text-sm font-medium text-gray-700">
                BOM Ref
              </label>
              <input
                type="text"
                id="final-batch-ref"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="final-batch-update" className="text-sm font-medium text-gray-700">
                Update
              </label>
              <input type="checkbox" id="final-batch-update" />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="master-batch" className="text-sm font-medium text-gray-700">
                Master Batch
              </label>
              <input
                type="text"
                id="master-batch"
                value={masterBatch}
                readOnly
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="master-batch-ref" className="text-sm font-medium text-gray-700">
                BOM Ref
              </label>
              <input
                type="text"
                id="master-batch-ref"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="master-batch-update" className="text-sm font-medium text-gray-700">
                Update
              </label>
              <input type="checkbox" id="master-batch-update" />
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="final-batch" className="text-sm font-medium text-gray-700">
                 Batch
              </label>
              <input
                type="text"
                id="final-batch"
                
                readOnly
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="final-batch-ref" className="text-sm font-medium text-gray-700">
                BOM Ref
              </label>
              <input
                type="text"
                id="final-batch-ref"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <label htmlFor="final-batch-update" className="text-sm font-medium text-gray-700">
                Update
              </label>
              <input type="checkbox" id="final-batch-update" />
            </div>
          </div>
        </div>
        
      </div>
      <div className="flex w-full mt-4">
        <div className="flex-1 border border-gray-300 p-2">
          <div className="space-y-2">

            Test
            </div>
            
        </div>
        
      </div>
      <div className="flex w-full mt-4">
        <div className="flex-1 border border-gray-300 p-2">
          <div className="space-y-2">

            Test
            </div>
            
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;