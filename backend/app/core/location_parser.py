import re

def format_item_code(rack: int, pozice: int, box: int = 0, number: int = 1) -> str:
    """
    Format storage components into the standard XY-ZAAA item ID scheme.
    XY = (Rack)(Position)
    Z = Box (1 digit, 0 if no box)
    AAA = 3-digit item index
    Example: Rack 6, Pozice 1, Box 0, Number 1 -> '61-0001'
    Example: Rack 6, Pozice 1, Box 2, Number 1 -> '61-2001'
    """
    box_clean = max(0, box)
    return f"{rack}{pozice}-{box_clean}{number:03d}"

def parse_item_code(code: str) -> dict:
    """
    Parses an XY-ZAAA item code into its constituent parts.
    Matches formats like '61-0001' (box 0, item 1) or '61-2001' (box 2, item 1).
    Returns dict: {'rack': int, 'pozice': int, 'box': int, 'number': int}
    """
    code_clean = code.strip()
    match = re.match(r"^(\d)(\d)-(\d)(\d{3})$", code_clean)
    if not match:
        raise ValueError(f"Invalid item code format: '{code}'. Expected format 'XY-ZAAA' (e.g. '61-0001')")
    
    rack, pozice, box, number = match.groups()
    return {
        "rack": int(rack),
        "pozice": int(pozice),
        "box": int(box),
        "number": int(number)
    }
