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
  Clipboard, BarChart2, Search, PlusCircle, X, Save, RefreshCw 
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
  bom_operations?: Array<{operation: string}>;
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
  
  const [scanError, setScanError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [operationDetails, setOperationDetails] = useState<OperationDetail[]>([]);
  
  const [rejectionDetails, setRejectionDetails] = useState<RejectionType[]>([
    { id: 1, type: "TOOL MARK", qty: "0" },
    { id: 2, type: "BONDING FALUIRE", qty: "0" },
    { id: 3, type: "THREAD", qty: "0" },
    { id: 4, type: "OVER TRIM", qty: "0" },
    { id: 5, type: "MOULD DAMAGE", qty: "0" },
    { id: 6, type: "WOOD PARTICLE", qty: "0" },
    { id: 7, type: "WASHER VISIBLE", qty: "0" },
    { id: 8, type: "DISPERS PROBLEM", qty: "0" },
    { id: 9, type: "THK UNDERSIZ", qty: "0" },
    { id: 10, type: "THK OVERSIZE", qty: "0" },
    { id: 11, type: "ID UNDERSIZ", qty: "0" },
    { id: 12, type: "ID OVERSIZE", qty: "0" },
    { id: 13, type: "OD UNDERSIZ", qty: "0" },
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

  // CSS animations
  const animationStyles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
    .animate-pulse-subtle { animation: pulse 2s infinite; }
    .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
    .animate-fade-in-down { animation: fadeInDown 0.4s ease-out; }
    
    @keyframes progressAnimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .animated-gradient {
      background: linear-gradient(45deg, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6);
      background-size: 200% 200%;
      animation: progressAnimation 2s ease infinite;
    }
  `;

  // Validation function for employee barcode
  const validateEmployeeBarcode = (barcode: string): { isValid: boolean; message: string } => {
    if (!barcode || barcode.trim() === '') {
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
    console.log("Scanning batch:", batchId);
    
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
      console.log("Stock Entry result:", stockEntryResult);
      
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
            console.log("Batch Stock result:", batchStockResult);
            
            if (batchStockResult.data && batchStockResult.data.length > 0) {
              // Find the entry with the highest quantity
              const batchStock = batchStockResult.data.reduce((prev: { qty: number; }, current: { qty: number; }) => 
                (prev.qty > current.qty) ? prev : current
              );
              
              // Update warehouse and quantity from Item Batch Stock Balance
              setWarehouse(batchStock.warehouse || "");
              setQuantity(batchStock.qty?.toString() || "0");
            } else {
              console.log("No batch stock data found");
              setWarehouse("");
              setQuantity("0");
            }
          } catch (batchErr) {
            console.error("Error fetching batch stock data:", batchErr);
            // Don't set error message for this secondary call
            setWarehouse("");
            setQuantity("0");
          }
        } else {
          setWarehouse("");
          setQuantity("0");
        }
      } else {
        // No data found for this batch ID
        setScanError(`No data found for batch ID: ${batchId}`);
        
        // Clear the form fields
        setItemCode("");
        setWarehouse("");
        setBatchNo("");
        setQuantity("");
      }
    } catch (err) {
      console.error("Error processing batch data:", err);
      setScanError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Clear the form fields on error
      setItemCode("");
      setWarehouse("");
      setBatchNo("");
      setQuantity("");
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Check if this operation+employee combination already exists
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
        
        // Update the barcode field with the original input
        setEmployeeBarcode(employeeId);
        
        console.log(`Added operation ${operationName}, Employee: ${employee.employee_name} (${employee.name})`);
      } else {
        throw new Error(`Employee not found with ID: ${formattedEmpCode}`);
      }
    } catch (error) {
      console.error("Error processing employee scan:", error);
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
        
        console.log(`Scanned Employee: ${employee.employee_name} (${employee.name})`);
      } else {
        throw new Error(`Employee not found with barcode: ${formattedEmpCode}`);
      }
    } catch (error) {
      console.error("Error processing employee barcode scan:", error);
      setScanError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOperation = (id: number) => {
    setOperationDetails(operationDetails.filter(op => op.id !== id));
  };

  const handleCreateInspectionEntry = async (formData: FormattedData, validationData: ValidationData = {}): Promise<InspectionResult> => {
    try {
      // Calculate total rejected quantity
      const totalRejectionQty = formData.rejectionDetails
        .filter(r => parseFloat(r.quantity) > 0)
        .reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      
      // Calculate accepted quantity
      const inspectionQty = parseFloat(formData.inspectionInfo.inspectionQuantity || "0");
      const acceptedQty = Math.max(0, inspectionQty - totalRejectionQty);
      
      // Format rejection items for child table with all required fields
      const items = formData.rejectionDetails
        .filter(r => parseFloat(r.quantity) > 0) // Only include rejections with qty > 0
        .map(r => ({
          // These are the fields from the table structure you provided
          type_of_defect: r.rejectionType,
          rejected_qty: parseInt(r.quantity),
          product_ref_no: validationData.item_code || formData.batchInfo.itemCode,
          batch_no: validationData.batch_no || formData.batchInfo.batchNo,
          lot_no: formData.batchInfo.sppBatchId,
          inspector_code: formData.inspectionInfo.inspectorCode,
          inspector_name: formData.inspectionInfo.inspectorName,
          operator_name: "", // Can be filled if needed
          rejected_qty_kg: 0, // Can be calculated if needed
          machine_no: "" // Can be filled if needed
        }));
      
      // Add a row for accepted quantity if there are any accepted items
      if (acceptedQty > 0) {
        items.push({
          type_of_defect: "ACCEPTED",
          rejected_qty: parseInt(acceptedQty.toString()),
          product_ref_no: validationData.item_code || formData.batchInfo.itemCode,
          batch_no: validationData.batch_no || formData.batchInfo.batchNo,
          lot_no: formData.batchInfo.sppBatchId,
          inspector_code: formData.inspectionInfo.inspectorCode,
          inspector_name: formData.inspectionInfo.inspectorName,
          operator_name: "",
          rejected_qty_kg: 0,
          machine_no: ""
        });
      }
      
      // Create the inspection entry document object with proper numeric values
      const docObject = {
        doctype: "Inspection Entry",
        inspection_type: "Final Visual Inspection",
        posting_date: new Date().toISOString().split('T')[0],
        
        // Lot information
        lot_no: formData.batchInfo.sppBatchId,
        scan_production_lot: formData.batchInfo.sppBatchId,
        product_ref_no: validationData.item_code || formData.batchInfo.itemCode,
        spp_batch_number: validationData.spp_batch_number || formData.batchInfo.sppBatchId,
        batch_no: validationData.batch_no || formData.batchInfo.batchNo,
        
        // Inspector information
        inspector_name: formData.inspectionInfo.inspectorName,
        inspector_code: formData.inspectionInfo.inspectorCode,
        scan_inspector: formData.inspectionInfo.inspectorCode,
        
        // Warehouse information
        source_warehouse: validationData.from_warehouse || formData.batchInfo.warehouse,
        
        // Quantity information - Ensure all numeric values are properly converted to numbers
        vs_pdir_qty: parseFloat(validationData.qty_from_item_batch?.toString() || formData.batchInfo.availableQuantity || "0"),
        total_inspected_qty_nos: parseFloat(formData.inspectionInfo.inspectionQuantity || "0"),
        total_rejected_qty: totalRejectionQty,
        vs_pdir_qty_after_rejection: acceptedQty,
        
        // Rejection details child table - use the correct field name for the child table
        items: items
      };
      
      console.log("Creating Inspection Entry with payload:", docObject);
      
      // Call the API with the correct format
      const response = await fetch("/api/method/frappe.desk.form.save.savedocs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          doc: JSON.stringify(docObject),
          action: "Save"
        }),
      });
      
      const result = await response.json();
      console.log("Inspection Entry API response:", result);
      
      // Check if the document was created successfully
      if (result.docs && result.docs[0]) {
        console.log("Inspection Entry created successfully:", result.docs[0].name);
        return {
          success: true,
          name: result.docs[0].name
        };
      } else {
        // Handle error from API response
        let errorMessage = "Unknown error creating inspection entry";
        
        if (result._server_messages) {
          try {
            const messages = JSON.parse(result._server_messages);
            if (messages && messages.length > 0) {
              try {
                const firstMessage = JSON.parse(messages[0]);
                errorMessage = firstMessage.message || messages[0];
              } catch {
                errorMessage = messages[0].replace(/["\\{}\[\]]/g, '');
              }
            }
          } catch {
            errorMessage = result._server_messages;
          }
        } else if (result.exception) {
          errorMessage = result.exception;
        } else if (result._exc_source) {
          errorMessage = `Error in ${result._exc_source}: ${result.exception || "Unknown error"}`;
        }
        
        console.error("Error creating Inspection Entry:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error("Exception creating Inspection Entry:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
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
      console.log("BOM Operations:", bomOperations);
      console.log("Operations String:", operationsString);
      
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
  
          console.log("Creating Lot Resource Tagging with payload:", payload);
  
          const response = await fetch("/api/method/spp.api.create_lot_resource_tagging", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });
  
          const result = await response.json();
          console.log("API response:", result);
  
          // Check the structure of the response to determine success/failure
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
                    errorMessage = messages[0].replace(/["\\{}\[\]]/g, '');
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
          console.error("Error in creating Lot Resource Tagging:", error);
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
  
      console.log("Lot Resource Tagging creation results:", creationResults);
  
      const allSuccessful = creationResults.every((result) => result.success);
  
      if (allSuccessful) {
        console.log("All Lot Resource Tagging entries created successfully");
        setProcessingStatus("All entries created successfully!");
      } else {
        const failedOps = creationResults.filter((result) => !result.success);
        console.error("Failed to create some Lot Resource Tagging entries:", failedOps);
        
        // Create a more detailed error message
        const errorDetails = failedOps.map(op => 
          `${op.operation} (${op.employee}): ${op.error}`
        ).join('\n');
        
        setScanError(`Failed to create entries: ${errorDetails}`);
      }
  
      return creationResults;
    } catch (error) {
      console.error("Error saving to ERPNext:", error);
      setScanError(`Error saving to ERPNext: ${error instanceof Error ? error.message : "Unknown error"}`);
      return [];
    } finally {
      setIsLoading(false);
      setSavingEntries(false);
    }
  };

  const handleSave = async (): Promise<FormattedData | undefined> => {
    console.log("Saving data...");
    
    // Validate employee barcode is present and in correct format
    const empBarcodeValidation = validateEmployeeBarcode(employeeBarcode);
    if (!empBarcodeValidation.isValid) {
      setScanError(empBarcodeValidation.message);
      return;
    }
    
    // Format data by sections
    const formattedData: FormattedData = {
      // Batch Information Section
      batchInfo: {
        sppBatchId: batchId,
        itemCode: itemCode,
        warehouse: warehouse,
        batchNo: batchNo,
        availableQuantity: quantity
      },
      
      // Operation Details Section
      operationDetails: operationDetails.map(op => ({
        operation: op.operationId,
        employeeCode: op.employeeCode,
        employeeName: op.employeeName
      })),
      
      // Inspection Section
      inspectionInfo: {
        inspectionQuantity: inspectionQty,
        inspectorCode: scannedEmployee?.code || employeeBarcode,
        inspectorName: scannedEmployee?.name || ""
      },
      
      // Rejection Details Section
      rejectionDetails: rejectionDetails
        .filter(r => parseFloat(r.qty) > 0) // Only include rejections with qty > 0
        .map(r => ({
          rejectionType: r.type,
          quantity: r.qty
        }))
    };
    
    // Calculate total rejected quantity
    const totalRejectionQty = rejectionDetails.reduce((sum, item) => {
      return sum + (parseFloat(item.qty) || 0);
    }, 0);
    
    // Calculate accepted quantity
    const acceptedQty = Math.max(0, parseFloat(inspectionQty) - totalRejectionQty);
    
    // Add summary calculations
    formattedData.summary = {
      totalInspected: inspectionQty,
      totalRejected: totalRejectionQty.toString(),
      acceptedQuantity: acceptedQty.toString(),
      rejectionPercentage: inspectionQty ? 
        ((totalRejectionQty / parseFloat(inspectionQty)) * 100).toFixed(2) + "%" : 
        "0%"
    };
    
    // Log nicely formatted data to console
    console.log("Formatted Form Data:");
    console.log(JSON.stringify(formattedData, null, 2));
    
    // Validation before saving
    if (!formattedData.batchInfo.sppBatchId) {
      setScanError("Please scan a batch ID before saving");
      return;
    }
    
    if (formattedData.operationDetails.length === 0) {
      setScanError("Please add at least one operation detail before saving");
      return;
    }
    
    // Reset loading states before starting
    setIsLoading(true);
    setValidatingLot(true);
    setSavingEntries(false);
    setCreatingInspection(false);
    setSaveProgress(0);
    setProcessingStatus("Validating lot number...");
    setScanError("");
    
    try {
      console.log("Validating lot number:", formattedData.batchInfo.sppBatchId);
      
      const validationResponse = await fetch("/api/method/shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging.validate_lot_number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          barcode: formattedData.batchInfo.sppBatchId
        }),
      });
      
      const validationResult = await validationResponse.json();
      console.log("Lot validation result:", validationResult);
      
      // Check if validation was successful
      if (validationResult.message && validationResult.message.status === "failed") {
        setValidatingLot(false);
        setScanError(`Lot validation failed: ${validationResult.message.message || "Unknown error"}`);
        setIsLoading(false);
        setProcessingStatus("");
        return;
      }
      
      // Update status after successful validation
      setValidatingLot(false);
      setSavingEntries(true);
      setProcessingStatus("Creating lot resource tagging entries...");
      
      // Extract BOM operations data from validation result
      let bomOperations: string[] = [];
      if (validationResult.message && 
          validationResult.message.bom_operations && 
          Array.isArray(validationResult.message.bom_operations)) {
        bomOperations = validationResult.message.bom_operations.map((op: { operation: string }) => op.operation);
      }
      
      // First step: If validation passes, proceed with saving Lot Resource Tagging entries
      const results = await handleSaveToERPNext(formattedData, bomOperations, validationResult.message);
      
      // Second step: If Lot Resource Tagging was successful, create Inspection Entry
      if (results.length > 0 && results.every(r => r.success)) {
        setSavingEntries(false);
        setCreatingInspection(true);
        setProcessingStatus("Creating inspection entry...");
        
        const inspectionResult = await handleCreateInspectionEntry(formattedData, validationResult.message);
        
        setCreatingInspection(false);
        setIsLoading(false);
        
        if (inspectionResult.success) {
          // Success message for both operations
          setProcessingStatus("All entries created successfully!");
          setShowSuccessNotification(true);
          
          // Auto-hide the success message after 3 seconds
          setTimeout(() => {
            setProcessingStatus("");
            setShowSuccessNotification(false);
          }, 3000);
        } else {
          // Handle inspection entry creation failure
          setScanError(`Failed to create inspection entry: ${inspectionResult.error}`);
        }
      } else {
        // Handle lot resource tagging failure
        setSavingEntries(false);
        setIsLoading(false);
        setProcessingStatus("");
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error validating lot number:", error);
      setScanError(`Error validating lot: ${error instanceof Error ? error.message : "Unknown error"}`);
      setValidatingLot(false);
      setSavingEntries(false);
      setCreatingInspection(false);
      setIsLoading(false);
      setProcessingStatus("");
      return undefined;
    }
  };

  // UI Components
  const LoadingOverlay = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{processingStatus}</h3>
            
            {validatingLot && (
              <div className="w-full mt-4">
                <div className="flex items-center mb-2">
                  <Search className="h-4 w-4 text-blue-500 mr-2" />
                  <p className="text-sm text-gray-600">Validating lot number</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full animated-gradient rounded-full"></div>
                </div>
              </div>
            )}
            
            {savingEntries && (
              <div className="w-full mt-4">
                <div className="flex items-center mb-2">
                  <PlusCircle className="h-4 w-4 text-blue-500 mr-2" />
                  <p className="text-sm text-gray-600">Creating entries</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${saveProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-right mt-1">{Math.round(saveProgress)}%</p>
              </div>
            )}
            
            {creatingInspection && (
              <div className="w-full mt-4">
                <div className="flex items-center mb-2">
                  <Clipboard className="h-4 w-4 text-blue-500 mr-2" />
                  <p className="text-sm text-gray-600">Creating inspection entry</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full animated-gradient rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SuccessNotification = () => {
    if (!showSuccessNotification) return null;
    
    return (
      <div className="fixed top-4 right-4 bg-white border-l-4 border-green-500 shadow-lg rounded p-4 z-50">
        <div className="flex">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">Success!</p>
            <p className="text-sm text-gray-600">All entries created successfully</p>
          </div>
          <button 
            className="ml-auto text-gray-400 hover:text-gray-500"
            onClick={() => setShowSuccessNotification(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const ErrorNotification = () => {
    if (!scanError) return null;
    
    return (
      <div className="mb-4 p-4 bg-white border-l-4 border-red-500 rounded shadow">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">Error</p>
            <p className="text-sm text-gray-600">{scanError}</p>
          </div>
          <button 
            className="ml-auto text-gray-400 hover:text-gray-500"
            onClick={() => setScanError("")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="w-full min-h-screen bg-slate-50 p-4">
      <style>{animationStyles}</style>
      
      <LoadingOverlay />
      <SuccessNotification />
      
      {/* Remove max-width constraint to use full width */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
          <div className="bg-blue-600 p-4 md:p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center">
                <Layers className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                Sub Lot Processing
              </h1>
              
              {/* Status message */}
              {processingStatus && !isLoading && (
                <div className="px-3 py-1 bg-blue-500 rounded-full text-sm text-white">
                  {processingStatus}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            {/* Error display */}
            <ErrorNotification />
            
            {/* Batch Information Section */}
            <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="px-4 py-3 bg-blue-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 flex items-center">
                  <BarChart2 className="mr-2 h-4 w-4 text-blue-500" />
                  Batch Information
                </h3>
              </div>
              
              <div className="p-4">
                {/* First Row - Scan Batch - use full width grid */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="scan-spp">
                      Scan SPP Batch:
                    </label>
                    <div className="lg:col-span-4 flex gap-2">
                      <Input 
                        id="scan-spp" 
                        placeholder="Batch ID" 
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-300" 
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        onClick={handleScanBatch}
                        disabled={!batchId || isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="batch-no">
                      Batch No:
                    </label>
                    <Input 
                      id="batch-no" 
                      placeholder="Batch No" 
                      className="lg:col-span-4 p-2 bg-slate-50 border rounded" 
                      value={batchNo}
                      readOnly
                    />
                  </div>
                </div>
                
                {/* Second & Third rows follow similar pattern */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="item-code">
                      Item Code:
                    </label>
                    <Input 
                      id="item-code" 
                      placeholder="Item Code" 
                      className="lg:col-span-4 p-2 bg-slate-50 border rounded" 
                      value={itemCode}
                      readOnly
                    />
                    
                    <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="warehouse">
                      Warehouse:
                    </label>
                    <Input 
                      id="warehouse" 
                      placeholder="Warehouse" 
                      className="lg:col-span-4 p-2 bg-slate-50 border rounded" 
                      value={warehouse}
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <label className="lg:col-span-2 text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="qty">
                      Available Qty:
                    </label>
                    <Input 
                      id="qty" 
                      placeholder="Available Quantity" 
                      className="lg:col-span-4 p-2 bg-slate-50 border rounded" 
                      value={quantity}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Two-column layout for Employee/Operations and Inspection/Rejections 
                 Update to ensure full width and responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-6">
              {/* Left Column - Employee and Operations */}
              <div className="space-y-4 w-full">
                {/* Employee Scanning Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-indigo-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                      <UserCheck className="mr-2 h-4 w-4 text-indigo-500" />
                      Employee Information
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium whitespace-nowrap text-slate-700 w-1/3" htmlFor="scan-emp">
                        Scan Employee:
                      </label>
                      <div className="flex gap-2 w-2/3">
                        <Input 
                          id="scan-emp" 
                          placeholder="Employee ID (e.g., PC-0001)" 
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300" 
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                          onClick={handleScanEmployee}
                          disabled={!employeeId}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Operation Information Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="px-4 py-3 bg-indigo-500 text-white">
                    <h3 className="font-semibold flex items-center justify-center">
                      <Clipboard className="mr-2 h-4 w-4" />
                      Operation Details
                    </h3>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-indigo-50">
                          <TableHead className="font-semibold text-indigo-600">Operation</TableHead>
                          <TableHead className="font-semibold text-indigo-600">Employee Code</TableHead>
                          <TableHead className="font-semibold text-indigo-600">Employee Name</TableHead>
                          <TableHead className="font-semibold text-indigo-600 w-16">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationDetails.length > 0 ? (
                          operationDetails.map((operation) => (
                            <TableRow key={operation.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <TableCell>{operation.operationId}</TableCell>
                              <TableCell>{operation.employeeCode}</TableCell>
                              <TableCell>{operation.employeeName}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full"
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
                                <Clipboard className="h-8 w-8 text-slate-300 mb-2" />
                                <p>No operations added yet</p>
                                <p className="text-xs text-slate-400">Scan employee code to add operation</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Inspection and Rejections */}
              <div className="space-y-4 w-full">
                {/* Inspection Information Section */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-blue-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />
                      Inspection Information
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="total-inspection">
                        Inspection Qty: <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        id="total-inspection" 
                        placeholder="Inspection Quantity" 
                        className={`flex-1 p-2 border rounded ${!inspectionQty ? "border-red-300" : ""} focus:ring-2 focus:ring-blue-300 focus:border-blue-300`}
                        value={inspectionQty}
                        onChange={(e) => setInspectionQty(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium whitespace-nowrap text-slate-700" htmlFor="emp-barcode">
                        Emp Barcode: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 flex-1">
                        <Input 
                          id="emp-barcode" 
                          placeholder="HR-EMP-00001" 
                          className={`flex-1 p-2 border rounded ${!employeeBarcode ? "border-red-300" : ""} focus:ring-2 focus:ring-blue-300 focus:border-blue-300`}
                          value={employeeBarcode}
                          onChange={(e) => setEmployeeBarcode(e.target.value)}
                          required
                        />
                        <Button 
                          variant="outline" 
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                          onClick={handleScanEmployeeBarcode}
                          disabled={!employeeBarcode || isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show employee info if available */}
                    {scannedEmployee && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-blue-700">{scannedEmployee.name}</span>
                          </div>
                          <div>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              {scannedEmployee.code}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rejection Information Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="px-4 py-3 bg-amber-500 text-white">
                    <h3 className="font-semibold flex items-center justify-center">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Rejection Details
                    </h3>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50">
                          <TableHead className="font-semibold text-amber-700">S.No</TableHead>
                          <TableHead className="font-semibold text-amber-700">Rejection Type</TableHead>
                          <TableHead className="font-semibold text-amber-700">Rejection Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectionDetails.map((rejection) => (
                          <TableRow key={rejection.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <TableCell>{rejection.id}</TableCell>
                            <TableCell>{rejection.type}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={rejection.qty}
                                onChange={(e) => {
                                  const newRejections = [...rejectionDetails];
                                  const index = newRejections.findIndex(r => r.id === rejection.id);
                                  if (index !== -1) {
                                    newRejections[index].qty = e.target.value;
                                    setRejectionDetails(newRejections);
                                  }
                                }}
                                className="w-full p-1 text-sm border border-slate-200 rounded"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors flex items-center"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubLotProcessing;