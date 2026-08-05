import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const templates = await db.workflow_Template.findMany();
    const payload: Record<string, Record<string, unknown>> = {};

    for (const template of templates) {
      const scopeCategory = template.scopeCategory ?? 'Raw_Material';
      const steps = JSON.parse(template.stepsJson);
      payload[template.mocType] ??= {};
      payload[template.mocType][scopeCategory] = steps;
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("SERVER SIDE ERROR LOADING WORKFLOW TEMPLATES:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load workflow templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { mocType, scopeCategory = 'Raw_Material', steps } = await request.json();

    if (!mocType || !Array.isArray(steps)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: expected mocType and steps array" },
        { status: 400 }
      );
    }

    const saved = await db.workflow_Template.upsert({
      where: {
        mocType_scopeCategory: {
          mocType,
          scopeCategory,
        },
      },
      update: { stepsJson: JSON.stringify(steps) },
      create: {
        mocType,
        scopeCategory,
        stepsJson: JSON.stringify(steps),
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("SERVER SIDE ERROR SAVING WORKFLOW TEMPLATE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save workflow template" },
      { status: 500 }
    );
  }
}
