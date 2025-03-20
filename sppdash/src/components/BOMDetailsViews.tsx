import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, XCircle } from "lucide-react";

// BOM View Props
interface BOMViewProps {
  bomId: string;
  onClose?: () => void;
}

// BOM item type
interface BOMItem {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  stock_uom?: string;
  stock_qty?: number;
}

// BOM operation type
interface BOMOperation {
  operation: string;
  workstation: string;
  time_in_mins: number;
  operating_cost: number;
}

// BOM data type
interface BOMData {
  name: string;
  item: string;
  item_name: string;
  is_active: boolean;
  is_default: boolean;
  company: string;
  quantity: number;
  uom: string;
  operating_cost: number;
  raw_material_cost: number;
  total_cost: number;
  items: BOMItem[];
  operations?: BOMOperation[];
}

/**
 * Final Batch BOM Details View
 */
export function FinalBatchBOMDetailsView({ bomId, onClose }: BOMViewProps) {
  const [bomData, setBomData] = useState<BOMData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch BOM data directly using fetch API instead of hooks
  useEffect(() => {
    let isMounted = true;
    
    const fetchBOMData = async () => {
      if (!bomId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const fields = [
          "name", "item", "item_name", "is_active", "is_default", "company", 
          "quantity", "uom", "operating_cost", "raw_material_cost", "total_cost",
          "items", "operations"
        ];
        
        const response = await fetch(
          `/api/method/frappe.client.get?doctype=BOM&name=${bomId}&fields=${JSON.stringify(fields)}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          if (result.message) {
            setBomData(result.message);
          } else {
            throw new Error("No data returned from API");
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching Final Batch BOM data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };
    
    fetchBOMData();
    
    return () => {
      isMounted = false;
    };
  }, [bomId]);
  
  return (
    <BOMDetails
      bomData={bomData}
      isLoading={isLoading}
      error={error}
      colorScheme="teal"
      onClose={onClose}
      bomType="Final Batch"
    />
  );
}

/**
 * Master Batch BOM Details View
 */
export function MasterBatchBOMDetailsView({ bomId, onClose }: BOMViewProps) {
  const [bomData, setBomData] = useState<BOMData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch BOM data directly using fetch API instead of hooks
  useEffect(() => {
    let isMounted = true;
    
    const fetchBOMData = async () => {
      if (!bomId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const fields = [
          "name", "item", "item_name", "is_active", "is_default", "company", 
          "quantity", "uom", "operating_cost", "raw_material_cost", "total_cost",
          "items", "operations"
        ];
        
        const response = await fetch(
          `/api/method/frappe.client.get?doctype=BOM&name=${bomId}&fields=${JSON.stringify(fields)}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          if (result.message) {
            setBomData(result.message);
          } else {
            throw new Error("No data returned from API");
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching Master Batch BOM data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };
    
    fetchBOMData();
    
    return () => {
      isMounted = false;
    };
  }, [bomId]);
  
  return (
    <BOMDetails
      bomData={bomData}
      isLoading={isLoading}
      error={error}
      colorScheme="indigo"
      onClose={onClose}
      bomType="Master Batch"
    />
  );
}

/**
 * Batch BOM Details View
 */
export function BatchBOMDetailsView({ bomId, onClose }: BOMViewProps) {
  const [bomData, setBomData] = useState<BOMData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch BOM data directly using fetch API instead of hooks
  useEffect(() => {
    let isMounted = true;
    
    const fetchBOMData = async () => {
      if (!bomId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const fields = [
          "name", "item", "item_name", "is_active", "is_default", "company", 
          "quantity", "uom", "operating_cost", "raw_material_cost", "total_cost",
          "items", "operations"
        ];
        
        const response = await fetch(
          `/api/method/frappe.client.get?doctype=BOM&name=${bomId}&fields=${JSON.stringify(fields)}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          if (result.message) {
            setBomData(result.message);
          } else {
            throw new Error("No data returned from API");
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching Batch BOM data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };
    
    fetchBOMData();
    
    return () => {
      isMounted = false;
    };
  }, [bomId]);
  
  return (
    <BOMDetails
      bomData={bomData}
      isLoading={isLoading}
      error={error}
      colorScheme="amber"
      onClose={onClose}
      bomType="Batch"
    />
  );
}

// Shared BOM details rendering component (pure presentation, no state)
function BOMDetails({ 
  bomData, 
  isLoading, 
  error, 
  colorScheme, 
  onClose,
  bomType
}: {
  bomData: BOMData | null;
  isLoading: boolean;
  error: Error | null;
  colorScheme: "teal" | "indigo" | "amber";
  onClose?: () => void;
  bomType: string;
}) {
  // Color mapping for different BOM types
  const colors = {
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-800",
      heading: "text-teal-700",
      lightBg: "bg-teal-100",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-800", 
      heading: "text-indigo-700",
      lightBg: "bg-indigo-100",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      heading: "text-amber-700",
      lightBg: "bg-amber-100",
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
          <p className="text-gray-500">Loading {bomType} BOM details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-500 font-medium">Error loading {bomType} BOM details</p>
          <p className="text-gray-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!bomData) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-amber-500">No data found for this {bomType} BOM</p>
        </div>
      </div>
    );
  }

  const color = colors[colorScheme];
  
  return (
    <div className={`w-full rounded-lg ${color.bg} ${color.border} border p-4 overflow-auto max-h-[calc(100vh-16rem)]`}>
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${color.heading}`}>
          BOM Details: {bomData.name}
        </h3>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close details"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* BOM header information */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap justify-between items-center mb-2">
          <div className="flex items-center">
            <h4 className={`text-base font-medium ${color.text}`}>
              {bomData.item_name}
            </h4>
            <div className="ml-2 flex gap-1">
              {bomData.is_default && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
              )}
              {bomData.is_active ? (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
              ) : (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Inactive</span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Item Code: <span className="font-medium">{bomData.item}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div>
            <div className="text-xs text-gray-500">Quantity</div>
            <div className="font-medium">{bomData.quantity} {bomData.uom}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Company</div>
            <div className="font-medium">{bomData.company}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Cost</div>
            <div className="font-medium">₹{bomData.total_cost?.toFixed(2) || "0.00"}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Raw Material Cost</div>
            <div className="font-medium">₹{bomData.raw_material_cost?.toFixed(2) || "0.00"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Operating Cost</div>
            <div className="font-medium">₹{bomData.operating_cost?.toFixed(2) || "0.00"}</div>
          </div>
        </div>
      </div>
      
      {/* Items/Materials Table */}
      <div className="mb-4">
        <h5 className={`text-sm font-medium ${color.heading} mb-2`}>Materials</h5>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${color.lightBg}`}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">Item</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">Rate</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomData.items.map((item, idx) => (
                <tr key={`${item.item_code}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    <div className="font-medium text-gray-800">{item.item_name}</div>
                    <div className="text-xs text-gray-500">{item.item_code}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 truncate max-w-[250px]" title={item.description}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-right whitespace-nowrap">
                    {item.qty} {item.uom}
                    {item.stock_uom && item.stock_uom !== item.uom && (
                      <div className="text-xs text-gray-500">
                        {item.stock_qty} {item.stock_uom}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-right whitespace-nowrap">₹{item.rate.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-right whitespace-nowrap font-medium">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Total Cost:</td>
                <td className="px-4 py-2 text-sm font-bold text-right">₹{bomData.raw_material_cost?.toFixed(2) || "0.00"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Operations Table (if exists) */}
      {bomData.operations && bomData.operations.length > 0 && (
        <div className="mb-4">
          <h5 className={`text-sm font-medium ${color.heading} mb-2`}>Operations</h5>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${color.lightBg}`}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">Operation</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 tracking-wider">Workstation</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">Time (min)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bomData.operations.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{op.operation}</td>
                    <td className="px-4 py-2 text-sm">{op.workstation}</td>
                    <td className="px-4 py-2 text-sm text-right">{op.time_in_mins}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{op.operating_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Total Operating Cost:</td>
                  <td className="px-4 py-2 text-sm font-bold text-right">₹{bomData.operating_cost?.toFixed(2) || "0.00"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}