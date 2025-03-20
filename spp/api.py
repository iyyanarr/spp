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
        if material.get("has_bom") and material.get("next_bom"):
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
