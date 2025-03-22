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
