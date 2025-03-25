import frappe
from frappe.utils.nestedset import get_descendants_of


@frappe.whitelist()
def process_lot(data):
    """
    Process lot data from the frontend, creating only the sub lot
    """
    try:
        # Parse and extract data 
        if isinstance(data, str):
            data = frappe.parse_json(data)
        
        batch_info = data.get("batchInfo", {})
        inspection_info = data.get("inspectionInfo", {})
        operations = data.get("operationDetails")
        
        # Initialize counters
        sub_lots_created = 0
        
        # Log received data
        frappe.log_error(message=f"Processing lot (simplified): {batch_info.get('sppBatchId')}", 
                        title="Process Lot - Start")
        
        # STEP 1: Validate the lot number first
        from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import validate_lot_number
        
        # Basic validation first
        lot_validation = validate_lot_number(batch_info.get("sppBatchId"))
        
        # STEP 2: Create Sub Lot (the ONLY operation now)
        try:
            # This creates sub lot based on inspection quantity vs available quantity
            sub_lot_result = create_sub_lot_entry(batch_info, inspection_info),
            
            # Determine if we created a new sub-lot or using original lot
            if hasattr(sub_lot_result, 'name') and hasattr(sub_lot_result, 'sub_lot_no'):
                # A new sub-lot document was created
                sub_lot = sub_lot_result
                sub_lots_created = 1
                
                frappe.log_error(message=f"Created new sub-lot: {sub_lot.sub_lot_no} {lot_validation}", 
                                title="Process Lot - Sub Lot Created")
                
                # Return success with sub-lot info
                return {
                    "success": True, 
                    "sub_lots_created": sub_lots_created,
                    "sub_lot_no": sub_lot.sub_lot_no,
                    "batch_no": sub_lot.batch_no,
                    "qty": sub_lot.qty,
                    "qty_kgs": sub_lot.available_qty_kgs,
                    "message": f"Sub lot {sub_lot.sub_lot_no} created successfully"
                }
                
            elif isinstance(sub_lot_result, dict) and sub_lot_result.get("sub_lot_no"):
                # Using original lot, no new document created
                frappe.log_error(message=f"Using original lot: {sub_lot_result.get('sub_lot_no')}", 
                                title="Process Lot - Using Original Lot")
                
                # Return success with original lot info
                sub_data = {
                    "success": True, 
                    "sub_lots_created": 0,
                    "sub_lot_no": sub_lot_result.get("sub_lot_no"),
                    "batch_no": sub_lot_result.get("batch_no"),
                    "qty": sub_lot_result.get("qty"),
                    "qty_kgs": sub_lot_result.get("qty_kgs", 0),
                    "message": "Used original lot (no sub-lot created)"
                }
                return sub_data
                
            else:
                # Unexpected result type, log and return what we can
                frappe.log_error(message=f"Unexpected sub_lot_result: {sub_lot_result}", 
                                title="Process Lot - Unexpected Result")
                
                # Log operations if available
                # Try to log the sub_lot_result details
                if isinstance(sub_lot_result, tuple) and len(sub_lot_result) > 0:
                    sub_lot_result = sub_lot_result[0]  # Extract from tuple if needed
                
                # Log what type of result we received
                frappe.log_error(message=f"Sub lot result type: {type(sub_lot_result).__name__}", 
                                title="Process Lot - Result Type")
                
                # Try to get Sub Lot Creation document
                try:
                    if isinstance(sub_lot_result, str):
                        sub_lot_doc = frappe.get_doc("Sub Lot Creation", sub_lot_result)
                        frappe.log_error(message=f"Retrieved Sub Lot doc by name: {sub_lot_doc}", 
                                        title="Process Lot - Sub Lot Doc")
                    elif isinstance(sub_lot_result, dict) and sub_lot_result.get('name'):
                        sub_lot_doc = frappe.get_doc("Sub Lot Creation", sub_lot_result.get('name'))
                        frappe.log_error(message=f"Retrieved Sub Lot doc from dict: {sub_lot_doc.name}", 
                                        title="Process Lot - Sub Lot Doc")
                except Exception as doc_error:
                    frappe.log_error(message=f"Error retrieving Sub Lot doc: {str(doc_error)}", 
                                    title="Process Lot - Doc Retrieval Error")
                if operations:
                    for idx, op in enumerate(operations):
                        _create_resource_tags_for_operations(op['operation'],batch_info.get("sppBatchId"),op['employeeCode'])
                        frappe.log_error(message=f"Operation {idx+1}: {op['operation']}", 
                                        title="Process Lot - Operation Details")
                
                return {"success": True, "sublot": sub_lot_result}
                
        except Exception as e:
            frappe.log_error(
                message=f"Error creating sub lot: {str(e)}\n{frappe.get_traceback()}", 
                title="Process Lot - Sub Lot Error"
            )
            return {"success": False, "error": f"Error creating sub lot: {str(e)}"}
            
    except Exception as e:
        error_traceback = frappe.get_traceback()
        frappe.log_error(message=error_traceback, title="Process Lot Error")
        return {"success": False, "error": str(e)}
    
def create_sub_lot_entry(batch_info, inspection_info):
    """
    Create a Sub Lot Creation entry based on lot validation and quantity comparison.
    
    Args:
        batch_info (dict): Information about the batch including sppBatchId
        inspection_info (dict): Information from the inspection process
        operations (list): List of operations to be performed
        validation_data (dict, optional): Pre-validated data if available
        
    Returns:
        dict or object: Either the created sub_lot document or a status dictionary
    """
    try:
        # Extract and validate the batch ID
        original_lot_no = batch_info.get("sppBatchId")
        if not original_lot_no:
            frappe.log_error("Missing sppBatchId in batch_info", "Sub Lot Creation Error")
            return {"status": "failed", "message": "Missing batch ID"}
            
        frappe.log_error(f"Creating sub-lot for: {original_lot_no}", "Sub Lot Creation - Start")
        
        # Get lot data using validate_lot function
        lot_data = _get_lot_validation_data(original_lot_no)
        if isinstance(lot_data, dict) and lot_data.get("status") == "failed":
            return lot_data
        
        # Convert and compare quantities
        available_qty = float(lot_data.get("qty", 0))
        inspection_qty = float(inspection_info.get("inspectionQuantity", "0"))
        
        # Get KG conversion factor and calculate weight
        uom_conversion_factor = _get_kg_conversion_factor(lot_data.get("item_code"))
        inspection_qty_kg = (1.0 / uom_conversion_factor) * inspection_qty

        frappe.log_error(
            f"Converting inspection qty {inspection_qty} to KG: {inspection_qty} * (1/{uom_conversion_factor}) = {inspection_qty_kg}",
            "Sub Lot Creation - Quantity Conversion"
        )

        # If inspection quantity is less than available quantity, create sub-lot
        if inspection_qty < available_qty:
            # Create sub lot document
            sub_lot_doc = _create_sub_lot_document(
                original_lot_no, 
                lot_data, 
                inspection_qty, 
                inspection_qty_kg, 
                available_qty
            )
            
           
            return sub_lot_doc
        
        # No sub lot was created (fallback)
        return {
            "status": "success", 
            "message": "Process completed without creating sub lot",
            "sub_lot_no": original_lot_no
        }
        
    except Exception as e:
        frappe.log_error(
            f"Error in create_sub_lot_entry: {str(e)}\n{frappe.get_traceback()}",
            "Sub Lot Creation - Error"
        )
        return {"status": "failed", "message": str(e)}


def _get_lot_validation_data(lot_no):
    """
    Get validation data for a lot number.
    
    Args:
        lot_no (str): The lot number to validate
        
    Returns:
        dict: Validation data for the lot
    """
    from shree_polymer_custom_app.shree_polymer_custom_app.doctype.sub_lot_creation.sub_lot_creation import validate_lot
    
    # Save the current response state before calling validate_lot
    original_response = frappe.response.copy() if hasattr(frappe, 'response') else {}
    
    # Call validate_lot function to get lot data
    validate_lot(lot_no=lot_no, name=None)
    
    # Check if frappe.response was modified by validate_lot
    if not hasattr(frappe, 'response') or frappe.response == original_response:
        frappe.log_error(f"validate_lot did not modify frappe.response for {lot_no}", 
                       "Sub Lot Creation - Validation Failed")
        return {"status": "failed", "message": "Lot validation failed - no response data"}
    
    # Extract the response data
    response_data = frappe.response
    
    # Check for failure status
    if response_data.get('status') == "failed":
        frappe.log_error(f"validate_lot failed: {response_data.get('message')}", 
                       "Sub Lot Creation - Validation Failed")
        return {"status": "failed", "message": response_data.get('message', 'Validation failed')}
    
    # Extract lot data from the response
    lot_data = response_data.get('message', {})
    
    # Log the successful data retrieval
    frappe.log_error(f"Retrieved lot data for {lot_no}", "Sub Lot Creation - Data Retrieved")
    
    return lot_data
def _get_lot_res_validation_data(lot_no):
    """
    Get validation data for a lot number.
    
    Args:
        lot_no (str): The lot number to validate
        
    Returns:
        dict: Validation data for the lot
    """
    from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import validate_lot_number
    
    # Save the current response state before calling validate_lot
    original_response = frappe.response.copy() if hasattr(frappe, 'response') else {}
    
    # Call validate_lot function to get lot data
    validate_lot_number(barcode=lot_no)
    
    # Check if frappe.response was modified by validate_lot
    if not hasattr(frappe, 'response') or frappe.response == original_response:
        frappe.log_error(f"validate_lot did not modify frappe.response for {lot_no}", 
                       "Sub Lot Creation - Validation Failed")
        return {"status": "failed", "message": "Lot validation failed - no response data"}
    
    # Extract the response data
    response_data = frappe.response
    
    # Check for failure status
    if response_data.get('status') == "failed":
        frappe.log_error(f"validate_lot failed: {response_data.get('message')}", 
                       "Sub Lot Creation - Validation Failed")
        return {"status": "failed", "message": response_data.get('message', 'Validation failed')}
    
    # Extract lot data from the response
    lot_data = response_data.get('message', {})
    
    # Log the successful data retrieval
    frappe.log_error(f"Retrieved lot res tag  data for {lot_no}", " Lot res Creation - Data Retrieved")
    
    return lot_data

def _get_kg_conversion_factor(item_code):
    """
    Get the KG conversion factor for an item.
    
    Args:
        item_code (str): The item code
        
    Returns:
        float: Conversion factor for KG
    """
    uom_conversion_factor = 1.0
    
    if not item_code:
        return uom_conversion_factor
        
    try:
        item_doc = frappe.get_doc("Item", item_code)
        # Look for KG conversion in UOM conversion table
        for uom_row in item_doc.uoms:
            if uom_row.uom and uom_row.uom.lower() in ["kg", "kgs", "kilogram", "kilograms"]:
                uom_conversion_factor = float(uom_row.conversion_factor or 1.0)
                
                frappe.log_error(f"Found KG conversion factor: {uom_conversion_factor}", 
                                "Sub Lot Creation - UOM Conversion")
                break
        
        # If we didn't find a KG conversion, log it
        if uom_conversion_factor == 1.0:
            frappe.log_error(f"No KG conversion found for item {item_code}", 
                           "Sub Lot Creation - Missing UOM Conversion")
    except Exception as uom_error:
        frappe.log_error(f"Error fetching UOM conversion: {str(uom_error)}", 
                       "Sub Lot Creation - UOM Error")
    
    return uom_conversion_factor


def _create_sub_lot_document(original_lot_no, lot_data, inspection_qty, inspection_qty_kg, available_qty):
    """
    Create and submit a Sub Lot Creation document.
    
    Args:
        original_lot_no (str): The original lot number
        lot_data (dict): Validated lot data
        inspection_qty (float): Inspection quantity
        inspection_qty_kg (float): Inspection quantity in KG
        available_qty (float): Available quantity
        
    Returns:
        object: The created sub lot document
    """
    # Create a new Sub Lot Creation document
    sub_lot_doc = frappe.new_doc("Sub Lot Creation")
    
    # Set fields from lot_data
    sub_lot_doc.scan_lot_no = original_lot_no
    sub_lot_doc.item_code = lot_data.get("item_code")
    sub_lot_doc.batch_no = lot_data.get("batch_no")
    sub_lot_doc.posting_date = frappe.utils.today()
    sub_lot_doc.available_qty = available_qty
    sub_lot_doc.warehouse = lot_data.get("t_warehouse")
    sub_lot_doc.qty = inspection_qty_kg
    sub_lot_doc.uom = lot_data.get("stock_uom", "Nos")
    sub_lot_doc.first_parent_lot_no = lot_data.get("first_parent_lot_no")
    sub_lot_doc.material_receipt_parent = lot_data.get("material_receipt_parent")

    sub_lot_doc.insert()
    
    frappe.log_error(f"About to submit Sub Lot document {sub_lot_doc.name}", 
                   "Sub Lot Creation - Before Submit")
    
    # Submit will trigger the update_sublot method
    sub_lot_doc.submit()
    
    # Reload to get the generated sub_lot_no
    sub_lot_doc.reload()
    
    frappe.log_error(
        f"Created sub lot {sub_lot_doc.sub_lot_no} with qty {inspection_qty}, {inspection_qty_kg} kg from original lot {original_lot_no}",
        "Sub Lot Creation - Complete"
    )
    
    return sub_lot_doc.name


def _create_resource_tags_for_operations(operation, sub_lot_no, operator_id):
    """
    Create Lot Resource Tagging for operations.

    Args:
        operation (dict): Operation details
        sub_lot_no (str): Sub lot number to tag
        operator_id (str): Operator who performed the operation
        
    Returns:
        dict: Result of creating the resource tag
    """
    try:
        # Log the incoming arguments
        frappe.log_error(
            message=f"Creating resource tag - Operation: {operation}, Sub Lot: {sub_lot_no}, Operator: {operator_id}",
            title="Resource Tag - Arguments"
        )
        
        # Import the validation function
        from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import validate_lot_number
        
        # Validate the lot number and get lot details
        validation_result = _get_lot_res_validation_data(sub_lot_no)
        
        # Check if the validation result is valid
        if not validation_result:
            frappe.log_error(
                message=f"Validation result for lot {sub_lot_no}: {validation_result}",
                title="Resource Tag - Validation Failed"
            )
            return {"status": "failed", "message": "Validation failed or invalid response"}
        
        # Extract the message from the validation result
        lot_data = validation_result
        
        # Create the Lot Resource Tagging document
        lot_rt = frappe.new_doc("Lot Resource Tagging")
        
        # Set fields from validation result
        lot_rt.posting_date = frappe.utils.now()
        lot_rt.scan_lot_no = sub_lot_no
        lot_rt.scan_operator = operator_id
        lot_rt.operator_id = operator_id
        lot_rt.operation_type = operation
        lot_rt.job_card = lot_data.get("name")
        lot_rt.product_ref = lot_data.get("production_item")
        lot_rt.batch_no = lot_data.get("batch_no")
        lot_rt.bom_no = lot_data.get("bom_no")
        lot_rt.warehouse = lot_data.get("from_warehouse")
        lot_rt.available_qty = lot_data.get("qty_from_item_batch")
        lot_rt.qtynos = lot_data.get("qty_from_item_batch")
        lot_rt.spp_batch_no = lot_data.get("spp_batch_number")
        
        # Extract and format operations
        bom_operations = lot_data.get("bom_operations", [])
        operations_list = [op.get("operation") for op in bom_operations if "operation" in op]
        lot_rt.operations = ", ".join(operations_list)  # Comma-separated string
        
        # Insert the document
        lot_rt.insert()
        
        # Submit the document if needed
        lot_rt.submit()
        
        frappe.log_error(
            message=f"Created resource tag: {lot_rt.name} for sub lot {sub_lot_no}",
            title="Resource Tag - Created"
        )
        
        return {
            "status": "success", 
            "message": f"Resource tag created for {sub_lot_no}", 
            "resource_tag": lot_rt.name
        }
        
    except Exception as e:
        frappe.log_error(
            message=f"Error creating resource tag: {str(e)}\n{frappe.get_traceback()}",
            title="Resource Tag - Error"
        )
        return {"status": "failed", "message": str(e)}

@frappe.whitelist()
def handle_create_inspection_entry(form_data, validation_data=None):
    """
    Create an Inspection Entry document based on the provided form data and validation data.

    Args:
        form_data (dict): Data from the frontend form.
        validation_data (dict, optional): Pre-validated data if available.

    Returns:
        dict: Result of the operation with success status and document name or error message.
    """
    try:
        # Parse input data
        if isinstance(form_data, str):
            form_data = frappe.parse_json(form_data)
        if validation_data is None:
            validation_data = {}

        # Calculate total rejected quantity
        rejection_details = form_data.get("rejectionDetails", [])
        total_rejection_qty = sum(
            float(r.get("quantity", 0)) for r in rejection_details if float(r.get("quantity", 0)) > 0
        )

        # Calculate accepted quantity
        inspection_qty = float(form_data.get("inspectionInfo", {}).get("inspectionQuantity", 0))
        accepted_qty = max(0, inspection_qty - total_rejection_qty)

        # Format rejection items for child table
        items = [
            {
                "type_of_defect": r.get("rejectionType"),
                "rejected_qty": int(float(r.get("quantity", 0))),
                "product_ref_no": validation_data.get("item_code", form_data.get("batchInfo", {}).get("itemCode")),
                "batch_no": validation_data.get("batch_no", form_data.get("batchInfo", {}).get("batchNo")),
                "lot_no": form_data.get("batchInfo", {}).get("sppBatchId"),
                "inspector_code": form_data.get("inspectionInfo", {}).get("inspectorCode"),
                "inspector_name": form_data.get("inspectionInfo", {}).get("inspectorName"),
                "operator_name": "",
                "rejected_qty_kg": 0,
                "machine_no": ""
            }
            for r in rejection_details if float(r.get("quantity", 0)) > 0
        ]

        # Add a row for accepted quantity if applicable
        if accepted_qty > 0:
            items.append({
                "type_of_defect": "ACCEPTED",
                "rejected_qty": int(accepted_qty),
                "product_ref_no": validation_data.get("item_code", form_data.get("batchInfo", {}).get("itemCode")),
                "batch_no": validation_data.get("batch_no", form_data.get("batchInfo", {}).get("batchNo")),
                "lot_no": form_data.get("batchInfo", {}).get("sppBatchId"),
                "inspector_code": form_data.get("inspectionInfo", {}).get("inspectorCode"),
                "inspector_name": form_data.get("inspectionInfo", {}).get("inspectorName"),
                "operator_name": "",
                "rejected_qty_kg": 0,
                "machine_no": ""
            })

        # Create the Inspection Entry document
        doc = frappe.get_doc({
            "doctype": "Inspection Entry",
            "inspection_type": "Final Visual Inspection",
            "posting_date": frappe.utils.nowdate(),

            # Lot information
            "lot_no": form_data.get("batchInfo", {}).get("sppBatchId"),
            "scan_production_lot": form_data.get("batchInfo", {}).get("sppBatchId"),
            "product_ref_no": validation_data.get("item_code", form_data.get("batchInfo", {}).get("itemCode")),
            "spp_batch_number": validation_data.get("spp_batch_number", form_data.get("batchInfo", {}).get("sppBatchId")),
            "batch_no": validation_data.get("batch_no", form_data.get("batchInfo", {}).get("batchNo")),

            # Inspector information
            "inspector_name": form_data.get("inspectionInfo", {}).get("inspectorName"),
            "inspector_code": form_data.get("inspectionInfo", {}).get("inspectorCode"),
            "scan_inspector": form_data.get("inspectionInfo", {}).get("inspectorCode"),

            # Warehouse information
            "source_warehouse": validation_data.get("from_warehouse", form_data.get("batchInfo", {}).get("warehouse")),

            # Quantity information
            "vs_pdir_qty": float(validation_data.get("qty_from_item_batch", form_data.get("batchInfo", {}).get("availableQuantity", 0))),
            "total_inspected_qty_nos": inspection_qty,
            "total_rejected_qty": total_rejection_qty,
            "vs_pdir_qty_after_rejection": accepted_qty,

            # Rejection details child table
            "items": items
        })

        # Insert and save the document
        doc.insert()
        doc.submit()

        frappe.log_error(
            message=f"Created inspection entry: {doc.name} for lot {form_data.get('batchInfo', {}).get('sppBatchId')}",
            title="Inspection Entry - Created"
        )

        # Return success response
        return {
            "success": True,
            "name": doc.name
        }

    except Exception as e:
        frappe.log_error(message=f"Error creating Inspection Entry: {str(e)}\n{frappe.get_traceback()}", 
                        title="Inspection Entry - Error")
        return {
            "success": False,
            "error": str(e)
        }




