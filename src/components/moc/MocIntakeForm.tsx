"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkflowTemplateForEntry, type WorkflowStepDefinition } from "@/lib/workflowConfig";

interface MocIntakeFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export default function MocIntakeForm({ onSubmitSuccess, onCancel }: MocIntakeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mocType, setMocType] = useState("Permanent");
  const [scopeType, setScopeType] = useState("Raw_Material");
  const [previewSteps, setPreviewSteps] = useState<WorkflowStepDefinition[]>([]);

  useEffect(() => {
    const steps = getWorkflowTemplateForEntry(mocType, scopeType);
    setPreviewSteps(steps);
  }, [mocType, scopeType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      type: formData.get("type"),
      scopeCategory: formData.get("scopeCategory"),
      hazopRef: formData.get("hazopRef"),
      pidUpdate: formData.get("pidUpdate"),
      initiator: formData.get("initiator"),
    };

    try {
      const response = await fetch("/api/moc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to submit MOC", error);
      alert("Error submitting MOC request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">New Management of Change (MOC) Intake</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">MOC Type</label>
          <select
            name="type"
            value={mocType}
            onChange={(e) => setMocType(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="Permanent">Permanent</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Scope Category</label>
          <select
            name="scopeCategory"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="Raw_Material">Raw Material Change</option>
            <option value="Facility_Layout">Facility Layout</option>
            <option value="SIF_SIS">SIF / SIS (Safety Interlock)</option>
            <option value="Process_Change">Process Change (P&ID)</option>
          </select>
        </div>
      </div>

      {scopeType === "SIF_SIS" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <label className="block text-sm font-semibold text-amber-900 mb-2">RA / HAZOP Reference Number</label>
          <input
            type="text"
            name="hazopRef"
            placeholder="Enter HAZOP review reference..."
            className="w-full p-2 border border-amber-300 rounded-md bg-white"
          />
        </div>
      )}

      {scopeType === "Process_Change" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <label className="block text-sm font-semibold text-blue-900 mb-2">P&ID Drawing Update Number</label>
          <input
            type="text"
            name="pidUpdate"
            placeholder="Enter affected P&ID document numbers..."
            className="w-full p-2 border border-blue-300 rounded-md bg-white"
          />
        </div>
      )}

      <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Workflow Preview</p>
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {previewSteps.length} stage(s)
          </span>
        </div>
        <div className="space-y-2">
          {previewSteps.slice(0, 4).map((step) => (
            <div key={step.stepNumber} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Step {step.stepNumber}:</span> {step.taskDescription}
            </div>
          ))}
          {previewSteps.length > 4 ? (
            <div className="text-[11px] text-slate-500">+ {previewSteps.length - 4} more stage(s) available for this category.</div>
          ) : null}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Initiator Name (Mock Auth)</label>
        <input
          type="text"
          name="initiator"
          required
          placeholder="e.g., John Doe (Operations)"
          className="w-full p-2.5 border border-slate-300 rounded-md"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="flex-1 bg-slate-200 text-slate-800 py-3 px-4 rounded-md font-medium hover:bg-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-md font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting Request..." : "Submit MOC Request"}
        </button>
      </div>
    </form>
  );
}