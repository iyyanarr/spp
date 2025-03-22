import React, { useState, useEffect, useCallback } from "react";
import { useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FinalBatchBOMDetailsView, 
  MasterBatchBOMDetailsView, 
  BatchBOMDetailsView 
} from "@/components/BOMDetailsViews";

interface Item {
  name: string;
  item_name: string;
  item_group: string;
}

interface BOM {
  name: string;
  item: string;
  item_name: string;
  is_active: boolean;
  is_default: boolean;
}

interface BOMDetails {
  name: string;
  company: string;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
}

const UpdateBOM: React.FC = () => {
  // Component state
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBOM, setSelectedBOM] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [bomDetails, setBomDetails] = useState<BOMDetails | null>(null);
  const [bomDetailsError, setBomDetailsError] = useState<string | null>(null);

  // New state for selected batch items and their BOMs
  const [selectedFinalBatch, setSelectedFinalBatch] = useState<string>("");
  const [selectedMasterBatch, setSelectedMasterBatch] = useState<string>("");
  const [finalBatchBOMs, setFinalBatchBOMs] = useState<BOM[]>([]);
  const [masterBatchBOMs, setMasterBatchBOMs] = useState<BOM[]>([]);
  const [isFinalBatchBOMsLoading, setIsFinalBatchBOMsLoading] = useState(false);
  const [isMasterBatchBOMsLoading, setIsMasterBatchBOMsLoading] = useState(false);
  const [finalBatchBOMError, setFinalBatchBOMError] = useState<string | null>(null);
  const [masterBatchBOMError, setMasterBatchBOMError] = useState<string | null>(null);
  const [selectedFinalBatchBOM, setSelectedFinalBatchBOM] = useState<string>("");
  const [selectedMasterBatchBOM, setSelectedMasterBatchBOM] = useState<string>("");

  // Add these new state variables at the top with other state declarations
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [batchItems, setBatchItems] = useState<Array<{item_code: string, item_name: string}>>([]);
  const [batchBOMs, setBatchBOMs] = useState<BOM[]>([]);
  const [isBatchItemsLoading, setIsBatchItemsLoading] = useState(false);
  const [isBatchBOMsLoading, setIsBatchBOMsLoading] = useState(false);
  const [batchItemsError, setBatchItemsError] = useState<string | null>(null);
  const [batchBOMsError, setBatchBOMsError] = useState<string | null>(null);
  const [selectedBatchBOM, setSelectedBatchBOM] = useState<string>("");
  const [batchItemsManuallyLoaded, setBatchItemsManuallyLoaded] = useState(false);

  // Add state variables to track which BOM views are visible
  const [showFinalBatchBOMDetails, setShowFinalBatchBOMDetails] = useState(false);
  const [showMasterBatchBOMDetails, setShowMasterBatchBOMDetails] = useState(false);
  const [showBatchBOMDetails, setShowBatchBOMDetails] = useState(false);

  // Add a state variable to track if batches were explicitly loaded by user action
  const [batchesExplicitlyLoaded, setBatchesExplicitlyLoaded] = useState(false);

  // Fetch item list
  const { data, isLoading, error } = useFrappeGetDocList<Item>("Item", {
    fields: ["name", "item_name", "item_group"],
    filters: [["item_group", "=", "Compound"]],
    limit: 1000,
  });

  // Filter items based on search query
  useEffect(() => {
    if (!data) return;
    
    const itemsData = Array.isArray(data) ? data : [];
    const filtered = searchQuery
      ? itemsData.filter((item) =>
          item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : itemsData;

    setFilteredItems(filtered);
  }, [data, searchQuery]);

  // Fetch BOM list
  const {
    data: bomList,
    isLoading: isBomLoading,
    error: bomError,
    mutate: refetchBomList,
  } = useFrappeGetDocList<BOM>("BOM", {
    fields: ["name", "item", "item_name", "is_active", "is_default"],
    filters: selectedItem ? [["item", "=", selectedItem]] : []
    // enabled: false, // Fetch only when triggered
  });

  const handleFetch = useCallback(() => {
    if (selectedItem) {
      setSelectedBOM("");
      setFetchError(null);
      refetchBomList().catch((err) => {
        console.error("Error fetching BOMs:", err);
        setFetchError("Error fetching BOMs");
      });
    }
  }, [selectedItem, refetchBomList]);

  // Fetch BOM details
  const {
    data: bomDetailsData,
    isLoading: isBomDetailsLoading,
    error: bomDetailsErrorFromHook,
  } = useFrappeGetDoc<BOMDetails>("BOM", selectedBOM || "", {
    fields: ["name", "company", "item", "item_name", "quantity", "uom", "items"],
    enabled: !!selectedBOM, // Fetch only when a BOM is selected
  });

  // Set BOM details when data is received
  useEffect(() => {
    if (bomDetailsData) {
      setBomDetails(bomDetailsData);
      setBomDetailsError(null);
    }
  }, [bomDetailsData]);

  // Handle BOM details error
  useEffect(() => {
    if (bomDetailsErrorFromHook) {
      setBomDetailsError("Could not fetch BOM details");
      setBomDetails(null);
    }
  }, [bomDetailsErrorFromHook]);

  // Handle item selection
  const handleItemSelect = useCallback((value: string) => {
    setSelectedItem(value);
    setOpen(false);
  }, []);

  // Handle BOM selection
  const handleBOMSelect = useCallback((value: string) => {
    setSelectedBOM(value);
  }, []);

  // Handler for Final Batch selection
  const handleFinalBatchChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedFinalBatch(selectedValue);
    setSelectedFinalBatchBOM("");
    
    if (!selectedValue) {
      setFinalBatchBOMs([]);
      return;
    }
    
    setIsFinalBatchBOMsLoading(true);
    setFinalBatchBOMError(null);
    
    try {
      // Use the Frappe API to fetch BOMs associated with this item
      const response = await fetch(`/api/method/frappe.client.get_list?doctype=BOM&fields=["name","item","item_name","is_active","is_default"]&filters=[["item","=","${selectedValue}"]]`);
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message)) {
        setFinalBatchBOMs(data.message);
      } else {
        setFinalBatchBOMs([]);
      }
    } catch (error) {
      console.error("Error fetching Final Batch BOMs:", error);
      setFinalBatchBOMError("Failed to fetch BOMs for this Final Batch");
    } finally {
      setIsFinalBatchBOMsLoading(false);
    }
  }, []);

  // Handler for Master Batch selection
  const handleMasterBatchChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedMasterBatch(selectedValue);
    setSelectedMasterBatchBOM("");
    
    if (!selectedValue) {
      setMasterBatchBOMs([]);
      return;
    }
    
    setIsMasterBatchBOMsLoading(true);
    setMasterBatchBOMError(null);
    
    try {
      // Use the Frappe API to fetch BOMs associated with this item
      const response = await fetch(`/api/method/frappe.client.get_list?doctype=BOM&fields=["name","item","item_name","is_active","is_default"]&filters=[["item","=","${selectedValue}"]]`);
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message)) {
        setMasterBatchBOMs(data.message);
      } else {
        setMasterBatchBOMs([]);
      }
    } catch (error) {
      console.error("Error fetching Master Batch BOMs:", error);
      setMasterBatchBOMError("Failed to fetch BOMs for this Master Batch");
    } finally {
      setIsMasterBatchBOMsLoading(false);
    }
  }, []);

  // Fix the useFrappeGetDoc hook for Master Batch BOM details
  const {
    data: masterBatchBOMDetails,
    isLoading: isMasterBatchBOMDetailsLoading,
    error: masterBatchBOMDetailsError,
  } = useFrappeGetDoc<BOMDetails>(
    "BOM", 
    selectedMasterBatchBOM || "", 
    {
      fields: ["name", "company", "item", "item_name", "quantity", "uom", "items"],
      enabled: !!selectedMasterBatchBOM && selectedMasterBatchBOM.length > 0 && batchItemsManuallyLoaded,
    }
  );

  // Add useEffect to handle fetch when selectedMasterBatchBOM changes
  useEffect(() => {
    // Only process if we've manually selected a Master Batch BOM
    if (!batchItemsManuallyLoaded || !selectedMasterBatchBOM) {
      setBatchItems([]);
      setIsBatchItemsLoading(false);
      return;
    }
    
    // Show loading state while fetching
    if (isMasterBatchBOMDetailsLoading) {
      setIsBatchItemsLoading(true);
      return;
    }
    
    // Handle error state
    if (masterBatchBOMDetailsError) {
      setBatchItems([]);
      setBatchItemsError("Failed to fetch items for this Master Batch BOM");
      setIsBatchItemsLoading(false);
      return;
    }
    
    // Process the data once we have it
    if (masterBatchBOMDetails && masterBatchBOMDetails.items) {
      if (Array.isArray(masterBatchBOMDetails.items) && masterBatchBOMDetails.items.length > 0) {
        const items = masterBatchBOMDetails.items.map(item => ({
          item_code: item.item_code || "",
          item_name: item.item_name || ""
        }));
        
        setBatchItems(items);
        setBatchItemsError(null);
      } else {
        setBatchItems([]);
        setBatchItemsError("No valid items found in this BOM");
      }
      setIsBatchItemsLoading(false);
    }
  }, [selectedMasterBatchBOM, masterBatchBOMDetails, masterBatchBOMDetailsError, isMasterBatchBOMDetailsLoading, batchItemsManuallyLoaded]);

  // Update the Master Batch BOM selection handler
  const handleMasterBatchBOMChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const bomName = e.target.value;
    
    // Reset dependent selections and their BOMs
    setSelectedBatch("");
    setSelectedBatchBOM("");
    setBatchItems([]);
    setBatchBOMs([]);
    
    // Set the selected Master Batch BOM
    setSelectedMasterBatchBOM(bomName);
    
    // Set loading state for batch items and mark that we're explicitly loading
    if (bomName) {
      setIsBatchItemsLoading(true);
      setBatchItemsError(null);
      setBatchesExplicitlyLoaded(true); // Set the flag when user makes selection
    } else {
      setBatchesExplicitlyLoaded(false); // Reset flag when selection is cleared
    }
  }, []);

  // Add handler for Batch selection
  const handleBatchChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    // Reset dependent selections
    setSelectedBatchBOM("");
    setBatchBOMs([]);
    
    // Set new selection
    setSelectedBatch(selectedValue);
    
    if (!selectedValue) {
      setIsBatchBOMsLoading(false);
      setBatchBOMsError(null);
      return;
    }
    
    setIsBatchBOMsLoading(true);
    setBatchBOMsError(null);
    
    try {
      // Use the Frappe API to fetch BOMs associated with this item
      const response = await fetch(`/api/method/frappe.client.get_list?doctype=BOM&fields=["name","item","item_name","is_active","is_default"]&filters=[["item","=","${selectedValue}"]]`);
      const data = await response.json();
      
      if (data.message && Array.isArray(data.message)) {
        setBatchBOMs(data.message);
      } else {
        setBatchBOMs([]);
      }
    } catch (error) {
      console.error("Error fetching Batch BOMs:", error);
      setBatchBOMsError("Failed to fetch BOMs for this Batch");
    } finally {
      setIsBatchBOMsLoading(false);
    }
  }, []);

  // 1. First, add this hook to fetch the selected item's details
  const {
    data: itemDetails,
    isLoading: isItemDetailsLoading,
    error: itemDetailsError,
  } = useFrappeGetDoc<{
    name: string;
    item_name: string;
    item_group: string;
    description: string;
    stock_uom: string;
    valuation_rate: number;
    standard_rate: number;
    is_stock_item: boolean;
    has_batch_no: boolean;
    has_serial_no: boolean;
  }>(
    "Item", 
    selectedItem || "", 
    {
      fields: [
        "name", 
        "item_name", 
        "item_group", 
        "description", 
        "stock_uom", 
        "valuation_rate", 
        "standard_rate", 
        "is_stock_item", 
        "has_batch_no", 
        "has_serial_no"
      ],
      enabled: !!selectedItem, // Only fetch when an item is selected
    }
  );

  // Add a cleanup effect
  useEffect(() => {
    // This will run when the component unmounts or when selectedItem changes
    return () => {
      // Reset all selection states
      setSelectedBOM("");
      setSelectedFinalBatch("");
      setSelectedFinalBatchBOM("");
      setSelectedMasterBatch("");
      setSelectedMasterBatchBOM("");
      setSelectedBatch("");
      setSelectedBatchBOM("");
      
      // Reset data states
      setBatchItems([]);
      setFinalBatchBOMs([]);
      setMasterBatchBOMs([]);
      setBatchBOMs([]);
      
      // Reset error states
      setBatchItemsError(null);
      setFinalBatchBOMError(null);
      setMasterBatchBOMError(null);
      setBatchBOMsError(null);
      setBatchesExplicitlyLoaded(false); // Reset flag on component unmount
    };
  }, [selectedItem]);

  // Add an initialization effect
  useEffect(() => {
    // Clear batch items on component mount
    setBatchItems([]);
    setSelectedBatch("");
  }, []);

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Update BOM</h1>
      <div className="flex flex-row gap-4 mb-6 w-full">
        {/* Left Section - Item Selection */}
        <div className="w-1/4 bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Item</h2>
          <div className="relative flex items-center w-full space-x-2">
            <div className="w-[calc(100%-100px)]">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between border-gray-300 hover:bg-gray-50 hover:border-indigo-300"
                  >
                    {selectedItem && data
                      ? data.find((item) => item.name === selectedItem)?.item_name || 
                        "Unknown item"
                      : "Select an item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput
                      placeholder="Search for an item..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="border-b border-gray-200"
                    />
                    <CommandList>
                      {isLoading ? (
                        <CommandItem disabled>Loading...</CommandItem>
                      ) : error ? (
                        <CommandItem disabled className="text-red-500">Error loading items</CommandItem>
                      ) : filteredItems.length === 0 ? (
                        <CommandEmpty className="text-gray-500">No item found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredItems.map((item) => (
                            <CommandItem
                              key={item.name}
                              value={item.name}
                              onSelect={handleItemSelect}
                              className="hover:bg-indigo-50"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItem === item.name
                                    ? "text-indigo-600 opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {item.item_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-[90px]">
              <Button
                onClick={handleFetch}
                disabled={!selectedItem}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Fetch
              </Button>
            </div>
          </div>
          {/* 2. Then, add this JSX after the Button div in the Item Selection section: */}
          {/* New Item Info Card */}
          {selectedItem && itemDetails && !isItemDetailsLoading && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-indigo-800">
                  {itemDetails.item_name}
                </span>
                <div className="flex gap-1">
                  {itemDetails.is_stock_item && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Stock Item</span>
                  )}
                  {itemDetails.has_batch_no && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Batch</span>
                  )}
                  {itemDetails.has_serial_no && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Serial</span>
                  )}
                </div>
              </div>
              
              <div className="text-gray-700">
                <div className="flex justify-between">
                  <span>Code:</span>
                  <span className="font-medium">{itemDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Group:</span>
                  <span>{itemDetails.item_group}</span>
                </div>
                <div className="flex justify-between">
                  <span>UOM:</span>
                  <span>{itemDetails.stock_uom}</span>
                </div>
                {itemDetails.valuation_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span>₹{itemDetails.valuation_rate.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {itemDetails.description && (
                <div className="mt-2 pt-2 border-t border-indigo-200">
                  <p className="text-xs text-gray-600 line-clamp-2" title={itemDetails.description}>
                    {itemDetails.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Item Loading State */}
          {selectedItem && isItemDetailsLoading && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
              Loading item details...
            </div>
          )}

          {/* Item Error State */}
          {selectedItem && itemDetailsError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              Error loading item details
            </div>
          )}
        </div>

        {/* Middle Section - BOM Selection */}
        <div className="w-1/4 bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Select BOM</h2>
          <div className="space-y-4">
            {/* Use a direct approach rather than the Select component */}
            {isBomLoading ? (
              <div className="p-2 border rounded text-gray-500 bg-gray-50">Loading...</div>
            ) : bomError || fetchError ? (
              <div className="p-2 border rounded text-red-500 bg-red-50 border-red-200">Error loading BOMs</div>
            ) : !bomList || bomList.length === 0 ? (
              <div className="p-2 border rounded text-amber-700 bg-amber-50 border-amber-200">No BOMs found</div>
            ) : (
              <select 
                value={selectedBOM} 
                onChange={(e) => setSelectedBOM(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              >
                <option value="">Select BOM</option>
                {bomList.map((bom) => (
                  <option key={bom.name} value={bom.name}>
                    {bom.name} {bom.is_default ? "(Default)" : ""}{" "}
                    {bom.is_active ? "(Active)" : "(Inactive)"}
                  </option>
                ))}
              </select>
            )}
            
            {/* BOM Info Card - Shows critical info of selected BOM */}
            {selectedBOM && bomDetailsData && !isBomDetailsLoading && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-purple-800">
                    {bomDetailsData.name}
                  </span>
                  <div className="flex gap-1">
                    {bomList?.find(b => b.name === selectedBOM)?.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                    {bomList?.find(b => b.name === selectedBOM)?.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    )}
                  </div>
                </div>
                <div className="text-gray-700">
                  <div className="flex justify-between">
                    <span>Item:</span>
                    <span className="font-medium">{bomDetailsData.item_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qty:</span>
                    <span>{bomDetailsData.quantity} {bomDetailsData.uom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Company:</span>
                    <span>{bomDetailsData.company}</span>
                  </div>
                  
                  {/* Items Section */}
                  <div className="mt-2 pt-2 border-t border-purple-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Items ({bomDetailsData.items.length})</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto pr-1">
                      {bomDetailsData.items.map((item, idx) => (
                        <div key={idx} className="py-1 border-b border-purple-100 last:border-b-0">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium truncate max-w-[120px]" title={item.item_name}>
                              {item.item_name}
                            </span>
                            <span>{item.qty} {item.uom}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="truncate max-w-[120px]" title={item.item_code}>
                              {item.item_code}
                            </span>
                            <span>₹{item.rate.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state for BOM details */}
            {selectedBOM && isBomDetailsLoading && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                Loading BOM details...
              </div>
            )}
          </div>
        </div>

        {/* Right Section - BOM Details */}
        <div className="w-1/2 bg-white rounded-lg shadow-md p-6 border-t-4 border-teal-500">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Update BOM Details</h2>
          
          {/* Final Batch Row */}
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="final-batch">
                Final Batch:
              </label>
              <select
                id="final-batch"
                value={selectedFinalBatch}
                onChange={handleFinalBatchChange}
                className="col-span-4 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={!bomDetailsData}
              >
                <option value="">Select Final Batch</option>
                {bomDetailsData && bomDetailsData.items && bomDetailsData.items
                  .filter(item => 
                    item.item_code.includes("FB") || 
                    item.item_name.toLowerCase().includes("final batch"))
                  .map((item, idx) => (
                    <option key={`fb-${idx}`} value={item.item_code}>
                      {item.item_name} ({item.item_code})
                    </option>
                  ))
                }
              </select>
              
              <label className="col-span-1 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="final-bom-ref">
                BOM:
              </label>
              <select
                id="final-bom-ref"
                value={selectedFinalBatchBOM}
                onChange={(e) => setSelectedFinalBatchBOM(e.target.value)}
                className="col-span-3 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={isFinalBatchBOMsLoading || !selectedFinalBatch}
              >
                <option value="">Select BOM</option>
                {isFinalBatchBOMsLoading ? (
                  <option value="" disabled>Loading BOMs...</option>
                ) : finalBatchBOMError ? (
                  <option value="" disabled>Error loading BOMs</option>
                ) : finalBatchBOMs.length === 0 && selectedFinalBatch ? (
                  <option value="" disabled>No BOMs found</option>
                ) : (
                  finalBatchBOMs.map(bom => (
                    <option key={bom.name} value={bom.name}>
                      {bom.name} {bom.is_default ? "(Default)" : ""} {bom.is_active ? "(Active)" : "(Inactive)"}
                    </option>
                  ))
                )}
              </select>
              
              <div className="col-span-2 flex gap-1">
                <Button 
                  variant="outline" 
                  className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50 text-xs px-2"
                  disabled={!selectedFinalBatchBOM}
                >
                  Update
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-2"
                  disabled={!selectedFinalBatchBOM}
                  onClick={() => setShowFinalBatchBOMDetails(true)}
                >
                  View
                </Button>
              </div>
            </div>
            
            {/* Final Batch BOM Info */}
            {selectedFinalBatchBOM && finalBatchBOMs.length > 0 && (
              <div className="mt-2 ml-[calc(16.67%+1rem)] col-span-10 bg-teal-50 border border-teal-200 rounded-md p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-teal-800">
                    {selectedFinalBatchBOM}
                  </span>
                  <div className="flex gap-1">
                    {finalBatchBOMs.find(b => b.name === selectedFinalBatchBOM)?.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                    {finalBatchBOMs.find(b => b.name === selectedFinalBatchBOM)?.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1 text-gray-700">
                  <div>
                    <span className="text-gray-500">Item:</span> {finalBatchBOMs.find(b => b.name === selectedFinalBatchBOM)?.item_name}
                  </div>
                  <div>
                    <span className="text-gray-500">Code:</span> {finalBatchBOMs.find(b => b.name === selectedFinalBatchBOM)?.item}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Master Batch Row */}
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="master-batch">
                Master Batch:
              </label>
              <select
                id="master-batch"
                value={selectedMasterBatch}
                onChange={handleMasterBatchChange}
                className="col-span-4 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={!bomDetailsData}
              >
                <option value="">Select Master Batch</option>
                {bomDetailsData && bomDetailsData.items && bomDetailsData.items
                  .filter(item => 
                    item.item_code.includes("MB") || 
                    item.item_name.toLowerCase().includes("master batch"))
                  .map((item, idx) => (
                    <option key={`mb-${idx}`} value={item.item_code}>
                      {item.item_name} ({item.item_code})
                    </option>
                  ))
                }
              </select>
              
              <label className="col-span-1 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="master-bom-ref">
                BOM:
              </label>
              <select
                id="master-bom-ref"
                value={selectedMasterBatchBOM}
                onChange={handleMasterBatchBOMChange}
                className="col-span-3 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={isMasterBatchBOMsLoading || !selectedMasterBatch}
              >
                <option value="">Select BOM</option>
                {isMasterBatchBOMsLoading ? (
                  <option value="" disabled>Loading BOMs...</option>
                ) : masterBatchBOMError ? (
                  <option value="" disabled>Error loading BOMs</option>
                ) : masterBatchBOMs.length === 0 && selectedMasterBatch ? (
                  <option value="" disabled>No BOMs found</option>
                ) : (
                  masterBatchBOMs.map(bom => (
                    <option key={bom.name} value={bom.name}>
                      {bom.name} {bom.is_default ? "(Default)" : ""} {bom.is_active ? "(Active)" : "(Inactive)"}
                    </option>
                  ))
                )}
              </select>
              
              <div className="col-span-2 flex gap-1">
                <Button 
                  variant="outline" 
                  className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50 text-xs px-2"
                  disabled={!selectedMasterBatchBOM}
                >
                  Update
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-2"
                  disabled={!selectedMasterBatchBOM}
                  onClick={() => setShowMasterBatchBOMDetails(true)}
                >
                  View
                </Button>
              </div>
            </div>
            
            {/* Master Batch BOM Info */}
            {selectedMasterBatchBOM && masterBatchBOMs.length > 0 && (
              <div className="mt-2 ml-[calc(16.67%+1rem)] col-span-10 bg-indigo-50 border border-indigo-200 rounded-md p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-indigo-800">
                    {selectedMasterBatchBOM}
                  </span>
                  <div className="flex gap-1">
                    {masterBatchBOMs.find(b => b.name === selectedMasterBatchBOM)?.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                    {masterBatchBOMs.find(b => b.name === selectedMasterBatchBOM)?.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1 text-gray-700">
                  <div>
                    <span className="text-gray-500">Item:</span> {masterBatchBOMs.find(b => b.name === selectedMasterBatchBOM)?.item_name}
                  </div>
                  <div>
                    <span className="text-gray-500">Code:</span> {masterBatchBOMs.find(b => b.name === selectedMasterBatchBOM)?.item}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Batch Row */}
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-2 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="batch">
                Batch:
              </label>
              <select
                id="batch"
                value={selectedBatch}
                onChange={handleBatchChange}
                className="col-span-4 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={!selectedMasterBatchBOM || !batchItemsManuallyLoaded || isMasterBatchBOMDetailsLoading || isBatchItemsLoading}
              >
                <option value="">Select Batch</option>
                {!selectedMasterBatchBOM ? (
                  <option value="" disabled>Select Master Batch BOM first</option>
                ) : !batchItemsManuallyLoaded ? (
                  <option value="" disabled>Please select Master Batch BOM again</option>
                ) : isMasterBatchBOMDetailsLoading || isBatchItemsLoading ? (
                  <option value="" disabled>Loading batches...</option>
                ) : batchItemsError ? (
                  <option value="" disabled>{batchItemsError}</option>
                ) : batchItems.length === 0 ? (
                  <option value="" disabled>No batches available</option>
                ) : (
                  batchItems.map((item, idx) => (
                    <option key={`batch-${idx}`} value={item.item_code}>
                      {item.item_name} ({item.item_code})
                    </option>
                  ))
                )}
              </select>
              
              <label className="col-span-1 text-sm font-medium whitespace-nowrap text-gray-700" htmlFor="batch-bom-ref">
                BOM:
              </label>
              <select
                id="batch-bom-ref"
                value={selectedBatchBOM}
                onChange={(e) => setSelectedBatchBOM(e.target.value)}
                className="col-span-3 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                disabled={isBatchBOMsLoading || !selectedBatch}
              >
                <option value="">Select BOM</option>
                {isBatchBOMsLoading ? (
                  <option value="" disabled>Loading BOMs...</option>
                ) : batchBOMsError ? (
                  <option value="" disabled>{batchBOMsError}</option>
                ) : batchBOMs.length === 0 && selectedBatch ? (
                  <option value="" disabled>No BOMs found</option>
                ) : (
                  batchBOMs.map(bom => (
                    <option key={bom.name} value={bom.name}>
                      {bom.name} {bom.is_default ? "(Default)" : ""} {bom.is_active ? "(Active)" : "(Inactive)"}
                    </option>
                  ))
                )}
              </select>
              
              <div className="col-span-2 flex gap-1">
                <Button 
                  variant="outline" 
                  className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50 text-xs px-2"
                  disabled={!selectedBatchBOM}
                >
                  Update
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-2"
                  disabled={!selectedBatchBOM}
                  onClick={() => setShowBatchBOMDetails(true)}
                >
                  View
                </Button>
              </div>
            </div>
            
            {/* Batch BOM Info - with different color scheme */}
            {selectedBatchBOM && batchBOMs.length > 0 && (
              <div className="mt-2 ml-[calc(16.67%+1rem)] col-span-10 bg-amber-50 border border-amber-200 rounded-md p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-amber-800">
                    {selectedBatchBOM}
                  </span>
                  <div className="flex gap-1">
                    {batchBOMs.find(b => b.name === selectedBatchBOM)?.is_default && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                    )}
                    {batchBOMs.find(b => b.name === selectedBatchBOM)?.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1 text-gray-700">
                  <div>
                    <span className="text-gray-500">Item:</span> {batchBOMs.find(b => b.name === selectedBatchBOM)?.item_name}
                  </div>
                  <div>
                    <span className="text-gray-500">Code:</span> {batchBOMs.find(b => b.name === selectedBatchBOM)?.item}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Note about conditional options */}
          {!bomDetailsData && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              Select a BOM to populate the available Final Batch and Master Batch options
            </div>
          )}
        </div>
      </div>
  
      {/* Bottom Section - Additional BOM Views */}
      <div className="flex flex-col gap-4 mb-6 w-full">
        {/* Final Batch BOM View */}
        <div className="p-4 bg-white rounded-lg shadow-md border-t-4 border-teal-500">
          <h3 className="text-lg font-semibold text-teal-700 mb-2">Final Batch BOM View</h3>
          {showFinalBatchBOMDetails && selectedFinalBatchBOM ? (
            <FinalBatchBOMDetailsView 
              bomId={selectedFinalBatchBOM} 
              onClose={() => setShowFinalBatchBOMDetails(false)}
              key={`final-view-${selectedFinalBatchBOM}`} // Add this key
            />
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm h-48 flex items-center justify-center">
              {selectedFinalBatchBOM ? 
                "Click the View button to display BOM details" : 
                "Select a Final Batch BOM to view its details"
              }
            </div>
          )}
        </div>
        
        {/* Master Batch BOM View */}
        <div className="p-4 bg-white rounded-lg shadow-md border-t-4 border-indigo-500">
          <h3 className="text-lg font-semibold text-indigo-700 mb-2">Master Batch BOM View</h3>
          {showMasterBatchBOMDetails && selectedMasterBatchBOM ? (
            <MasterBatchBOMDetailsView 
              bomId={selectedMasterBatchBOM} 
              onClose={() => setShowMasterBatchBOMDetails(false)}
              key={`master-view-${selectedMasterBatchBOM}`} // Add this key
            />
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm h-48 flex items-center justify-center">
              {selectedMasterBatchBOM ? 
                "Click the View button to display BOM details" : 
                "Select a Master Batch BOM to view its details"
              }
            </div>
          )}
        </div>
        
        {/* Batch BOM View */}
        <div className="p-4 bg-white rounded-lg shadow-md border-t-4 border-amber-500">
          <h3 className="text-lg font-semibold text-amber-700 mb-2">Batch BOM View</h3>
          {showBatchBOMDetails && selectedBatchBOM ? (
            <BatchBOMDetailsView 
              bomId={selectedBatchBOM} 
              onClose={() => setShowBatchBOMDetails(false)}
              key={`batch-view-${selectedBatchBOM}`} // Add this key
            />
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm h-48 flex items-center justify-center">
              {selectedBatchBOM ? 
                "Click the View button to display BOM details" : 
                "Select a Batch BOM to view its details"
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateBOM;