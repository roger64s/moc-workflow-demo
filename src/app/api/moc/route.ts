import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const defaultWorkflowSteps = Array.from({ length: 12 }, (_, index) => ({
  stepNumber: index + 1,
  resolution: "",
  comment: "",
  documentName: "",
  stage: "Pending",
  startDate: "",
  targetCompletion: "",
  actualDate: "",
  status: "Not Started" as const,
  ageing: 0,
}));

function mapActionStatus(status: string): "Open" | "WIP" | "Closed" {
  const normalized = status.toLowerCase();

  if (normalized.includes("closed") || normalized.includes("approved") || normalized.includes("final")) {
    return "Closed";
  }

  if (normalized.includes("procurement") || normalized.includes("active") || normalized.includes("wip")) {
    return "WIP";
  }

  return "Open";
}

export async function GET() {
  try {
    const mocs = await db.mOC_Request.findMany({
      orderBy: { createdAt: "desc" },
      include: { initiator: true },
    });

    const mapped = mocs.map((moc) => ({
      id: String(moc.id),
      requestNumber: moc.requestNumber,
      title: moc.title,
      initiatorId: moc.initiator?.name ?? `User ${moc.initiatorId}`,
      type: moc.type,
      scopeCategory: moc.scopeCategory ?? "Raw_Material",
      node: "N/A",
      actionSource: moc.description ?? "N/A",
      actionStatus: mapActionStatus(moc.status),
      createdAt: moc.createdAt.toISOString(),
      steps: defaultWorkflowSteps.map((step) => ({ ...step })),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("SERVER SIDE ERROR LOADING MOCS:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load MOC requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    const count = await db.mOC_Request.count();
    const sequenceNumber = String(count + 1).padStart(3, "0");
    const requestNumber = `MOC-2026-${sequenceNumber}`;

    const newMoc = await db.mOC_Request.create({
      data: {
        requestNumber,
        title: formData.pidUpdate || formData.hazopRef || `${formData.scopeCategory} Change`,
        type: formData.type,
        scopeCategory: String(formData.scopeCategory ?? "Raw_Material"),
        status: "Open",
        description: formData.scopeCategory,
        initiatorId: 1,
      },
    });

    return NextResponse.json({ success: true, data: newMoc });
  } catch (error: any) {
    console.error("SERVER SIDE ERROR CREATING MOC:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create MOC request" },
      { status: 500 }
    );
  }
}