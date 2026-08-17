# User Requirements Document — MOC Workflow

*Extracted from Product Owner conversations, organized by date.*

---

## 2026-07-27 — Project Kick-off & Core Objective

- Build **Haz360**, an industrial PSM/MOC (Process Safety Management / Management of Change) platform.
- Use **form-based data entry**, not document uploads.
- Store the central MOC state in a `MOC_Request` table with:
  - Type: Permanent or Temporary.
  - Status: Draft, Pending, Safety_Lock, Approved, or Closed.
  - Dynamic scope fields for common PSM MOC categories such as Raw Material, Facility Layout, and SIF/SIS.
  - User references such as Initiator and Department Head.
- Track approval steps in an `ApprovalStep` table linked to each MOC request.
- Track financial data in a `CostMatrix` table.
- Every generated file must include a comment block explaining the business rule it satisfies.
- The Product Owner must approve the database schema before any UI work begins.

---

## 2026-08-04 — Intake, Workflow Configuration & GitHub Sync

- The dashboard must display the **same data** that is captured in the intake form.
- A new MOC created from intake must be **linked to its intake record**.
- The New MOC form must allow the user to **cancel without submitting**.
- Workflow stages must be **defined per MOC Category** (for example, Raw Material, P&ID, and Facility each have different stages).
- Provide an **admin configuration screen** where stages for new MOCs can be set up.
- Access the stage configuration from a button in the **dashboard header**.
- Support approximately **12 workflow stages**, with the final stage being **Approve to Close**.
- The admin stage configurator must be **user-friendly and form-based**, similar to the intake form.
- Each step must be assignable to a **Department**, a **Discipline**, and a **User email address**.
- Display steps as simple rows, one after another, with a **Step Number column** at the front.
- Users must be able to **add and delete rows** in the stage configuration.
- Sync the project to **GitHub automatically** for showcase purposes.
- Provide step-by-step guidance for using GitHub and Vercel, since the Product Owner is not familiar with those platforms.

---

## 2026-08-05 — Deployment, Demo Cleanup & UX Refinements

- The workflow step table must show **Sequential / Parallel as a selectable column**, not stacked below the row.
- The stage configuration must let the user choose **which step to go to after a step is completed**.
- Reduce row height in the workflow configuration table.
- The proof of concept must be deployable to a **free public web app** so external users can view the demo.
- Keep the earlier small MOC prototype separate from this new MOC Workflow project.
- The dashboard must show **generic role names**, not specific person names.
- Change the label **Generic Initiator** to **Originator (Engineer) 1** and **Originator (Engineer) 2**.
- The application must open to the **Dashboard by default**, not the workflow configuration page.
- Remove **Haz360** branding and the **Project 272 (11281288)** placeholder from the demo.
- In the source-type list, highlight only **MOC**; show **Alarm** and **SCE** in grey.
- Remove the duplicate **Action Source** column from the row display.
- After any route or data change, push to GitHub, redeploy on Vercel, and open the public URL again.

## 2026-08-16

- Keep project metrics in a separate interactive chart page linked from the project summary when the project is closed.
- Show the Project Metrics page from the deployed Vercel dashboard with a dedicated button.
- Preview project changes locally first and update GitHub only after an explicit `Close Project` request.
- Show numeric labels on all project-metrics chart values, with responsive sizing and readable contrast.

## 2026-08-17

- Show a clearly labeled Metrics button in the top dashboard actions for the deployed Vercel demo.
