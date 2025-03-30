import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Loader2, CheckCircle2, AlertCircle, Layers, UserCheck,
    Clipboard, BarChart2, Search, PlusCircle, X, Save, RefreshCw, ChevronDown
} from "lucide-react";

// Types and Interfaces
interface RejectionType {
    id: number;
    type: string;
    qty: string;
}

interface OperationDetail {
    id: number;
    operationId: string;
    employeeCode: string;
    employeeName: string;
}

interface BatchInfo {
    sppBatchId: string;
    itemCode: string;
    warehouse: string;
    batchNo: string;
    availableQuantity: string;
}

interface OperationDetailData {
    operation: string;
    employeeCode: string;
    employeeName: string;
}

interface RejectionData {
    rejectionType: string;
    quantity: string;
}

interface InspectionInfo {
    inspectionQuantity: string;
    inspectorCode: string;
    inspectorName: string;
}

interface FormattedData {
    batchInfo: BatchInfo;
    operationDetails: OperationDetailData[];
    inspectionInfo: InspectionInfo;
    rejectionDetails: RejectionData[];
    summary?: {
        totalInspected: string;
        totalRejected: string;
        acceptedQuantity: string;
        rejectionPercentage: string;
    };
}

interface ValidationData {
    status?: string;
    message?: string;
    batch_no?: string;
    bom_no?: string;
    item_code?: string;
    production_item?: string;
    from_warehouse?: string;
    qty_from_item_batch?: number;
    spp_batch_number?: string;
    moulding_lot_number?: string | null;
    name?: string;
    bom_operations?: Array<{ operation: string }>;
}

interface CreationResult {
    success: boolean;
    operation: string;
    employee: string;
    name?: string;
    error?: string;
}

interface InspectionResult {
    success: boolean;
    name?: string;
    error?: string;
}

// LoadingOverlay component to show loading states
const LoadingOverlay: React.FC<{
  isLoading: boolean;
  processingStatus: string;
  validationData: boolean;
  saveProgress: number;
  savingEntries: boolean;
  creatingInspection: boolean;
}> = ({ isLoading, processingStatus, validationData, saveProgress, savingEntries, creatingInspection }) => {
  if (!isLoading && !validationData && !savingEntries && !creatingInspection) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-4 relative">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white"></div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {validationData ? "Validating Batch" : 
             savingEntries ? "Saving Entries" : 
             creatingInspection ? "Creating Inspection" : "Loading"}
          </h3>
          
          <p className="text-slate-600 mb-4 text-center">{processingStatus}</p>
          
          {saveProgress > 0 && savingEntries && (
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${saveProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Success notification component
const SuccessNotification: React.FC<{ showSuccessNotification: boolean }> = ({ showSuccessNotification }) => {
  if (!showSuccessNotification) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg shadow-lg p-4 flex items-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-500 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-emerald-800">Success!</h4>
          <p className="text-sm text-emerald-600">Operation completed successfully.</p>
        </div>
      </div>
    </div>
  );
};

// Error notification component
const ErrorNotification: React.FC<{ scanError: string }> = ({ scanError }) => {
  if (!scanError) return null;
  
  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-800">Error</h4>
          <p className="text-sm text-red-700">{scanError}</p>
        </div>
      </div>
    </div>
  );
};

// Add this new component for batch confirmation
const BatchConfirmationDialog: React.FC<{
  show: boolean;
  onClose: () => void;
  batchInfo: {
    batchId: string;
    itemCode: string;
    batchNo: string;
    warehouse: string;
    quantity: string;
  }
}> = ({ show, onClose, batchInfo }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-slate-800">Batch Information</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full" 
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">SPP Batch ID:</span>
              <span className="text-sm font-bold text-indigo-900">{batchInfo.batchId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">Batch No:</span>
              <span className="text-sm font-bold text-indigo-900">{batchInfo.batchNo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">Item Code:</span>
              <span className="text-sm font-bold text-indigo-900">{batchInfo.itemCode}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-indigo-700">Warehouse:</span>
              <span className="text-sm font-bold text-indigo-900">{batchInfo.warehouse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-indigo-700">Available Qty:</span>
              <span className="text-sm font-bold text-indigo-900">{batchInfo.quantity}</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white py-2 rounded-xl"
            onClick={onClose}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

// Add these new dialog components after the BatchConfirmationDialog component
// Process Success Dialog
const ProcessSuccessDialog: React.FC<{
  show: boolean;
  onClose: () => void;
  processDetails: {
    title: string;
    message: string;
    operations?: { operation: string; employee: string; name?: string }[];
  }
}> = ({ show, onClose, processDetails }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-slate-800">{processDetails.title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full" 
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center mb-3">
              <div className="mr-3 p-2 bg-blue-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-blue-700 font-medium">{processDetails.message}</p>
            </div>
            
            {processDetails.operations && processDetails.operations.length > 0 && (
              <div className="mt-3 border-t border-blue-100 pt-3">
                <p className="text-sm font-medium text-blue-700 mb-2">Operation Details:</p>
                <div className="bg-white rounded-lg border border-blue-100 divide-y divide-blue-50">
                  {processDetails.operations.map((op, index) => (
                    <div key={index} className="p-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{op.operation}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {op.employee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
            onClick={onClose}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Updated Process Error Dialog with better text handling
const ProcessErrorDialog: React.FC<{
  show: boolean;
  onClose: () => void;
  errorDetails: {
    title: string;
    message: string;
    errors?: { operation: string; employee: string; error: string }[];
  }
}> = ({ show, onClose, errorDetails }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4 animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-slate-800">{errorDetails.title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full" 
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-start mb-3">
              <div className="mr-3 p-2 bg-red-100 rounded-full flex-shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-red-700 font-medium break-words">{errorDetails.message}</p>
            </div>
            
            {errorDetails.errors && errorDetails.errors.length > 0 && (
              <div className="mt-3 border-t border-red-100 pt-3">
                <p className="text-sm font-medium text-red-700 mb-2">Error Details:</p>
                <div className="bg-white rounded-lg border border-red-100 divide-y divide-red-50 max-h-60 overflow-y-auto">
                  {errorDetails.errors.map((err, index) => (
                    <div key={index} className="p-3 text-sm">
                      <div className="flex justify-between mb-1 flex-wrap">
                        <span className="font-medium text-slate-700 mr-2">{err.operation}</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {err.employee}
                        </span>
                      </div>
                      <p className="text-xs text-red-600 break-words">{err.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
            onClick={onClose}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Add this custom SearchableSelect component just before the main SubLotProcessing component
const SearchableSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder = "Select an option", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="w-full p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 animate-fade-in-down">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-8 py-1.5 text-sm bg-slate-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`p-2.5 cursor-pointer hover:bg-blue-50 ${value === option ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                  onClick={() => handleSelectOption(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-slate-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
const SubLotProcessing: React.FC = () => {
    // State definitions
    const [batchId, setBatchId] = useState<string>("");
    const [itemCode, setItemCode] = useState<string>("");
    const [warehouse, setWarehouse] = useState<string>("");
    const [batchNo, setBatchNo] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [employeeId, setEmployeeId] = useState<string>("");
    const [employeeBarcode, setEmployeeBarcode] = useState<string>("");
    const [inspectionQty, setInspectionQty] = useState<string>("");
    const csrfToken = (window as any).csrf_token;

    const [scanError, setScanError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [operationDetails, setOperationDetails] = useState<OperationDetail[]>([]);
    const [rejectionDetails, setRejectionDetails] = useState<RejectionType[]>([
        { id: 1, type: "TOOL MARK", qty: "0" },
        { id: 2, type: "BONDING FAILURE", qty: "0" },
        { id: 3, type: "THREAD", qty: "0" },
        { id: 4, type: "OVER TRIM", qty: "0" },
        { id: 5, type: "MOULD DAMAGE", qty: "0" },
        { id: 6, type: "WOOD PARTICLE", qty: "0" },
        { id: 7, type: "WASHER VISIBLE", qty: "0" },
        { id: 8, type: "DISPRESS PROBLEM", qty: "0" },
        { id: 9, type: "THK UNDERSIZE", qty: "0" },
        { id: 10, type: "THK OVERSIZE", qty: "0" },
        { id: 11, type: "ID UNDERSIZE", qty: "0" },
        { id: 12, type: "ID OVERSIZE", qty: "0" },
        { id: 13, type: "OD UNDERSIZE", qty: "0" },
        { id: 14, type: "OD OVERSIZE", qty: "0" },
        { id: 15, type: "IMPRESSION MARK", qty: "0" },
        { id: 16, type: "WELD LINE", qty: "0" },
        { id: 17, type: "BEND", qty: "0" },
        { id: 18, type: "PIN HOLE", qty: "0" },
        { id: 19, type: "BACKRIND", qty: "0" },
        { id: 20, type: "BONDING BUBBLE", qty: "0" },
        { id: 21, type: "PARTING LINE CUTMARK", qty: "0" },
        { id: 22, type: "MOULD RUST", qty: "0" },
        { id: 23, type: "STAIN ISSUE", qty: "0" },
        { id: 24, type: "STRETCH TEST", qty: "0" }
    ]);

    const [scannedEmployee, setScannedEmployee] = useState<{ name: string; code: string } | null>(null);
    const [validatingLot, setValidatingLot] = useState<boolean>(false);
    const [savingEntries, setSavingEntries] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string>("");
    const [saveProgress, setSaveProgress] = useState<number>(0);
    const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
    const [creatingInspection, setCreatingInspection] = useState<boolean>(false);
    const [showBatchConfirmation, setShowBatchConfirmation] = useState<boolean>(false);

    // Add these to your state definitions
    const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
    const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);
    const [processSuccess, setProcessSuccess] = useState<{
      title: string;
      message: string;
      operations?: { operation: string; employee: string; name?: string }[];
    }>({ title: "", message: "" });
    const [processError, setProcessError] = useState<{
      title: string;
      message: string;
      errors?: { operation: string; employee: string; error: string }[];
    }>({ title: "", message: "" });

    // Enhanced animation styles
    const animationStyles = `
      @keyframes pulse-subtle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fade-in-up {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fade-in-down {
        from { 
          opacity: 0;
          transform: translateY(-10px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slide-up {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes scale-in {
        from { 
          opacity: 0;
          transform: scale(0.95);
        }
        to { 
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes shimmer {
        0% {
          background-position: -468px 0;
        }
        100% {
          background-position: 468px 0;
        }
      }
      
      .animate-shimmer {
        background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
        background-size: 800px 104px;
        animation: shimmer 1.5s infinite linear;
      }
      
      .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
      
      .animate-fade-in-up {
        animation: fade-in-up 0.4s ease-out forwards;
      }
      
      .animate-fade-in-down {
        animation: fade-in-down 0.4s ease-out forwards;
      }
      
      .animate-slide-up {
        animation: slide-up 0.3s ease-out forwards;
      }
      
      .animate-scale-in {
        animation: scale-in 0.3s ease-out forwards;
      }
      
      .animate-pulse-subtle {
        animation: pulse-subtle 2s infinite ease-in-out;
      }
      
      .animate-border-pulse {
        animation: pulse-subtle 1.5s infinite ease-in-out;
      }
      
      .depth-card {
        box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(.25,.8,.25,1);
      }
      
      .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
      }
      
      .section-border:after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(to right, rgba(59, 130, 246, 0.5), rgba(99, 102, 241, 0.2));
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
      }
    `;

    // Validation function for employee barcode
    const validateEmployeeBarcode = (barcode: string): { isValid: boolean; message: string } => {
        if (!barcode || barcode.trim() === "") {
            return { isValid: false, message: "Employee barcode is required" };
        }

        // Use a regex that matches HR-EMP-##### (5 digits)
        const regex = /^HR-EMP-\d{5}$/;
        if (!regex.test(barcode)) {
            return {
                isValid: false,
                message: "Employee barcode must be in the format HR-EMP-##### (e.g., HR-EMP-00001)"
            };
        }
        return { isValid: true, message: "" };
    };

    // Handler functions
    const handleScanBatch = async () => {
        if (!batchId) {
            setScanError("Please enter a batch ID");
            return;
        }

        setScanError("");
        setIsLoading(true);

        try {
            // First API call - Get Stock Entry Detail
            const stockEntryUrl = `/api/resource/Stock Entry Detail/?fields=["name","item_code","batch_no"]&filters=[["Stock Entry Detail","spp_batch_number","=","${encodeURIComponent(batchId)}"],["Stock Entry Detail","item_group","=","Products"],["Stock Entry Detail","is_finished_item","=",1]]&parent=Stock Entry`;
            const stockEntryResponse = await fetch(stockEntryUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!stockEntryResponse.ok) {
                throw new Error(`Stock Entry API request failed with status ${stockEntryResponse.status}`);
            }

            const stockEntryResult = await stockEntryResponse.json();
            if (stockEntryResult.data && stockEntryResult.data.length > 0) {
                const stockEntry = stockEntryResult.data[0];
                const itemCodeValue = stockEntry.item_code || "";
                const batchNoValue = stockEntry.batch_no || "";

                // Set these values immediately
                setItemCode(itemCodeValue);
                setBatchNo(batchNoValue);

                // If we have both item code and batch number, fetch from Item Batch Stock Balance
                if (itemCodeValue && batchNoValue) {
                    try {
                        // Second API call - Get Item Batch Stock Balance
                        const batchStockUrl = `/api/resource/Item Batch Stock Balance/?fields=["warehouse","qty"]&filters=[["Item Batch Stock Balance","item_code","=","${encodeURIComponent(itemCodeValue)}"],["Item Batch Stock Balance","batch_no","=","${encodeURIComponent(batchNoValue)}"]]`;
                        const batchStockResponse = await fetch(batchStockUrl, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                        });

                        if (!batchStockResponse.ok) {
                            throw new Error(`Batch Stock API request failed with status ${batchStockResponse.status}`);
                        }

                        const batchStockResult = await batchStockResponse.json();
                        if (batchStockResult.data && batchStockResult.data.length > 0) {
                            // Find the entry with the highest quantity
                            const batchStock = batchStockResult.data.reduce((prev: { qty: number; }, current: { qty: number; }) =>
                                (prev.qty > current.qty) ? prev : current
                            );

                            // Update warehouse and quantity from Item Batch Stock Balance
                            setWarehouse(batchStock.warehouse || "");
                            setQuantity(batchStock.qty?.toString() || "0");
                            
                            // Show confirmation dialog
                            setShowBatchConfirmation(true);
                        } else {
                            setWarehouse("");
                            setQuantity("0");
                        }
                    } catch (batchErr) {
                        setWarehouse("");
                        setQuantity("0");
                    }
                } else {
                    setWarehouse("");
                    setQuantity("0");
                }
            } else {
                setScanError(`No data found for batch ID: ${batchId}`);
                setItemCode("");
                setWarehouse("");
                setBatchNo("");
                setQuantity("");
            }
        } catch (err) {
            setScanError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setItemCode("");
            setWarehouse("");
            setBatchNo("");
            setQuantity("");
        } finally {
            setIsLoading(false);
        }
    };

    // Update the handleScanEmployee function to check for duplicate operation types
const handleScanEmployee = async () => {
    if (!employeeId) {
        setScanError("Please enter an employee ID");
        return;
    }

    setScanError("");
    setIsLoading(true);

    try {
        // Parse the employee ID format (e.g., PC-0001, OD-0001, ID-001)
        const parts = employeeId.split('-');
        if (parts.length !== 2) {
            throw new Error("Invalid employee ID format. Expected format: XX-YYYY (e.g., PC-0001)");
        }

        const operationCode = parts[0].toUpperCase();
        const empCode = parts[1];

        // Format the employee code with the HR-EMP- prefix
        const formattedEmpCode = `HR-EMP-${empCode.padStart(5, '0')}`;

        // Map operation codes to full operation names
        const operationMap: Record<string, string> = {
            'PC': 'Post Curing',
            'OD': 'OD Trimming',
            'ID': 'ID Trimming',
        };

        // Get the operation name or use the code if not found
        const operationName = operationMap[operationCode] || operationCode;

        // First, check if this operation type already exists in the table
        const existingOperationType = operationDetails.find(
            op => op.operationId === operationName
        );

        if (existingOperationType) {
            throw new Error(`Operation "${operationName}" is already added to the table. Each operation type can only be added once.`);
        }

        // Then check if this operation+employee combination already exists (as a secondary check)
        const existingOpIndex = operationDetails.findIndex(
            op => op.operationId === operationName && op.employeeCode === formattedEmpCode
        );

        if (existingOpIndex !== -1) {
            throw new Error(`Employee ${formattedEmpCode} is already assigned to operation ${operationName}`);
        }

        // Fetch employee info from the API using the formatted employee code
        const response = await fetch(`/api/resource/Employee?fields=["name","employee_name"]&filters=[["Employee","name","=","${formattedEmpCode}"]]`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Employee API request failed with status ${response.status}`);
        }

        const result = await response.json();
        if (result.data && result.data.length > 0) {
            const employee = result.data[0];

            // Create a new ID for this operation detail
            const newId = operationDetails.length > 0
                ? Math.max(...operationDetails.map(op => op.id)) + 1
                : 1;

            // Add this operation to the list
            setOperationDetails([
                ...operationDetails,
                {
                    id: newId,
                    operationId: operationName,
                    employeeCode: employee.name,
                    employeeName: employee.employee_name
                }
            ]);

            // Clear the employee ID field for the next entry
            setEmployeeId("");
            setEmployeeBarcode(employeeId);
        } else {
            throw new Error(`Employee not found with ID: ${formattedEmpCode}`);
        }
    } catch (error) {
        setScanError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsLoading(false);
    }
};

    const handleScanEmployeeBarcode = async () => {
        if (!employeeBarcode) {
            setScanError("Please enter an employee barcode");
            return;
        }

        // Validate employee barcode format
        const validation = validateEmployeeBarcode(employeeBarcode);
        if (!validation.isValid) {
            setScanError(validation.message);
            return;
        }

        setScanError("");
        setIsLoading(true);

        try {
            // Use the employee barcode directly (now validated to be in HR-EMP-XXXX format)
            const formattedEmpCode = employeeBarcode.trim();

            // Fetch employee info from the API using the formatted employee code
            const response = await fetch(`/api/resource/Employee?fields=["name","employee_name"]&filters=[["Employee","name","=","${formattedEmpCode}"]]`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Employee API request failed with status ${response.status}`);
            }

            const result = await response.json();
            if (result.data && result.data.length > 0) {
                const employee = result.data[0];

                // Set the scanned employee state
                setScannedEmployee({
                    name: employee.employee_name,
                    code: employee.name
                });
            } else {
                throw new Error(`Employee not found with barcode: ${formattedEmpCode}`);
            }
        } catch (error) {
            setScanError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveOperation = (id: number) => {
        setOperationDetails(operationDetails.filter(op => op.id !== id));
    };

    const handleSaveToERPNext = async (
        formData: FormattedData,
        bomOperations: string[] = [],
        validationData: ValidationData = {}
    ): Promise<CreationResult[]> => {
        try {
            const creationResults: CreationResult[] = [];
            // Format the operations string from the BOM operations
            const operationsString = bomOperations.join(',');

            // Calculate progress increment per operation
            const progressIncrement = 100 / formData.operationDetails.length;

            for (let i = 0; i < formData.operationDetails.length; i++) {
                const operation = formData.operationDetails[i];

                // Update status with current operation
                setProcessingStatus(`Creating entry ${i+1} of ${formData.operationDetails.length}: ${operation.operation}`);

                try {
                    // Calculate rejected quantity based on rejection details
                    const totalRejectionQty = formData.rejectionDetails
                        .filter(r => parseFloat(r.quantity) > 0)
                        .reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

                    // Calculate accepted quantity (inspection quantity minus rejection)
                    const acceptedQty = Math.max(0, parseFloat(formData.inspectionInfo.inspectionQuantity || "0") - totalRejectionQty);

                    const payload = {
                        data: {
                            // Required core fields
                            scan_lot_no: formData.batchInfo.sppBatchId,
                            scan_operator: operation.employeeCode,
                            operation_type: operation.operation,
                            operator_id: operation.employeeCode,
                            operator_name: operation.employeeName || "", // Include employee name
                            // BOM operations field
                            operations: operationsString,
                            // Pass all validation data fields
                            batch_no: validationData.batch_no || formData.batchInfo.batchNo || formData.batchInfo.sppBatchId,
                            bom_no: validationData.bom_no || "",
                            product_ref: validationData.item_code || formData.batchInfo.itemCode,
                            from_warehouse: validationData.from_warehouse || formData.batchInfo.warehouse || "",
                            production_item: validationData.production_item || "",
                            // Quantity information
                            available_qty: validationData.qty_from_item_batch?.toString() ,
                            qtynos:validationData.qty_from_item_batch?.toString() ,
                            // Inspection and rejection information
                            qty_after_rejection_nos: acceptedQty.toString(),
                            // Include additional context fields
                            job_card: validationData.name || "",
                            spp_batch_number: validationData.spp_batch_number || formData.batchInfo.sppBatchId,
                            moulding_lot_number: validationData.moulding_lot_number || null,
                            // Default values for required fields
                            posting_date: new Date().toISOString().split('T')[0],
                        }
                    };

                    const response = await fetch("/api/method/spp.api.create_lot_resource_tagging", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "X-Frappe-CSRF-Token": csrfToken || "",
                        },
                        body: JSON.stringify(payload),
                    });

                    const result = await response.json();
                    if (result.message && result.message.success) {
                        creationResults.push({
                            success: true,
                            operation: operation.operation,
                            employee: operation.employeeCode,
                            name: result.message.name,
                        });
                    } else {
                        let errorMessage = "Unknown error";

                        // Try to extract the error message from the server response
                        if (result.message && result.message.error) {
                            errorMessage = result.message.error;
                        } else if (result._server_messages) {
                            try {
                                // Server messages are often sent as a JSON string array
                                const messages = JSON.parse(result._server_messages);
                                if (messages && messages.length > 0) {
                                    try {
                                        const firstMessage = JSON.parse(messages[0]);
                                        errorMessage = firstMessage.message || messages[0];
                                    } catch {
                                        errorMessage = messages[0].replace(/["\\{}$$]/g, '');
                                    }
                                }
                            } catch {
                                errorMessage = result._server_messages;
                            }
                        }

                        creationResults.push({
                            success: false,
                            operation: operation.operation,
                            employee: operation.employeeCode,
                            error: errorMessage,
                        });
                    }
                } catch (error) {
                    creationResults.push({
                        success: false,
                        operation: operation.operation,
                        employee: operation.employeeCode,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }

                // Update progress after each operation
                setSaveProgress(Math.min(100, (i + 1) * progressIncrement));
            }

            const allSuccessful = creationResults.every((result) => result.success);
            if (allSuccessful) {
                setProcessingStatus("All entries created successfully!");
            } else {
                const failedOps = creationResults.filter((result) => !result.success);
                const errorDetails = failedOps.map(op =>
                    `${op.operation} (${op.employee}): ${op.error}`
                ).join('\n');
                setScanError(`Failed to create entries: ${errorDetails}`);
            }

            return creationResults;
        } catch (error) {
            setScanError(`Error saving to ERPNext: ${error instanceof Error ? error.message : "Unknown error"}`);
            return [];
        } finally {
            setIsLoading(false);
            setSavingEntries(false);
        }
    };

    const handleSave = async (): Promise<FormattedData | undefined> => {
        // Validate employee barcode is present and in correct format
        const empBarcodeValidation = validateEmployeeBarcode(employeeBarcode);
        if (!empBarcodeValidation.isValid) {
            // Show error dialog instead of setting error message
            setProcessError({
                title: "Validation Error",
                message: empBarcodeValidation.message
            });
            setShowErrorDialog(true);
            return;
        }

        // Format data by sections
        const formattedData: FormattedData = {
            batchInfo: {
                sppBatchId: batchId,
                itemCode: itemCode,
                warehouse: warehouse,
                batchNo: batchNo,
                availableQuantity: quantity,
            },
            operationDetails: operationDetails.map(op => ({
                operation: op.operationId,
                employeeCode: op.employeeCode,
                employeeName: op.employeeName,
            })),
            inspectionInfo: {
                inspectionQuantity: inspectionQty,
                inspectorCode: scannedEmployee?.code || employeeBarcode,
                inspectorName: scannedEmployee?.name || "",
            },
            rejectionDetails: selectedRejections.map(r => ({
                rejectionType: r.type,
                quantity: r.qty,
            })),
        };

        const totalRejectionQty = rejectionDetails.reduce((sum, item) => {
            return sum + (parseFloat(item.qty) || 0);
        }, 0);

        const acceptedQty = Math.max(0, parseFloat(inspectionQty) - totalRejectionQty);

        formattedData.summary = {
            totalInspected: inspectionQty,
            totalRejected: totalRejectionQty.toString(),
            acceptedQuantity: acceptedQty.toString(),
            rejectionPercentage: inspectionQty ?
                ((totalRejectionQty / parseFloat(inspectionQty)) * 100).toFixed(2) + "%" :
                "0%",
        };

        // Log formatted data to console
        console.log("Form Data:", formattedData);
        console.log("Form Data (JSON):", JSON.stringify(formattedData, null, 2));

        if (!formattedData.batchInfo.sppBatchId) {
            setProcessError({
                title: "Validation Error",
                message: "Please scan a batch ID before saving"
            });
            setShowErrorDialog(true);
            return;
        }

        if (formattedData.operationDetails.length === 0) {
            setProcessError({
                title: "Validation Error",
                message: "Please add at least one operation detail before saving"
            });
            setShowErrorDialog(true);
            return;
        }

        try {
            // Set loading state
            setIsLoading(true);
            setSavingEntries(true);
            setProcessingStatus("Submitting data to server...");

            // Log detailed form data before submission
            console.log("Submitting form data:");
            console.log("Batch Info:", formattedData.batchInfo);
            console.log("Operations:", formattedData.operationDetails);
            console.log("Inspection:", formattedData.inspectionInfo);
            console.log("Rejections:", formattedData.rejectionDetails);
            
            // Make API call to backend - FIXED the endpoint URL
            const response = await fetch("/api/method/spp.api.process_lot", { // Changed from process_lot to process_sublot
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Frappe-CSRF-Token": csrfToken || "",
                },
                body: JSON.stringify({ data: formattedData }),
            });

            console.log("Response status:", response.status);
            const result = await response.json();
            console.log("API Response (Full):", result);

            if (response.ok && result.message && result.message.success) {
                // Show success dialog
                setProcessSuccess({
                    title: "Process Completed",
                    message: "Data successfully saved to the server!",
                    operations: formattedData.operationDetails.map(op => ({
                        operation: op.operation,
                        employee: op.employeeCode,
                        name: op.employeeName
                    }))
                });
                setShowSuccessDialog(true);
                setShowSuccessNotification(true);
                
                // Reset form after successful submission
                setTimeout(() => {
                    resetForm();
                }, 2000);
            } else {
                // Extract error message
                let errorMessage = "Failed to save data";
                if (result.message && result.message.error) {
                    errorMessage = result.message.error;
                } else if (result._server_messages) {
                    try {
                        const messages = JSON.parse(result._server_messages);
                        if (messages && messages.length > 0) {
                            try {
                                const firstMessage = JSON.parse(messages[0]);
                                errorMessage = firstMessage.message || messages[0];
                            } catch {
                                errorMessage = messages[0].replace(/["\\{}$$]/g, '');
                            }
                        }
                    } catch {
                        errorMessage = result._server_messages;
                    }
                }
                
                // Show error dialog
                setProcessError({
                    title: "Error Saving Data",
                    message: errorMessage
                });
                setShowErrorDialog(true);
            }
        } catch (error) {
            console.error("Error saving data:", error);
            setProcessError({
                title: "Error Saving Data",
                message: error instanceof Error ? error.message : "Unknown error"
            });
            setShowErrorDialog(true);
        } finally {
            setIsLoading(false);
            setSavingEntries(false);
            setProcessingStatus("");
        }

        return formattedData;
    };

    // Add this function to reset the form
    const resetForm = () => {
        setBatchId("");
        setItemCode("");
        setWarehouse("");
        setBatchNo("");
        setQuantity("");
        setEmployeeId("");
        setEmployeeBarcode("");
        setInspectionQty("");
        setOperationDetails([]);
        setScannedEmployee(null);
        setSelectedRejections([]);
        setSelectedRejectionType("");
        setRejectionQty("");
    };

    // Add these to your state definitions
    const [selectedRejectionType, setSelectedRejectionType] = useState<string>("");
    const [rejectionQty, setRejectionQty] = useState<string>("");
    const [selectedRejections, setSelectedRejections] = useState<{ type: string; qty: string }[]>([]);

    // Rejection types array
    const rejectionTypes = [
        "TOOL MARK", "BONDING FAILURE", "THREAD", "OVER TRIM", "MOULD DAMAGE", "WOOD PARTICLE",
        "WASHER VISIBLE", "DISPRESS PROBLEM", "THK UNDERSIZE", "THK OVERSIZE", "ID UNDERSIZE",
        "ID OVERSIZE", "OD UNDERSIZE", "OD OVERSIZE", "IMPRESSION MARK", "WELD LINE", "BEND",
        "PIN HOLE", "BACKRIND", "BONDING BUBBLE", "PARTING LINE CUTMARK", "MOULD RUST", "STAIN ISSUE",
        "STRETCH TEST"
    ];

    // Handle adding rejection
    const handleAddRejection = () => {
        if (selectedRejectionType && rejectionQty && parseInt(rejectionQty) > 0) {
            setSelectedRejections([
                ...selectedRejections,
                { type: selectedRejectionType, qty: rejectionQty }
            ]);
            setSelectedRejectionType("");
            setRejectionQty("");
        }
    };

    // Handle removing rejection
    const handleRemoveRejection = (index: number) => {
        const newRejections = [...selectedRejections];
        newRejections.splice(index, 1);
        setSelectedRejections(newRejections);
    };

    return (
  <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
    <style>{animationStyles}</style>
    <LoadingOverlay 
      isLoading={isLoading} 
      processingStatus={processingStatus} 
      validationData={validatingLot} 
      saveProgress={saveProgress} 
      savingEntries={savingEntries} 
      creatingInspection={creatingInspection} 
    />

    <SuccessNotification showSuccessNotification={showSuccessNotification} />

    <div className="w-full animate-fade-in-up">
      <div className="glass-card rounded-xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center">
              <div className="mr-3 p-2 bg-white/20 rounded-lg shadow-inner">
                <Layers className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              Sub Lot Processing
            </h1>
            {processingStatus && !isLoading && (
              <div className="px-4 py-1.5 bg-blue-500/70 backdrop-blur-sm rounded-full text-sm text-white animate-scale-in shadow-lg border border-blue-400/30 flex items-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse mr-2"></div>
                {processingStatus}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 md:p-8">
          <ErrorNotification scanError={scanError} />
          
          {/* Batch Information Card */}
          <div className="mb-8 hover-lift depth-card rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600/10 to-blue-500/5 border-b border-slate-200 section-border relative">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <div className="mr-3 p-1.5 rounded-md bg-blue-100 text-blue-600">
                  <BarChart2 className="h-5 w-5" />
                </div>
                Batch Information
                {isLoading && <div className="ml-auto"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>}
              </h3>
            </div>
            
            <div className={`p-5 transition-all duration-300 ${batchId && itemCode ? 'animate-fade-in' : ''}`}>
              <div className="mb-5 group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700 group-focus-within:text-blue-700 transition-colors" htmlFor="scan-spp">
                    Scan SPP Batch:
                  </label>
                  <div className="lg:col-span-4 flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id="scan-spp"
                        placeholder="Batch ID"
                        className="w-full p-2.5 bg-slate-50/80 border-slate-200 rounded-lg transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                      />
                      {!batchId && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                          <div className="w-0.5 h-4 bg-slate-300 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                      onClick={handleScanBatch}
                      disabled={!batchId || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Search className="h-4 w-4 mr-1" />
                      )}
                      Scan Batch
                    </Button>
                  </div>
                  <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="batch-no">
                    Batch No:
                  </label>
                  <Input
                    id="batch-no"
                    placeholder="Batch No"
                    className="lg:col-span-4 p-2.5 bg-slate-50/80 border-slate-200 rounded-lg"
                    value={batchNo}
                    readOnly
                  />
                </div>
              </div>
              
              {/* Rest of batch information fields remain similar, just update styling */}
            </div>
          </div>
          
          {/* Employee section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <div className="space-y-6 w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="hover-lift depth-card rounded-xl overflow-hidden bg-white">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-b border-slate-200 section-border">
                  <h3 className="font-semibold text-slate-800 flex items-center">
                    <div className="mr-3 p-1.5 rounded-md bg-blue-100 text-blue-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    Employee Information
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium whitespace-nowrap text-slate-700 w-1/3" htmlFor="scan-emp">
                      Scan Employee:
                    </label>
                    <div className="flex gap-2 w-2/3">
                      <div className="flex-1 relative">
                        <Input
                          id="scan-emp"
                          placeholder="Employee ID (e.g., PC-0001)"
                          className="w-full p-2.5 bg-slate-50/80 border-slate-200 rounded-lg transition focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                        />
                        {!employeeId && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                            <div className="w-0.5 h-4 bg-slate-300 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                        onClick={handleScanEmployee}
                        disabled={!employeeId}
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Operation Details Card */}
              <div className="hover-lift depth-card rounded-xl overflow-hidden bg-white shadow-md">
  <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
    <h3 className="font-semibold flex items-center justify-center">
      <Clipboard className="mr-2 h-5 w-5" />
      Operation Details
    </h3>
  </div>
  <div className="max-h-[320px] overflow-y-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-blue-50 border-b border-blue-100">
          <TableHead className="font-semibold text-blue-600 py-3">Operation</TableHead>
          <TableHead className="font-semibold text-blue-600 py-3">Employee Code</TableHead>
          <TableHead className="font-semibold text-blue-600 py-3">Employee Name</TableHead>
          <TableHead className="font-semibold text-blue-600 w-16 py-3">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {operationDetails.length > 0 ? (
          operationDetails.map((operation) => (
            <TableRow
              key={operation.id}
              className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors animate-fade-in-up"
            >
              <TableCell className="py-3">{operation.operationId}</TableCell>
              <TableCell className="py-3">{operation.employeeCode}</TableCell>
              <TableCell className="py-3">{operation.employeeName}</TableCell>
              <TableCell className="py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  onClick={() => handleRemoveOperation(operation.id)}
                >
                  <span className="sr-only">Remove</span>
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-slate-500 py-8">
              <div className="flex flex-col items-center">
                <div className="relative p-4 mb-2 rounded-full bg-slate-50/80">
                  <Clipboard className="h-6 w-6 text-slate-300" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 animate-spin" style={{ animationDuration: '8s' }}></div>
                </div>
                <p className="font-medium text-slate-600">No operations added yet</p>
                <p className="text-xs text-slate-400 mt-1">Scan employee code to add operation</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>

            </div>
            
            {/* Inspection Information Card */}
            <div className="space-y-6 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="hover-lift depth-card rounded-xl overflow-hidden bg-white">
                <div className="px-5 py-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-b border-slate-200 section-border">
                  <h3 className="font-semibold text-slate-800 flex items-center">
                    <div className="mr-3 p-1.5 rounded-md bg-blue-100 text-blue-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    Inspection Information
                  </h3>
                </div>
                
                {/* Inspection fields */}
                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="total-inspection">
                      Inspection Qty: <span className="text-blue-500">*</span>
                    </label>
                    <div className="flex-1 relative">
                      <Input
                        id="total-inspection"
                        placeholder="Inspection Quantity"
                        className={`w-full p-2.5 bg-slate-50/80 rounded-lg transition ${!inspectionQty ? "border-blue-300 animate-border-pulse" : "border-slate-200"} focus:ring-2 focus:ring-blue-400 focus:border-blue-400`}
                        value={inspectionQty}
                        onChange={(e) => setInspectionQty(e.target.value)}
                        required
                      />
                      {!inspectionQty && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                          <div className="w-0.5 h-4 bg-blue-300 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="emp-barcode">
                      Emp Barcode: <span className="text-blue-500">*</span>
                    </label>
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1 relative">
                        <Input
                          id="emp-barcode"
                          placeholder="HR-EMP-00001"
                          className={`w-full p-2.5 bg-slate-50/80 rounded-lg transition ${!employeeBarcode ? "border-blue-300 animate-border-pulse" : "border-slate-200"} focus:ring-2 focus:ring-blue-400 focus:border-blue-400`}
                          value={employeeBarcode}
                          onChange={(e) => setEmployeeBarcode(e.target.value)}
                          required
                        />
                        {!employeeBarcode && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                            <div className="w-0.5 h-4 bg-blue-300 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                        onClick={handleScanEmployeeBarcode}
                        disabled={!employeeBarcode || isLoading}
                      >
                        {isLoading ? 
                          <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 
                          <Search className="h-4 w-4 mr-1" />
                        }
                        Verify
                      </Button>
                    </div>
                  </div>
                  
                  {/* Employee info card */}
                  {scannedEmployee && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-100 rounded-xl shadow-inner animate-fade-in-down">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-3 p-1.5 bg-white rounded-full border border-blue-200 shadow-sm">
                            <UserCheck className="h-5 w-5 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium text-blue-700">{scannedEmployee.name}</span>
                        </div>
                        <div>
                          <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                            {scannedEmployee.code}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rejection Details Card */}
              {/* Improved Rejection Details Card with Searchable Dropdown */}
<div className="hover-lift depth-card rounded-xl overflow-hidden bg-white shadow-md">
  <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
    <h3 className="font-semibold flex items-center justify-center">
      <AlertCircle className="mr-2 h-5 w-5" />
      Rejection Details
    </h3>
  </div>
  
  {/* New rejection type selection with searchable dropdown */}
  <div className="p-4 border-b border-slate-100">
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-700">Add Rejection</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-2">
          <SearchableSelect
            options={rejectionTypes}
            value={selectedRejectionType}
            onChange={setSelectedRejectionType}
            placeholder="Search rejection type..."
            className="w-full"
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            min="0"
            placeholder="Quantity"
            value={rejectionQty}
            onChange={(e) => setRejectionQty(e.target.value)}
            className="w-full p-2.5 bg-slate-50/80 border border-slate-200 rounded-lg"
          />
        </div>
      </div>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg self-end"
        onClick={handleAddRejection}
        disabled={!selectedRejectionType || !rejectionQty || parseInt(rejectionQty) <= 0}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Rejection
      </Button>
    </div>
  </div>
  
  {/* Rest of the rejection details card remains unchanged */}
  <div className="max-h-[320px] overflow-y-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-blue-50 border-b border-blue-100">
          <TableHead className="font-semibold text-blue-700 py-3">Rejection Type</TableHead>
          <TableHead className="font-semibold text-blue-700 py-3 text-center">Quantity</TableHead>
          <TableHead className="font-semibold text-blue-700 py-3 w-16">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {selectedRejections.length > 0 ? (
          selectedRejections.map((rejection, index) => (
            <TableRow
              key={index}
              className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
            >
              <TableCell className="py-2.5">{rejection.type}</TableCell>
              <TableCell className="py-2.5 text-center">{rejection.qty}</TableCell>
              <TableCell className="py-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  onClick={() => handleRemoveRejection(index)}
                >
                  <span className="sr-only">Remove</span>
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-slate-500 py-8">
              <p className="font-medium">No rejections added</p>
              <p className="text-xs text-slate-400 mt-1">Use the form above to add rejection details</p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>

  {/* Total rejection summary */}
  {selectedRejections.length > 0 && (
    <div className="p-4 bg-blue-50 border-t border-blue-100">
      <div className="flex justify-between items-center">
        <span className="font-medium text-blue-700">Total Rejected:</span>
        <span className="font-bold text-blue-800 px-3 py-1 bg-blue-100 rounded-full">
          {selectedRejections.reduce((sum, item) => sum + parseInt(item.qty), 0)}
        </span>
      </div>
    </div>
  )}
</div>

            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="mr-2 h-5 w-5" />
                  Save
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    {/* Dialogs */}
    <BatchConfirmationDialog
      show={showBatchConfirmation}
      onClose={() => setShowBatchConfirmation(false)}
      batchInfo={{
        batchId,
        itemCode,
        batchNo,
        warehouse,
        quantity,
      }}
    />
    
    <ProcessSuccessDialog 
      show={showSuccessDialog}
      onClose={() => setShowSuccessDialog(false)}
      processDetails={processSuccess}
    />
    
    <ProcessErrorDialog
      show={showErrorDialog}
      onClose={() => setShowErrorDialog(false)}
      errorDetails={processError}
    />
  </div>
);
};

export default SubLotProcessing;
