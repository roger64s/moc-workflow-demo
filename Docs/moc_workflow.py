from fastmcp import FastMCP
from typing import Dict

# Create the MCP server instance
mcp = FastMCP("Haz360 MOC Workflow")

# Mock database of refinery assets and their safety limits
ASSET_DB = {
    "V-101": {"name": "High-Pressure Separator", "max_psi": 800},
    "P-202": {"name": "Crude Pump", "max_psi": 150}
}

@mcp.tool()
def evaluate_change_request(asset_id: str, proposed_pressure: int) -> str:
    """
    Evaluates an asset change request against safety limits.
    
    Args:
        asset_id: The ID of the asset (e.g., 'V-101')
        proposed_pressure: The pressure level being proposed
    """
    asset = ASSET_DB.get(asset_id)
    if not asset:
        return f"CRITICAL HAZARD: Asset ID {asset_id} not found in registry."
    
    limit = asset["max_psi"]
    if proposed_pressure > limit:
        return (f"CRITICAL HAZARD: Proposed pressure {proposed_pressure} PSI "
                f"exceeds safety limit of {limit} PSI for {asset['name']}.")
    
    return f"SAFETY CLEARANCE: Proposed pressure {proposed_pressure} PSI is within limits for {asset['name']}."

@mcp.tool()
def generate_pssr_checklist(project_name: str) -> str:
    """
    Generates a text-based Pre-Start Safety Review (PSSR) checklist.
    
    Args:
        project_name: The name of the MOC project
    """
    checklist = f"""
    --- PSSR Checklist for {project_name} ---
    1. [ ] Verification of design specs vs. field installation.
    2. [ ] P&ID updates completed and reviewed.
    3. [ ] Safety interlocks tested and verified.
    4. [ ] Standard Operating Procedures (SOPs) updated.
    5. [ ] Personnel training records verified.
    -------------------------------------------
    """
    return checklist

if __name__ == "__main__":
    mcp.run()