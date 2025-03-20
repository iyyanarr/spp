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
    filters: selectedItem ? [["item", "=", selectedItem]] : [],
    enabled: false, // Fetch only when triggered
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
          </div>
        </div>

        {/* Right Section - BOM Details */}
        <div className="w-1/2 bg-white rounded-lg shadow-md p-6 border-t-4 border-teal-500">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">BOM Details</h2>
          
          {/* Final Batch Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center w-2/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="final-batch">
                Final Batch:
              </label>
              <input
                id="final-batch"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="Enter Final Batch"
              />
            </div>
            <div className="flex items-center w-1/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="final-bom-ref">
                BOM Ref:
              </label>
              <input
                id="final-bom-ref"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="BOM Reference"
              />
            </div>
            <div className="flex gap-2 w-1/4">
              <Button variant="outline" className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50">
                Update
              </Button>
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                View
              </Button>
            </div>
          </div>
          
          {/* Master Batch Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center w-2/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="master-batch">
                Master Batch:
              </label>
              <input
                id="master-batch"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="Enter Master Batch"
              />
            </div>
            <div className="flex items-center w-1/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="master-bom-ref">
                BOM Ref:
              </label>
              <input
                id="master-bom-ref"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="BOM Reference"
              />
            </div>
            <div className="flex gap-2 w-1/4">
              <Button variant="outline" className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50">
                Update
              </Button>
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                View
              </Button>
            </div>
          </div>
          
          {/* Batch Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center w-2/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="batch">
                Batch:
              </label>
              <input
                id="batch"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="Enter Batch"
              />
            </div>
            <div className="flex items-center w-1/3 gap-2">
              <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-1/4" htmlFor="batch-bom-ref">
                BOM Ref:
              </label>
              <input
                id="batch-bom-ref"
                type="text"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
                placeholder="BOM Reference"
              />
            </div>
            <div className="flex gap-2 w-1/4">
              <Button variant="outline" className="flex-1 border-teal-500 text-teal-700 hover:bg-teal-50">
                Update
              </Button>
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                View
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-4 mb-6 w-full p-4 bg-white rounded-lg shadow-md border-l-4 border-gray-400">
        <span className="text-gray-600">Status information and additional details can go here</span>
      </div>
    </div>
  );
};

export default UpdateBOM;