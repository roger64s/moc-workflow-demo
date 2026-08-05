import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // This uses your app's perfectly working database connection!

export async function GET() {
  try {
    const result = await db.mOC_Request.updateMany({
      where: { status: "Draft" },
      data: { status: "Open" },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${result.count} records from Draft to Open!` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}