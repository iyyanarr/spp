import frappe
from frappe.utils.nestedset import get_descendants_of


@frappe.whitelist()
def process_lot(data):
    if isinstance(data, str):
        data = frappe.parse_json(data)
    
    batch_info = data.get("batchInfo", {})
    inspection_info = data.get("inspectionInfo", {})
    operations = data.get("operationDetails", [])
    rejection_details = data.get("rejectionDetails", [])
    summary = data.get("summary", {})
    
    # Validate lot before processing
    batch_id = batch_info.get('sppBatchId')
    validation_result = _get_lot_validation_data(batch_id)
    
    # For debugging/testing, return early if requested
    if data.get("validateOnly", False):
        return {
            "status": "success", 
            "message": f"Validation completed for {batch_id}",
            "validation_result": validation_result
        }
    
    # Proceed with sub-lot creation if validation succeeded
    if validation_result and not isinstance(validation_result, dict) or not validation_result.get("status") == "failed":
        try:
            sub_lot_result = create_sub_lot_entry(batch_info, inspection_info, validation_result)

            # Process operations if sub-lot creation was successful
            if sub_lot_result and sub_lot_result.get("sub_lot_no"):
                sub_lot_no = sub_lot_result.get("sub_lot_no")
                operation_results = []
                
                for operation_detail in operations:
                    operation_type = operation_detail.get("operation")
                    operator_id = operation_detail.get("employeeCode")
                    
                    # Validate the operation data
                    if not operation_type or not operator_id:
                        frappe.log_error(
                            f"Missing operation type or operator ID: {operation_detail}",
                            "Process Operation Error"
                        )
                        continue
                        
                    # Get validation data for the sub-lot
                    operation_validation = _get_lot_res_validation_data(batch_id)
                    
                    # Create resource tagging for each operation
                    result = _create_resource_tags_for_operations(
                        operation_type, 
                        sub_lot_no, 
                        operator_id,
                        operation_validation
                    )
                    operation_results.append(result)
                
                # Return successful response with sub-lot and operation results
                return {
                    "status": "success",
                    "message": f"Lot {batch_id} processed successfully",
                    "sub_lot": sub_lot_result,
                    "operations": operation_results
                }
            

        except Exception as e:
            frappe.log_error(
                f"Error in process_lot: {str(e)}\n{frappe.get_traceback()}",
                "Process Lot Error"
            )
            return {
                "status": "failed", 
                "message": f"Error processing lot: {str(e)}",
                "validation_result": validation_result
            }
    
    # If validation failed
    return {
        "status": "failed", 
        "message": "Lot validation failed",
        "validation_result": validation_result
    }

def create_sub_lot_entry(batch_info, inspection_info,lot_data):
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
        if inspection_qty <= available_qty:
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
        dict: Dictionary with details of the created sub lot
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
    
    # Return a dictionary with details of the created sub lot
    return {
        "name": sub_lot_doc.name,
        "sub_lot_no": sub_lot_doc.sub_lot_no,
        "item_code": sub_lot_doc.item_code,
        "batch_no": sub_lot_doc.batch_no,
        "qty": sub_lot_doc.qty,
        "uom": sub_lot_doc.uom,
        "warehouse": sub_lot_doc.warehouse,
        "posting_date": sub_lot_doc.posting_date,
        "first_parent_lot_no": sub_lot_doc.first_parent_lot_no,
        "original_lot_no": original_lot_no
    }

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

def _create_resource_tags_for_operations(operation, sub_lot_no, operator_id,validation_result):

    try:
        # Log the incoming arguments
        frappe.log_error(
            message=f"Creating resource tag - Operation: {operation}, Sub Lot: {sub_lot_no}, Operator: {operator_id},Validation:{validation_result}",
            title="Resource Tag - Arguments"
        )
        from shree_polymer_custom_app.shree_polymer_custom_app.doctype.lot_resource_tagging.lot_resource_tagging import check_return_workstation

        workstation = check_return_workstation(operation)
        
        # Extract the message from the validation result
        lot_data = validation_result
        
        # Create the Lot Resource Tagging document
        lot_rt = frappe.new_doc("Lot Resource Tagging")
        # Check if sub_lot_no has a dash and extract the suffix
        suffix = ""
        if "-" in sub_lot_no:
            suffix = sub_lot_no.split("-", 1)[1]  # Get everything after the first dash

        # Set fields from validation result
        lot_rt.posting_date = frappe.utils.now()
        lot_rt.scan_lot_no = sub_lot_no
        lot_rt.scan_operator = operator_id
        lot_rt.operator_id = operator_id
        lot_rt.operation_type = operation
        lot_rt.job_card = lot_data.get("name")
        lot_rt.product_ref = lot_data.get("production_item")
        # Append suffix to batch_no if it exists
        lot_rt.batch_no = lot_data.get("batch_no") + (f"-{suffix}" if suffix else "")
        lot_rt.bom_no = lot_data.get("bom_no")
        lot_rt.warehouse = lot_data.get("from_warehouse")
        # Set fields from validation result
        lot_rt.posting_date = frappe.utils.now()
        lot_rt.scan_lot_no = sub_lot_no
        lot_rt.scan_operator = operator_id
        lot_rt.operator_id = operator_id
        lot_rt.operation_type = operation
        lot_rt.job_card = lot_data.get("name")
        lot_rt.product_ref = lot_data.get("production_item")
        lot_rt.bom_no = lot_data.get("bom_no")
        lot_rt.warehouse = lot_data.get("from_warehouse")
        lot_rt.available_qty = lot_data.get("qty_from_item_batch")
        lot_rt.qtynos = lot_data.get("qty_from_item_batch")
        lot_rt.spp_batch_no = lot_data.get("spp_batch_number")
        lot_rt.workstation = workstation
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
