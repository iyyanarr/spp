import frappe
from frappe.utils.nestedset import get_descendants_of

@frappe.whitelist(allow_guest=True)
def get_bom_details_by_item_code(item_code):

    if not item_code:
        frappe.throw("Item Code is required in parameters.")

    """
    Fetch all details of a BOM by its item_code.

    :param item_code: The item code for which BOM details are required
    :return: A dictionary containing BOM details
    """
    # Get the default BOM for the item
    default_bom = frappe.get_all(
        "BOM",
        filters={"item": item_code, "is_active": 1, "is_default": 1},
        fields=["name"],
        limit=1
    )
    if not default_bom:
        frappe.throw(f"No default BOM found for Item Code: {item_code}")

    # Fetch the BOM document
    bom_name = default_bom[0].get("name")
    bom_doc = frappe.get_doc("BOM", bom_name)

    # Prepare the BOM details
    bom_details = {
        "bom_name": bom_name,
        "item_name": bom_doc.item_name,
        "quantity": bom_doc.quantity,
        "currency": bom_doc.currency,
        "total_cost": bom_doc.total_cost,
        "operating_cost": bom_doc.operating_cost,
        "raw_material_cost": bom_doc.raw_material_cost,
        "scrap_material_cost": bom_doc.scrap_material_cost,
        "items": [
            {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "qty": item.qty,
                "uom": item.uom,
                "rate": item.rate,
                "amount": item.amount,
                "source_warehouse": item.source_warehouse,
                "has_bom": item.bom_no is not None,
                "next_bom": item.bom_no if item.bom_no else None,
            }
            for item in bom_doc.items
        ],
        "operations": bom_doc.operations,
        "scrap_items": bom_doc.scrap_items,
    }
    return bom_details

@frappe.whitelist(allow_guest=True)
def get_multi_level_bom(item_code, max_depth=5):
    """
    API to fetch the complete multi-level BOM for a given item_code.

    :param params: Dictionary containing the parameters, including item_code
    :param max_depth: Maximum depth of recursion to fetch nested BOMs
    :return: A dictionary containing the multi-level BOM hierarchy with details
    """
    try:
        # Parse the item_code from params
        # if isinstance(params, str):
        #     params = frappe.parse_json(params)
        # item_code = params.get("item_code")
        # if not item_code:
        #     frappe.throw("Item Code is required in parameters.")
        
        # Get the default BOM for the item
        default_bom = frappe.get_all(
            "BOM", 
            filters={"item": item_code, "is_active": 1, "is_default": 1},
            fields=["name"],
            limit=1
        )
        if not default_bom:
            frappe.throw(f"No default BOM found for Item Code: {item_code}")
        
        # Recursively fetch BOM details
        bom_data = fetch_bom_details(default_bom[0].get("name"), level=1, max_depth=max_depth)
        
        return {
            "item_code": item_code,
            "default_bom": default_bom[0].get("name"),
            "bom_data": bom_data,
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Multi-Level BOM Fetch Error")
        return {"error": str(e)}


def fetch_bom_details(bom_name, level, max_depth):
    """
    Recursively fetch BOM details for a given BOM name.

    :param bom_name: Name of the BOM
    :param level: Current depth level of recursion
    :param max_depth: Maximum depth allowed for recursion
    :return: A dictionary with BOM details and nested child BOMs
    """
    if level > max_depth:
        return {"message": f"Max recursion depth of {max_depth} reached for BOM {bom_name}"}
    
    # Fetch the BOM document
    bom_doc = frappe.get_doc("BOM", bom_name)
    
    # Fetch flattened raw material details at this BOM level
    raw_materials = []
    for item in bom_doc.items:
        raw_materials.append({
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": item.qty,
            "uom": item.uom,
            "rate": item.rate,
            "amount": item.amount,
            "source_warehouse": item.source_warehouse,
            "has_bom": item.bom_no is not None,
            "next_bom": item.bom_no if item.bom_no else None,
        })
    
    # Recursively fetch child BOMs
    child_boms = []
    for material in raw_materials:
        if (material.get("has_bom") and material.get("next_bom")):
            child_boms.append(fetch_bom_details(material.get("next_bom"), level=level + 1, max_depth=max_depth))
    
    # Prepare the BOM data for this level
    bom_data = {
        "bom_name": bom_name,
        "item_name": bom_doc.item_name,
        "quantity": bom_doc.quantity,
        "currency": bom_doc.currency,
        "total_cost": bom_doc.total_cost,
        "operating_cost": bom_doc.operating_cost,
        "raw_material_cost": bom_doc.raw_material_cost,
        "scrap_material_cost": bom_doc.scrap_material_cost,
        "items": raw_materials,
        "operations": bom_doc.operations,
        "scrap_items": bom_doc.scrap_items,
        "child_boms": child_boms
    }
    
    return bom_data

@frappe.whitelist()
def create_lot_resource_tagging():
    """
    Custom API to create Lot Resource Tagging documents.
    :return: A dictionary with the result of the operation.
    """
    try:
        # Retrieve 'data' from frappe.form_dict
        data = frappe.form_dict.get("data")
        if not data:
            frappe.throw("Missing 'data' parameter in the request.")

        # Print raw data for debugging
        print("Raw data received:", data)

        # Log raw data with shorter title
        frappe.log_error(message=f"Raw data: {data}", title="LRT Debug")

        # Parse 'data' if it's a JSON string
        if isinstance(data, str):
            data = frappe.parse_json(data)
            
        # Print parsed data for debugging
        print("Parsed data:", data)

        # Validate required fields
        required_fields = ["scan_lot_no", "scan_operator", "operation_type"]
        for field in required_fields:
            if not data.get(field):
                frappe.throw(f"Missing required field: {field}")

        # Additional validation for scan_operator
        if not frappe.db.exists("Employee", data["scan_operator"]):
            frappe.throw(f"Invalid Operator ID: {data['scan_operator']}")
            
        # First call validate_lot_number to get the BOM operations
        from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import validate_lot_number
        
        try:
            # This will validate the lot number and provide BOM operations
            validation_result = validate_lot_number(data["scan_lot_no"], data["operation_type"])
            print("Validation result:", validation_result)
            
            # If validation failed, throw an error
            if isinstance(validation_result, dict) and validation_result.get('status') == 'failed':
                frappe.throw(validation_result.get('message', 'Validation failed'))
                
        except Exception as validation_error:
            frappe.log_error(message=f"Validation error: {str(validation_error)}", 
                          title="LRT Validation Error")
            frappe.throw(f"Validation error: {str(validation_error)}")

        # Import current date function
        from frappe.utils import today
        
        # Create the document with parameters including all required fields
        doc_data = {
            "doctype": "Lot Resource Tagging",
            "scan_lot_no": data["scan_lot_no"],
            "operator_id": data["scan_operator"],
            "scan_operator": data["scan_operator"],
            "operation_type": data["operation_type"],
            "operations": data.get("operations", ""),
            "product_ref": data.get("product_ref", ""),
            "bom_no": data.get("bom_no", ""),
            
            # Add the missing mandatory fields
            "batch_no": data.get("batch_no", data["scan_lot_no"]),  # Use scan_lot_no as fallback
            "available_qty": data.get("available_qty", "1"),  # Default to 1 if not provided
            "posting_date": data.get("posting_date", today()),  # Use current date as fallback
            "qtynos": data.get("qtynos", "1"),  # Default to 1 if not provided
            
            "docstatus": 0  # Draft
        }
        
        # Log the final document data before creation
        frappe.log_error(message=f"Doc data: {doc_data}", title="LRT Creation")
        
        # Create the document
        doc = frappe.get_doc(doc_data)
        doc.insert()
        frappe.db.commit()

        return {"success": True, "name": doc.name}

    except Exception as e:
        error_traceback = frappe.get_traceback()
        print("Error creating Lot Resource Tagging:", error_traceback)
        frappe.log_error(message=error_traceback, title="LRT API Error")
        return {"success": False, "error": str(e)}


# sublot Processing 

@frappe.whitelist()
def process_lot(data):
    """
    Process lot data from the frontend, creating all necessary records
    
    Args:
        data (dict): Formatted data from the frontend containing:
            - batchInfo: Batch identification data
            - operationDetails: List of operations performed
            - inspectionInfo: Inspection data
            - rejectionDetails: List of rejection details
            - summary: Processing summary statistics
    
    Returns:
        dict: Result of the processing
    """
    try:
        # Log received data
        frappe.log_error(message=f"Received data: {data}", title="Process Lot")
        
        # Parse data if it's a string
        if isinstance(data, str):
            data = frappe.parse_json(data)
        
        # Extract data sections
        batch_info = data.get("batchInfo", {})
        operation_details = data.get("operationDetails", [])
        inspection_info = data.get("inspectionInfo", {})
        rejection_details = data.get("rejectionDetails", [])
        summary = data.get("summary", {})
        
        # Validate the lot number first
        from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import validate_lot_number
        lot_validation = validate_lot_number(batch_info.get("sppBatchId"))
        
        if isinstance(lot_validation, dict) and lot_validation.get('status') == 'failed':
            return {"success": False, "error": lot_validation.get('message', 'Lot validation failed')}
        
        # Initialize counters for created documents
        sub_lots_created = 0
        operations_created = 0
        inspections_created = 0
        
        # 1. First step: Create Sub Lot Creation document or use original lot
        try:
            sub_lot_result = create_sub_lot_entry(
                batch_info,
                inspection_info,
                lot_validation
            )
            
            # Check if we created a new sub-lot or using the original lot
            if hasattr(sub_lot_result, 'name') and not isinstance(sub_lot_result, dict):
                # A new sub-lot document was created
                sub_lot = sub_lot_result
                sub_lots_created = 1
                frappe.log_error(message=f"Sub Lot created: {sub_lot.name}", title="Process Lot - Sub Lot Creation")
                
                # Update batch_info with ALL relevant sub-lot values for downstream processing
                batch_info["sppBatchId"] = sub_lot.sub_lot_no
                batch_info["batchNo"] = sub_lot.batch_no
                batch_info["availableQuantity"] = str(sub_lot.qty)  # Use qty from sub_lot
                batch_info["warehouse"] = sub_lot.warehouse
                
                # Log the updated batch info
                frappe.log_error(
                    message=f"Updated batch info with sub-lot values: {batch_info}", 
                    title="Process Lot - Batch Info Update"
                )
            else:
                # Using original lot, no new document created
                sub_lot = sub_lot_result
                # Keep sub_lots_created at 0
                frappe.log_error(message=f"Using original lot: {sub_lot.get('sub_lot_no')}", title="Process Lot - Using Original Lot")
                
                # Ensure sppBatchId is updated
                batch_info["sppBatchId"] = sub_lot.get("sub_lot_no")
        
        except Exception as e:
            frappe.log_error(
                message=f"Error processing lot: {str(e)}\n{frappe.get_traceback()}", 
                title="Process Lot - Sub Lot Error"
            )
            return {"success": False, "error": f"Error creating/processing lot: {str(e)}"}
        
        # 2. Create Lot Resource Tagging entries for each operation
        for operation in operation_details:
            try:
                lot_resource = create_lot_resource_entry(
                    batch_info, 
                    operation,
                    lot_validation
                )
                operations_created += 1
            except Exception as e:
                frappe.log_error(
                    message=f"Error creating resource tagging: {str(e)}\n{frappe.get_traceback()}", 
                    title="Process Lot - Resource Tagging Error"
                )
                return {"success": False, "error": f"Error creating operation entry: {str(e)}"}
        
        # 3. Create Inspection Entry if needed
        if inspection_info.get("inspectionQuantity"):
            try:
                inspection = create_inspection_entry(
                    batch_info,
                    inspection_info,
                    rejection_details,
                    summary,
                    lot_validation
                )
                inspections_created += 1
            except Exception as e:
                frappe.log_error(
                    message=f"Error creating inspection: {str(e)}\n{frappe.get_traceback()}", 
                    title="Process Lot - Inspection Error"
                )
                return {"success": False, "error": f"Error creating inspection entry: {str(e)}"}
        
        # Return success response with counts
        return {
            "success": True, 
            "sub_lots_created": sub_lots_created,
            "operations_created": operations_created,
            "inspections_created": inspections_created,
            "message": "Lot processing completed successfully"
        }
            
    except Exception as e:
        error_traceback = frappe.get_traceback()
        frappe.log_error(message=error_traceback, title="Process Lot Error")
        return {"success": False, "error": str(e)}


def create_lot_resource_entry(batch_info, operation, validation_data):
    """Create a Lot Resource Tagging entry using sub-lot information"""
    
    # Log the batch info to ensure we're using updated values
    frappe.log_error(
        message=f"Creating LRT with batch info: {batch_info}", 
        title="LRT Batch Info"
    )
    
    doc_data = {
        "doctype": "Lot Resource Tagging",
        "scan_lot_no": batch_info.get("sppBatchId"),  # Will be sub_lot_no if created
        "operator_id": operation.get("employeeCode"),
        "scan_operator": operation.get("employeeCode"),
        "operation_type": operation.get("operation"),
        "operations": validation_data.get("operations", ""),
        "product_ref": batch_info.get("itemCode"),
        "bom_no": validation_data.get("bom_no", ""),
        "batch_no": batch_info.get("batchNo"),  # Updated with sub_lot batch_no
        "available_qty": batch_info.get("availableQuantity", "0"),  # Updated with sub_lot qty
        "posting_date": frappe.utils.today(),
        "qtynos": batch_info.get("availableQuantity", "0"),  # Updated with sub_lot qty
        "docstatus": 0  # Draft
    }
    
    # Log the document data before creation
    frappe.log_error(
        message=f"LRT doc data: {doc_data}", 
        title="LRT Creation"
    )
    
    doc = frappe.get_doc(doc_data)
    doc.insert()
    return doc


def create_inspection_entry(batch_info, inspection_info, rejection_details, summary, validation_data):
    """Create an Inspection Entry with sub-lot values"""
    
    # Log the batch info to ensure we're using updated values
    frappe.log_error(
        message=f"Creating Inspection with batch info: {batch_info}", 
        title="Inspection Batch Info"
    )
    
    # Calculate total rejected quantity
    total_rejected = float(summary.get("totalRejected", 0))
    total_inspected = float(inspection_info.get("inspectionQuantity", 0))
    accepted_qty = float(summary.get("acceptedQuantity", 0))
    
    # Format items for child table
    items = []
    
    # Add rejection items - using the updated batch_info values
    for rejection in rejection_details:
        items.append({
            "type_of_defect": rejection.get("rejectionType"),
            "rejected_qty": float(rejection.get("quantity", 0)),
            "product_ref_no": batch_info.get("itemCode"),
            "batch_no": batch_info.get("batchNo"),  # Updated with sub_lot batch_no
            "lot_no": batch_info.get("sppBatchId"),  # Updated with sub_lot_no
            "inspector_code": inspection_info.get("inspectorCode"),
            "inspector_name": inspection_info.get("inspectorName")
        })
    
    # Add accepted item if any - using the updated batch_info values
    if accepted_qty > 0:
        items.append({
            "type_of_defect": "ACCEPTED",
            "rejected_qty": accepted_qty,
            "product_ref_no": batch_info.get("itemCode"),
            "batch_no": batch_info.get("batchNo"),  # Updated with sub_lot batch_no
            "lot_no": batch_info.get("sppBatchId"),  # Updated with sub_lot_no
            "inspector_code": inspection_info.get("inspectorCode"),
            "inspector_name": inspection_info.get("inspectorName")
        })
    
    # Create inspection document - using the updated batch_info values
    doc_data = {
        "doctype": "Inspection Entry",
        "inspection_type": "Final Visual Inspection",
        "posting_date": frappe.utils.today(),
        "lot_no": batch_info.get("sppBatchId"),  # Updated with sub_lot_no
        "scan_production_lot": batch_info.get("sppBatchId"),  # Updated with sub_lot_no
        "product_ref_no": batch_info.get("itemCode"),
        "spp_batch_number": batch_info.get("sppBatchId"),  # Updated with sub_lot_no
        "batch_no": batch_info.get("batchNo"),  # Updated with sub_lot batch_no
        "inspector_name": inspection_info.get("inspectorName"),
        "inspector_code": inspection_info.get("inspectorCode"),
        "scan_inspector": inspection_info.get("inspectorCode"),
        "source_warehouse": batch_info.get("warehouse"),  # This should be updated too
        "vs_pdir_qty": float(batch_info.get("availableQuantity", 0)),  # Updated with sub_lot qty
        "total_inspected_qty_nos": total_inspected,
        "total_rejected_qty": total_rejected,
        "vs_pdir_qty_after_rejection": accepted_qty,
        "items": items
    }
    
    # Log the document data before creation
    frappe.log_error(
        message=f"Inspection doc data: {doc_data}", 
        title="Inspection Creation"
    )
    
    doc = frappe.get_doc(doc_data)
    doc.insert()
    return doc

def create_sub_lot_entry(batch_info, inspection_info, validation_data):
    """
    Create a Sub Lot Creation entry based on quantity comparison:
    - If inspection qty < available qty: Create sub-lot with -1 suffix
    - If inspection qty == available qty: Don't create sub-lot, use original lot
    - If inspection qty > available qty: Do stock reconciliation, then continue
    """
    
    original_lot_no = batch_info.get("sppBatchId")
    posting_date = frappe.utils.today()
    
    # Extract and convert quantities to float for comparison
    available_qty = float(batch_info.get("availableQuantity", "0"))
    inspection_qty = float(inspection_info.get("inspectionQuantity", "0"))
    
    # Initialize sub_lot to None (in case we don't create one)
    sub_lot = None
    sub_lots_created = 0
    
    # CASE 1: If inspection quantity equals available quantity, don't create sub-lot
    if abs(inspection_qty - available_qty) < 0.001:  # Use small epsilon for float comparison
        frappe.log_error(
            message=f"Inspection qty ({inspection_qty}) equals available qty ({available_qty}). Using original lot.",
            title="Process Lot - Using Original Lot"
        )
        # Just return basic information without creating a new document
        return {
            "name": original_lot_no,
            "sub_lot_no": original_lot_no,  # Same as original
            "is_original": True
        }
    
    # CASE 2: If inspection quantity > available quantity, perform stock reconciliation
    elif inspection_qty > available_qty:
        frappe.log_error(
            message=f"Inspection qty ({inspection_qty}) > available qty ({available_qty}). Performing stock reconciliation.",
            title="Process Lot - Stock Reconciliation"
        )
        
        # Perform stock reconciliation for the warehouse and item
        try:
            reconcile_stock(
                item_code=batch_info.get("itemCode"),
                warehouse=batch_info.get("warehouse"),
                batch_no=batch_info.get("batchNo"),
                qty=inspection_qty,
                valuation_rate=None  # Use existing valuation rate
            )
            
            # Update available quantity to match inspection quantity after reconciliation
            available_qty = inspection_qty
            batch_info["availableQuantity"] = str(inspection_qty)
            
            frappe.log_error(
                message=f"Stock reconciled. New available qty: {inspection_qty}",
                title="Process Lot - Stock Reconciliation Complete"
            )
        except Exception as e:
            frappe.log_error(
                message=f"Error during stock reconciliation: {str(e)}\n{frappe.get_traceback()}",
                title="Process Lot - Stock Reconciliation Failed"
            )
            raise e
    
    # CASE 3: Inspection quantity < available quantity, create sub-lot
    if inspection_qty < available_qty:
        # Generate sub lot number by adding -1 to the original lot number
        sub_lot_no = f"{original_lot_no}-1"
        
        # Generate barcode image
        barcode_path = generate_barcode_for_sublot(sub_lot_no)
        
        # Create document data
        doc_data = {
            "doctype": "Sub Lot Creation",
            "scan_lot_no": original_lot_no,
            "sub_lot_no": sub_lot_no,
            "item_code": batch_info.get("itemCode"),
            "batch_no": batch_info.get("batchNo"),
            "posting_date": posting_date,
            "available_qty": available_qty,
            "warehouse": batch_info.get("warehouse"),
            "qty": inspection_qty,
            "available_qty_kgs": 0,  # Default to 0 as per example
            "stock_entry_reference": validation_data.get("name", ""),
            "uom": "Nos",  # Default to Nos - adjust if needed
            "despatch_u1_parent": original_lot_no,
            "barcode_attach": barcode_path,
            "lrt_found": 0,
            "docstatus": 1  # Submit the document
        }
        
        # Create and insert the document
        doc = frappe.get_doc(doc_data)
        doc.insert()
        
        # Submit the document
        doc.submit()
        
        sub_lot = doc
        sub_lots_created = 1
        
        frappe.log_error(
            message=f"Created sub lot {sub_lot_no} with qty {inspection_qty} from original lot {original_lot_no} with qty {available_qty}",
            title="Process Lot - Sub Lot Creation"
        )
    
    return sub_lot

# Helper function for stock reconciliation
def reconcile_stock(item_code, warehouse, batch_no, qty, valuation_rate=None):
    """
    Create a Stock Reconciliation to adjust quantity
    """
    # Get current valuation rate if not provided
    if valuation_rate is None:
        # Query to get current valuation rate
        current_rate = frappe.db.sql("""
            SELECT valuation_rate 
            FROM `tabBatch` 
            WHERE name = %s
        """, (batch_no,), as_dict=True)
        
        if current_rate and current_rate[0].valuation_rate:
            valuation_rate = current_rate[0].valuation_rate
        else:
            # Fallback to item valuation rate
            valuation_rate = frappe.db.get_value("Item", item_code, "valuation_rate") or 1.0
    
    # Create Stock Reconciliation
    stock_recon = frappe.get_doc({
        "doctype": "Stock Reconciliation",
        "purpose": "Stock Reconciliation",
        "items": [{
            "item_code": item_code,
            "warehouse": warehouse,
            "batch_no": batch_no,
            "qty": qty,
            "valuation_rate": valuation_rate
        }]
    })
    
    stock_recon.insert()
    stock_recon.submit()
    
    frappe.db.commit()
    
    return stock_recon

def generate_barcode_for_sublot(sub_lot_no):
    """Generate a barcode image for the sub lot number and return the file path"""
    try:
        import io
        import os
        from PIL import Image
        import barcode
        from barcode.writer import ImageWriter
        
        # Create the barcode (Code128 is a common format)
        code128 = barcode.get('code128', sub_lot_no, writer=ImageWriter())
        
        # Create a buffer to hold the image
        buffer = io.BytesIO()
        code128.write(buffer)
        
        # Create a PIL Image from the buffer
        buffer.seek(0)
        image = Image.open(buffer)
        
        # Save the image to a BytesIO object for uploading
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        # Upload the image to Frappe
        filename = f"{sub_lot_no}.png"
        file_url = frappe.utils.file_manager.save_file(
            filename,
            output_buffer.getvalue(),
            "Sub Lot Creation",
            sub_lot_no,
            is_private=0
        ).file_url
        
        return file_url
    except Exception as e:
        frappe.log_error(message=f"Error generating barcode: {str(e)}", title="Barcode Generation Error")
        # Return a placeholder if barcode generation fails
        return ""

