import React, { useState, useEffect } from "react";
import { useFrappeGetDocList } from 'frappe-react-sdk';
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

interface Item {
  name: string;
  item_name: string;
  item_group: string;
}

const UpdateBOM: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading, error } = useFrappeGetDocList<Item>('Item', {
    fields: ['name', 'item_name', 'item_group'],
    filters: [['item_group', '=', 'Compound']],
    limit: 1000
  });

  // Add fallback for empty data
  const itemsData = data || [];
  
  // Use a useEffect to handle filtering to avoid rendering issues
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  
  useEffect(() => {
    if (itemsData && searchQuery) {
      setFilteredItems(
        itemsData.filter((item) =>
          item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredItems(itemsData);
    }
  }, [itemsData, searchQuery]);

  const handleFetch = () => {
    if (selectedItem) {
      console.log("Fetching data for:", selectedItem);
    }
  };

  return (
    <div className="w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-6">Update BOM</h1>
      <div className="flex flex-row gap-4 mb-6 w-full">
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Item</h2>
          {/* Modified this div to ensure content stays inside */}
          <div className="relative flex items-center w-full space-x-2">
            {/* Set width to 100% minus button width */}
            <div className="w-[calc(100%-100px)]">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedItem
                      ? itemsData.find((item) => item.name === selectedItem)?.item_name || "Unknown item"
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
                    />
                    <CommandList>
                      {isLoading ? (
                        <CommandItem disabled>Loading...</CommandItem>
                      ) : error ? (
                        <CommandItem disabled>Error loading items</CommandItem>
                      ) : filteredItems.length === 0 ? (
                        <CommandEmpty>No item found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredItems.map((item) => (
                            <CommandItem
                              key={item.name}
                              value={item.name}
                              onSelect={(value) => {
                                setSelectedItem(value);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItem === item.name ? "opacity-100" : "opacity-0"
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
            {/* Fixed width for button */}
            <div className="w-[90px]">
              <Button 
                onClick={handleFetch}
                disabled={!selectedItem}
                className="w-full"
              >
                Fetch
              </Button>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Section 2</h2>
          <div className="space-y-4">
            <p>Middle section content</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Section 3</h2>
          <div className="space-y-4">
            <p>Right section content</p>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 w-full">
        <h2 className="text-xl font-semibold mb-4">Additional Section</h2>
        <div className="space-y-4">
          <p>Additional content goes here</p>
        </div>
      </div>

      {/* Third row */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 w-full">
        <h2 className="text-xl font-semibold mb-4">Third Section</h2>
        <div className="space-y-4">
          <p>Third section content goes here</p>
        </div>
      </div>

      {/* Fourth row */}
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <h2 className="text-xl font-semibold mb-4">Fourth Section</h2>
        <div className="space-y-4">
          <p>Fourth section content goes here</p>
        </div>
      </div>
    </div>
  );
};

export default UpdateBOM;