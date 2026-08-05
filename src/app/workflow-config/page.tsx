'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDefaultWorkflowTemplates, loadWorkflowTemplates, saveWorkflowTemplates, type MOCWorkflowCategory, type MOCWorkflowType, type WorkflowStepDefinition } from '@/lib/workflowConfig';

const defaultTypes: MOCWorkflowType[] = ['Permanent', 'Temporary'];
const workflowFlowOptions: WorkflowStepDefinition['type'][] = ['Seq', 'Parallel'];
const departmentOptions = ['MOC', 'HSE', 'Safety', 'Environment', 'Health', 'PSSR', 'Engineering', 'Operations', 'Quality'];
const disciplineOptions = ['Internal', 'Process Safety', 'Environmental', 'Operations', 'Quality', 'Mechanical', 'Electrical', 'Instrumentation'];

const createWorkflowStep = (stepNumber: number, existingCount = 0): WorkflowStepDefinition => ({
  stepNumber,
  processOrDecision: stepNumber === 1 ? 'Start' : stepNumber === existingCount ? 'End' : 'Process',
  taskDescription: stepNumber === 1 ? 'Start MOC & Initial Request Submission' : stepNumber === existingCount ? 'Approve to Close' : `New workflow step ${stepNumber}`,
  party: 'Company',
  department: 'MOC',
  category: 'Internal',
  type: 'Seq',
  dependency: stepNumber === 1 ? 'NA' : `${stepNumber - 1}`,
  routingLogic: stepNumber === existingCount ? 'End Process' : `Go to ${stepNumber + 1}`,
  assignedTo: '',
});

export default function WorkflowConfigPage() {
  const [selectedType, setSelectedType] = useState<MOCWorkflowType>('Permanent');
  const [selectedCategory, setSelectedCategory] = useState<MOCWorkflowCategory>('Raw_Material');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepDefinition[]>([]);
  const [savedMessage, setSavedMessage] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const templates = await loadWorkflowTemplates();
      const current = templates[selectedType][selectedCategory] ?? getDefaultWorkflowTemplates().Permanent.Raw_Material;
      setWorkflowSteps(current.map((step) => ({ ...step })));
      setSavedMessage('');
    };

    load();
  }, [selectedType, selectedCategory]);

  const configPreview = useMemo(() => workflowSteps.length, [workflowSteps]);

  const updateStepAssignment = (stepNumber: number, field: 'department' | 'category' | 'assignedTo', value: string) => {
    setWorkflowSteps((current) =>
      current.map((step) => (step.stepNumber === stepNumber ? { ...step, [field]: value } : step)),
    );
  };

  const updateStepType = (stepNumber: number, value: WorkflowStepDefinition['type']) => {
    setWorkflowSteps((current) =>
      current.map((step) => (step.stepNumber === stepNumber ? { ...step, type: value } : step)),
    );
  };

  const updateTaskDescription = (stepNumber: number, value: string) => {
    setWorkflowSteps((current) =>
      current.map((step) => (step.stepNumber === stepNumber ? { ...step, taskDescription: value } : step)),
    );
  };

  const updateNextStep = (stepNumber: number, nextStep: string) => {
    setWorkflowSteps((current) =>
      current.map((step) => {
        if (step.stepNumber !== stepNumber) return step;
        const trimmed = nextStep.trim();
        return {
          ...step,
          routingLogic: trimmed ? `Go to ${trimmed}` : 'End Process',
        };
      }),
    );
  };

  const addWorkflowStep = () => {
    setWorkflowSteps((current) => {
      const nextStepNumber = current.length + 1;
      return [...current, createWorkflowStep(nextStepNumber, current.length + 1)];
    });
  };

  const deleteWorkflowStep = (stepNumber: number) => {
    setWorkflowSteps((current) => {
      const filtered = current.filter((step) => step.stepNumber !== stepNumber);
      return filtered.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
        dependency: index === 0 ? 'NA' : `${index}`,
      }));
    });
  };

  const handleSave = async () => {
    try {
      if (!workflowSteps.length) {
        throw new Error('At least one workflow step is required.');
      }

      await saveWorkflowTemplates(selectedType, selectedCategory, workflowSteps);
      setSavedMessage(`Saved workflow for ${selectedType} / ${selectedCategory}.`);
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : 'Unable to save workflow.');
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Configuration</h1>
          <p className="text-sm text-slate-600">Assign each step to a department, discipline, and user.</p>
        </div>
        <a href="/dashboard" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to Dashboard
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-4 md:grid-cols-[220px_220px_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">MOC Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as MOCWorkflowType)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-sm"
            >
              {defaultTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Scope Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MOCWorkflowCategory)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-sm"
            >
              <option value="Raw_Material">Raw Material Change</option>
              <option value="Facility_Layout">Facility Layout</option>
              <option value="SIF_SIS">SIF / SIS (Safety Interlock)</option>
              <option value="Process_Change">Process Change (P&ID)</option>
            </select>
          </label>

          <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Current workflow steps: <strong>{configPreview}</strong>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save Workflow
          </button>
        </div>

        {savedMessage ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {savedMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
          <div className="grid grid-cols-[88px_1.4fr_1fr_1fr_1fr_0.7fr_0.8fr_56px] items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            <div>Step</div>
            <div>Task</div>
            <div>Department</div>
            <div>Discipline</div>
            <div>User (email id)</div>
            <div>Flow</div>
            <div>Next Step</div>
            <div className="text-right">Action</div>
          </div>

          {workflowSteps.map((step, index) => {
            const nextStepValue = /\d+/.exec(step.routingLogic)?.[0] ?? (step.stepNumber + 1).toString();

            return (
              <div
                key={step.stepNumber}
                className={`grid grid-cols-[88px_1.4fr_1fr_1fr_1fr_0.7fr_0.8fr_56px] items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    {step.stepNumber}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{step.processOrDecision}</span>
                </div>

                <label className="block">
                  <input
                    value={step.taskDescription}
                    onChange={(e) => updateTaskDescription(step.stepNumber, e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm font-semibold text-slate-800 shadow-sm"
                  />
                </label>

                <label className="block">
                  <select
                    value={step.department}
                    onChange={(e) => updateStepAssignment(step.stepNumber, 'department', e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm shadow-sm"
                  >
                    {departmentOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <select
                    value={step.category}
                    onChange={(e) => updateStepAssignment(step.stepNumber, 'category', e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm shadow-sm"
                  >
                    {disciplineOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <input
                    type="email"
                    value={step.assignedTo}
                    onChange={(e) => updateStepAssignment(step.stepNumber, 'assignedTo', e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm shadow-sm"
                  />
                </label>

                <label className="block">
                  <select
                    value={step.type}
                    onChange={(e) => updateStepType(step.stepNumber, e.target.value as WorkflowStepDefinition['type'])}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm shadow-sm"
                  >
                    {workflowFlowOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <select
                    value={nextStepValue}
                    onChange={(e) => updateNextStep(step.stepNumber, e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm shadow-sm"
                  >
                    {workflowSteps.map((candidate) => (
                      <option key={candidate.stepNumber} value={candidate.stepNumber}>
                        {candidate.stepNumber}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteWorkflowStep(step.stepNumber)}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={addWorkflowStep}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Add Step
          </button>
        </div>
      </div>
    </main>
  );
}
