'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MocIntakeForm from '@/components/moc/MocIntakeForm';
import { getDefaultWorkflowTemplates, loadWorkflowTemplates, type MOCWorkflowCategory, type MOCWorkflowType, type WorkflowStepDefinition, type WorkflowTemplateRegistry } from '@/lib/workflowConfig';

interface StepExecutionRecord {
  stepNumber: number;
  resolution: string;
  comment: string;
  documentName: string;
  stage: string;
  startDate: string;
  targetCompletion: string;
  actualDate: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  ageing: number;
}

interface MOCRecord {
  id: string;
  requestNumber: string;
  title: string;
  initiatorId: string;
  type: string;
  scopeCategory?: string;
  node: string;
  actionSource: string;
  actionStatus: 'Open' | 'WIP' | 'Closed';
  createdAt: string;
  steps: StepExecutionRecord[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplateRegistry>(getDefaultWorkflowTemplates());
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const defaultTemplates = getDefaultWorkflowTemplates();

  const initialMockMocs: MOCRecord[] = [
    {
      id: 'moc-001',
      requestNumber: 'MOC-001',
      title: 'Hot Gas Bypass provision for Recycle Compressor-B',
      initiatorId: 'Originator (Engineer) 1',
      type: 'Permanent',
      node: 'Node 10 (J10)',
      actionSource: 'HAZOP Reco/MOC/SCE/Alarm/SIL',
      actionStatus: 'WIP',
      createdAt: '2026-04-15',
      steps: defaultTemplates.Permanent.Raw_Material.map((t, idx) => ({
        stepNumber: t.stepNumber,
        resolution: idx === 0 ? 'Approved' : idx === 1 ? 'Pending Check' : '',
        comment: idx === 0 ? 'Initial scope validated against HAZOP Node 10.' : '',
        documentName: idx === 0 ? 'MOC_Scope_v1.pdf' : '',
        stage: idx === 0 ? 'Initiated' : idx === 1 ? 'Checking' : 'Pending',
        startDate: '2026-04-15',
        targetCompletion: `2026-05-${String(1 + idx * 3).padStart(2, '0')}`,
        actualDate: idx === 0 ? '2026-05-01' : idx === 1 ? '2026-05-05' : '',
        status: idx === 0 ? 'Completed' : idx === 1 ? 'In Progress' : idx < 7 ? 'In Progress' : 'Not Started',
        ageing: 16 + (idx * 4)
      }))
    },
    {
      id: 'moc-002',
      requestNumber: 'MOC-002',
      title: 'Hot Gas Bypass provision for Recycle Compressor-D',
      initiatorId: 'Originator (Engineer) 2',
      type: 'Permanent',
      node: 'Node 15 (J15)',
      actionSource: 'HAZOP Reco/MOC/SCE/Alarm/SIL',
      actionStatus: 'WIP',
      createdAt: '2026-04-18',
      steps: defaultTemplates.Permanent.Raw_Material.map((t, idx) => ({
        stepNumber: t.stepNumber,
        resolution: idx === 0 ? 'Approved' : '',
        comment: '',
        documentName: '',
        stage: idx === 0 ? 'Initiated' : 'Checking',
        startDate: '2026-04-18',
        targetCompletion: `2026-05-${String(5 + idx * 2).padStart(2, '0')}`,
        actualDate: idx === 0 ? '2026-05-02' : '',
        status: idx === 0 ? 'Completed' : 'In Progress',
        ageing: 12 + (idx * 3)
      }))
    }
  ];

  const [mocs, setMocs] = useState<MOCRecord[]>(initialMockMocs);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMocId, setSelectedMocId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    let liveMocs: MOCRecord[] = [];

    try {
      const response = await fetch('/api/moc');
      if (response.ok) {
        const payload = await response.json();
        liveMocs = Array.isArray(payload?.data) ? payload.data : [];
      }
    } catch (e) {
      console.error('Failed to load live MOC data', e);
    }

    const saved = localStorage.getItem('haz360_schema_mocs_v3_light');
    let savedMocs: MOCRecord[] = [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          savedMocs = parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved MOC state', e);
      }
    }

    const templates = await loadWorkflowTemplates();
    setWorkflowTemplates(templates);

    const preferredMocs = liveMocs.length > 0 ? liveMocs : savedMocs.length > 0 ? savedMocs : initialMockMocs;
    setMocs(preferredMocs);
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  const saveMocs = (updated: MOCRecord[]) => {
    setMocs(updated);
    localStorage.setItem('haz360_schema_mocs_v3_light', JSON.stringify(updated));
  };

  const totalRecords = mocs.length;
  const openCount = mocs.filter(m => m.actionStatus !== 'Closed').length;
  const pssrCount = mocs.filter(m => m.actionStatus === 'WIP').length;
  const avgAge = totalRecords > 0 ? Math.round(mocs.reduce((acc, m) => acc + (m.steps[0]?.ageing || 15), 0) / totalRecords) : 0;

  const filteredMocs = mocs.filter(m => {
    const matchesStatus = filterStatus === 'All' || m.actionStatus === filterStatus;
    const matchesSearch = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.requestNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.initiatorId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStepFieldChange = (mocId: string, stepNum: number, field: keyof StepExecutionRecord, value: any) => {
    const updated = mocs.map(m => {
      if (m.id === mocId) {
        const updatedSteps = m.steps.map(s => {
          if (s.stepNumber === stepNum) {
            return { ...s, [field]: value };
          }
          return s;
        });

        const allCompleted = updatedSteps.every(s => s.status === 'Completed');
        const newActionStatus: MOCRecord['actionStatus'] = allCompleted ? 'Closed' : 'WIP';

        return {
          ...m,
          actionStatus: newActionStatus,
          steps: updatedSteps
        };
      }
      return m;
    });
    saveMocs(updated);
  };

  const selectedMoc = mocs.find(m => m.id === selectedMocId);

  if (selectedMoc) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setSelectedMocId(null)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center shadow-xs"
            >
              <i className="fa-solid fa-arrow-left mr-1.5"></i> Back
            </button>
            <span className="bg-amber-600 text-white font-black px-2 py-0.5 rounded text-xs tracking-wider">HAZ360</span>
            <span className="text-amber-700 text-xs font-mono font-bold">{selectedMoc.requestNumber} Workflow Schema</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white text-slate-700 font-mono px-3 py-1 rounded-lg border border-slate-300 shadow-xs">
              Source: <strong className="text-amber-600">{selectedMoc.actionSource}</strong>
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${selectedMoc.actionStatus === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
              Status: {selectedMoc.actionStatus}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{selectedMoc.type} MOC • Node: {selectedMoc.node}</span>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 mt-0.5">{selectedMoc.title}</h1>
              <p className="text-xs text-slate-500 mt-1">Initiator: <strong className="text-slate-800">{selectedMoc.initiatorId}</strong> | Created: {selectedMoc.createdAt}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl lg:text-right">
              <p className="text-[10px] uppercase font-bold text-slate-500">Total Schema Steps</p>
              <p className="text-sm font-mono font-bold text-amber-600 mt-0.5">12 Default Gateway Stages</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm flex justify-between items-center">
            <span>Actual Steps and Status (Live Schema Binding)</span>
            <span className="text-xs text-slate-500 font-normal">Edit resolution, upload documents, and toggle status to calculate live department ageing</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <th className="p-2.5">Step</th>
                  <th className="p-2.5">Task Description (Workflow Schema)</th>
                  <th className="p-2.5">Dept</th>
                  <th className="p-2.5">Assigned To</th>
                  <th className="p-2.5">Resolution (User Input)</th>
                  <th className="p-2.5">Comment</th>
                  <th className="p-2.5">Document Upload</th>
                  <th className="p-2.5">Target</th>
                  <th className="p-2.5">Actual Date</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Ageing (Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {selectedMoc.steps.map((step, idx) => {
                  const selectedCategory = (selectedMoc.scopeCategory as MOCWorkflowCategory) ?? 'Raw_Material';
                  const selectedTemplate = workflowTemplates[selectedMoc.type as MOCWorkflowType]?.[selectedCategory] ?? defaultTemplates[selectedMoc.type as MOCWorkflowType]?.[selectedCategory] ?? defaultTemplates.Permanent.Raw_Material;
                  const def = selectedTemplate[idx] || selectedTemplate[0];
                  const isInProgress = step.status === 'In Progress';

                  return (
                    <tr key={step.stepNumber} className={`hover:bg-slate-50 transition ${isInProgress ? 'bg-amber-50/50' : ''}`}>
                      <td className="p-2.5 font-mono font-bold text-amber-600">
                        {step.stepNumber} {isInProgress && <i className="fa-solid fa-arrow-right ml-1 text-xs text-amber-600 animate-pulse"></i>}
                      </td>
                      <td className="p-2.5 font-medium text-slate-900 max-w-[200px]" title={def.taskDescription}>
                        {def.taskDescription}
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Type: {def.type} | Routing: {def.routingLogic}</div>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{def.department}</td>
                      <td className="p-2.5 text-slate-800">{def.assignedTo}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={step.resolution}
                          onChange={(e) => handleStepFieldChange(selectedMoc.id, step.stepNumber, 'resolution', e.target.value)}
                          placeholder="e.g. Approved / OK"
                          className="w-28 bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={step.comment}
                          onChange={(e) => handleStepFieldChange(selectedMoc.id, step.stepNumber, 'comment', e.target.value)}
                          placeholder="Add comments..."
                          className="w-32 bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={step.documentName}
                            onChange={(e) => handleStepFieldChange(selectedMoc.id, step.stepNumber, 'documentName', e.target.value)}
                            placeholder="file.pdf"
                            className="w-20 bg-white border border-slate-300 rounded p-1 text-[11px] text-slate-900"
                          />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-amber-700 px-1.5 py-1 rounded text-[10px] border border-slate-300">
                            <i className="fa-solid fa-upload"></i>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleStepFieldChange(selectedMoc.id, step.stepNumber, 'documentName', e.target.files[0].name);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{step.targetCompletion}</td>
                      <td className="p-2.5">
                        <input
                          type="date"
                          value={step.actualDate}
                          onChange={(e) => handleStepFieldChange(selectedMoc.id, step.stepNumber, 'actualDate', e.target.value)}
                          className="bg-white border border-slate-300 rounded p-1 text-[11px] text-slate-900"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={step.status}
                          onChange={(e) => handleStepFieldChange(selectedMoc.id, step.stepNumber, 'status', e.target.value as any)}
                          className={`rounded p-1 text-[11px] font-semibold border ${
                            step.status === 'Completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                              : step.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          <option value="Completed" className="bg-white text-emerald-700">Completed</option>
                          <option value="In Progress" className="bg-white text-amber-700">In Progress</option>
                          <option value="Not Started" className="bg-white text-rose-700">Not Started</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-600">
                        {step.ageing}d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold">Demo Mode</span>
          <span className="hidden sm:inline">— No login required. All data shown is simulated for demonstration.</span>
        </div>
        <span className="text-xs font-medium">Public Preview</span>
      </div>

      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowIntakeModal(false)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 text-lg"
              aria-label="Close intake modal"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <MocIntakeForm
              onCancel={() => setShowIntakeModal(false)}
              onSubmitSuccess={() => {
                setShowIntakeModal(false);
                setRefreshKey((value) => value + 1);
                loadDashboardData();
              }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 leading-tight">MOC Enterprise Control & Action Tracking Register</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/workflow-config')}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 transition whitespace-nowrap"
          >
            <i className="fa-solid fa-gear mr-1.5"></i> Admin Config
          </button>
          <button 
            onClick={() => setShowIntakeModal(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition flex items-center justify-center shadow-sm whitespace-nowrap"
          >
            <i className="fa-solid fa-plus mr-1.5"></i> New MOC Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Action Records</p>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{openCount}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 lg:p-3 rounded-lg border border-blue-200"><i className="fa-solid fa-folder-open text-base lg:text-lg"></i></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">WIP Workflows</p>
            <p className="text-2xl lg:text-3xl font-bold text-amber-600 mt-1">{pssrCount}</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 lg:p-3 rounded-lg border border-amber-200"><i className="fa-solid fa-diagram-project text-base lg:text-lg"></i></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Source Types</p>
            <div className="mt-1 lg:mt-2 flex flex-wrap gap-1.5 lg:gap-2">
              <span className="rounded-full bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 text-[10px] lg:text-xs font-bold">MOC</span>
              <span className="rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-[10px] lg:text-xs font-medium">HAZOP</span>
              <span className="rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-[10px] lg:text-xs font-medium">SIL</span>
              <span className="rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-[10px] lg:text-xs font-medium">Alarm</span>
              <span className="rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 text-[10px] lg:text-xs font-medium">SCE</span>
            </div>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 lg:p-3 rounded-lg border border-purple-200"><i className="fa-solid fa-shield-heart text-base lg:text-lg"></i></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Cycle Age</p>
            <p className="text-2xl lg:text-3xl font-bold text-emerald-600 mt-1">{avgAge} Days</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 lg:p-3 rounded-lg border border-emerald-200"><i className="fa-solid fa-clock text-base lg:text-lg"></i></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-sm font-bold text-slate-900">Enterprise MOC Register</span>
            <div className="flex space-x-1 text-xs">
              {['All', 'WIP', 'Closed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-md transition ${filterStatus === status ? 'bg-amber-600 text-white font-bold' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text"
              placeholder="Search MOC register..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
            />
            <span className="text-xs text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-300 whitespace-nowrap">{filteredMocs.length} Records</span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="p-3">MOC Ref</th>
                <th className="p-3">Initiator</th>
                <th className="p-3">Description</th>
                <th className="p-3">HAZOP Node</th>
                <th className="p-3">Action Status</th>
                <th className="p-3 text-right">Total Ageing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {filteredMocs.map((moc) => {
                const totalAge = moc.steps ? moc.steps.reduce((acc, s) => acc + (s.ageing || 1), 0) : 1;
                return (
                  <tr key={moc.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold">
                      <button 
                        onClick={() => setSelectedMocId(moc.id)}
                        className="text-amber-600 hover:underline flex items-center"
                      >
                        {moc.requestNumber} <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
                      </button>
                    </td>
                    <td className="p-3 text-slate-700">{moc.initiatorId}</td>
                    <td className="p-3 font-medium text-slate-900">{moc.title}</td>
                    <td className="p-3 font-mono text-xs text-slate-500">{moc.node}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                        moc.actionStatus === 'Closed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {moc.actionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-amber-600">{totalAge}d</td>
                  </tr>
                );
              })}
              {filteredMocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No MOC records match your filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredMocs.map((moc) => {
            const totalAge = moc.steps ? moc.steps.reduce((acc, s) => acc + (s.ageing || 1), 0) : 1;
            return (
              <div key={moc.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <button 
                    onClick={() => setSelectedMocId(moc.id)}
                    className="font-mono font-bold text-amber-600 hover:underline flex items-center"
                  >
                    {moc.requestNumber} <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
                  </button>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    moc.actionStatus === 'Closed' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {moc.actionStatus}
                  </span>
                </div>
                <h3 className="font-medium text-slate-900 text-sm mb-1">{moc.title}</h3>
                <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-xs text-slate-600">
                  <span><span className="font-semibold text-slate-500">Initiator:</span> {moc.initiatorId}</span>
                  <span><span className="font-semibold text-slate-500">Node:</span> {moc.node}</span>
                  <span><span className="font-semibold text-slate-500">Ageing:</span> <span className="font-mono font-semibold text-amber-600">{totalAge}d</span></span>
                </div>
              </div>
            );
          })}
          {filteredMocs.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">No MOC records match your filter criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}