import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = parseInt(idParam, 10);

    // 1. Fetch or update your approvals logic here as needed
    // (Keeping your existing logic placeholder or adjustment)

    // 2. Example: Check your approvals if applicable
    const allApproved = true; // Replace with your actual approval check logic

    // 3. Update overall MOC status based on department clearance
    const updatedStatus = allApproved ? "Pending Final Approval" : "WIP";

    // 4. Update the MOC request using the correct model name (mOC_Request)
    const updatedMoc = await db.mOC_Request.update({
      where: { id: id },
      data: { status: updatedStatus },
    });

    return NextResponse.json({ success: true, updatedMoc });
  } catch (error) {
    console.error("Error updating approval status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}