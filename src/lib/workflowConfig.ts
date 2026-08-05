export type MOCWorkflowType = "Permanent" | "Temporary";
export type MOCWorkflowCategory = "Raw_Material" | "Facility_Layout" | "SIF_SIS" | "Process_Change";

export type WorkflowTemplateRegistry = Record<MOCWorkflowType, Record<MOCWorkflowCategory, WorkflowStepDefinition[]>>;

export interface WorkflowStepDefinition {
  stepNumber: number;
  processOrDecision: "Start" | "Decision" | "Process" | "End";
  taskDescription: string;
  party: string;
  department: string;
  category: string;
  type: "Seq" | "Parallel";
  dependency: string;
  routingLogic: string;
  assignedTo: string;
}

export const DEFAULT_WORKFLOW_TEMPLATE: WorkflowStepDefinition[] = [
  { stepNumber: 1, processOrDecision: "Start", taskDescription: "Start MOC & Initial Request Submission", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "NA", routingLogic: "Go to 2", assignedTo: "Originator (Engineer)" },
  { stepNumber: 2, processOrDecision: "Decision", taskDescription: "All Check Lists Ready?", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "1", routingLogic: "If Yes Go to 4; If No Go to 3", assignedTo: "Checklist Approver" },
  { stepNumber: 3, processOrDecision: "Process", taskDescription: "Prepare Checklists (Can be multiple, all must be ready)", party: "Company", department: "MOC", category: "Internal", type: "Parallel", dependency: "2", routingLogic: "Go to 4 (Once completed)", assignedTo: "Checklist Assessor" },
  { stepNumber: 4, processOrDecision: "Decision", taskDescription: "PHA Assessment Required?", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "2, 3", routingLogic: "If Yes Go to 5; If No Go to Parallel Block (6, 7, 8)", assignedTo: "PHA Approver" },
  { stepNumber: 5, processOrDecision: "Process", taskDescription: "Perform Risk Assessment / PHA", party: "Company", department: "HSE", category: "Internal", type: "Seq", dependency: "4", routingLogic: "Go to Parallel Block (6, 7, 8)", assignedTo: "ESH Assessor" },
  { stepNumber: 6, processOrDecision: "Decision", taskDescription: "Is Environmental Approved?", party: "Company", department: "Environment", category: "Internal", type: "Parallel", dependency: "4, 5", routingLogic: "If Yes Wait for Merge; If No Go to 2", assignedTo: "Environment Assessor" },
  { stepNumber: 7, processOrDecision: "Decision", taskDescription: "Is Safety Approved?", party: "Company", department: "Safety", category: "Internal", type: "Parallel", dependency: "4", routingLogic: "If Yes Wait for Merge; If No Go to 2", assignedTo: "Safety Assessor" },
  { stepNumber: 8, processOrDecision: "Decision", taskDescription: "Is Health Approved?", party: "Company", department: "Health", category: "Internal", type: "Parallel", dependency: "4", routingLogic: "If Yes Wait for Merge; If No Go to 2", assignedTo: "Health Assessor" },
  { stepNumber: 9, processOrDecision: "Decision", taskDescription: "PSSR Complete?", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "6, 7, 8", routingLogic: "If Yes Go to 11; If No Go to 10", assignedTo: "PSSR Approver" },
  { stepNumber: 10, processOrDecision: "Process", taskDescription: "Perform PSSR (Pre-Startup Safety Review)", party: "Company", department: "PSSR", category: "Internal", type: "Seq", dependency: "9", routingLogic: "Go to 9", assignedTo: "PSSR Assessor" },
  { stepNumber: 11, processOrDecision: "Decision", taskDescription: "Process Safety Approved?", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "9, 10", routingLogic: "If Yes Go to 12; If No Go to 2", assignedTo: "PSM Approver" },
  { stepNumber: 12, processOrDecision: "End", taskDescription: "Complete Action & Final Sign-off", party: "Company", department: "MOC", category: "Internal", type: "Seq", dependency: "11", routingLogic: "End Process", assignedTo: "Plant Manager" },
];

const safeClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const categoryDefaults = (): Record<MOCWorkflowCategory, WorkflowStepDefinition[]> => ({
  Raw_Material: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
  Facility_Layout: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
  SIF_SIS: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
  Process_Change: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
});

export function getDefaultWorkflowTemplates(): WorkflowTemplateRegistry {
  return {
    Permanent: categoryDefaults(),
    Temporary: {
      Raw_Material: [
        {
          stepNumber: 1,
          processOrDecision: "Start",
          taskDescription: "Start Temporary MOC & Initial Request Submission",
          party: "Company",
          department: "MOC",
          category: "Internal",
          type: "Seq",
          dependency: "NA",
          routingLogic: "Go to 2",
          assignedTo: "Originator (Engineer)",
        },
        {
          stepNumber: 2,
          processOrDecision: "Decision",
          taskDescription: "Temporary Change Approval Required?",
          party: "Company",
          department: "Safety",
          category: "Internal",
          type: "Seq",
          dependency: "1",
          routingLogic: "If Yes Go to 3; If No Go to 4",
          assignedTo: "Safety Approver",
        },
      ],
      Facility_Layout: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
      SIF_SIS: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
      Process_Change: safeClone(DEFAULT_WORKFLOW_TEMPLATE),
    },
  };
}

export async function loadWorkflowTemplates(): Promise<WorkflowTemplateRegistry> {
  try {
    const response = await fetch('/api/workflow', { cache: 'no-store' });
    if (!response.ok) {
      return getDefaultWorkflowTemplates();
    }

    const payload = await response.json();
    const data = payload?.data ?? {};
    const defaults = getDefaultWorkflowTemplates();
    const result: WorkflowTemplateRegistry = {
      Permanent: { ...defaults.Permanent },
      Temporary: { ...defaults.Temporary },
    };

    for (const [type, categories] of Object.entries(data)) {
      if (!categories || typeof categories !== 'object') continue;

      const registryType = type as MOCWorkflowType;
      const normalizedRegistry = result[registryType] ?? { ...defaults.Permanent };

      for (const [category, steps] of Object.entries(categories as Record<string, WorkflowStepDefinition[]>)) {
        if (Array.isArray(steps)) {
          normalizedRegistry[category as MOCWorkflowCategory] = safeClone(steps);
        }
      }

      result[registryType] = normalizedRegistry;
    }

    return result;
  } catch {
    return getDefaultWorkflowTemplates();
  }
}

export async function saveWorkflowTemplates(type: MOCWorkflowType, scopeCategory: MOCWorkflowCategory, steps: WorkflowStepDefinition[]) {
  await fetch('/api/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mocType: type, scopeCategory, steps }),
  });
}

export function getWorkflowTemplateForEntry(type: string, scopeCategory?: string): WorkflowStepDefinition[] {
  const defaults = getDefaultWorkflowTemplates();
  const normalizedType = type === 'Temporary' ? 'Temporary' : 'Permanent';
  const normalizedCategory = (scopeCategory as MOCWorkflowCategory) ?? 'Raw_Material';
  const typedDefault = defaults[normalizedType][normalizedCategory] ?? defaults[normalizedType].Raw_Material;
  return safeClone(typedDefault);
}

export async function getWorkflowTemplateForType(type: string, scopeCategory: MOCWorkflowCategory = 'Raw_Material'): Promise<WorkflowStepDefinition[]> {
  const templates = await loadWorkflowTemplates();
  const chosen = templates[type as MOCWorkflowType]?.[scopeCategory] ?? templates.Permanent.Raw_Material;
  return safeClone(chosen);
}
