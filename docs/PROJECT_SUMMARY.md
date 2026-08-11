# MOC Workflow Demo — Project Summary

## Project Info
- Project name: MOC Workflow Demo
- Repository: (local, deployed via Vercel)
- Branch: main
- Session dates: 2026

## Scope Summary
Built a Management of Change (MOC) workflow dashboard demo. Later iterations added demo mode, responsive mobile layout, and Vercel deployment fixes.

Key files:
- Dashboard and workflow UI
- Prisma schema and database setup
- Vercel deployment configuration

## Time Distribution (estimated %)

```mermaid
pie title Estimated Time Distribution — MOC Workflow Demo
    "Coding / UI development" : 50
    "Testing / responsive verification" : 25
    "Rework / iteration" : 15
    "Deployment / Vercel fixes" : 7
    "Planning / architecture" : 3
```

## Estimated Effort by Date

```mermaid
xychart-beta
    title "Estimated Effort by Date"
    x-axis [2026]
    y-axis "Effort (arbitrary units)" 0 --> 100
    bar [75]
```

## Commit Timeline

```mermaid
timeline
    title MOC Workflow Demo Milestones
    section Build
        2b0f1b3e : Initial workflow demo
    section Deploy
        ddfa28f7 : Fix Vercel Prisma build
        0a5318c4 : Align Prisma production deps
        62b2137f : Fix root landing redirect
    section Demo Polish
        e441e562 : Make dashboard demo generic
        fcc82937 : Default demo entry to dashboard
        5e94a67a : Use originator labels in dashboard demo
        1d8b78c4 : Polish dashboard demo layout
        624ebec2 : Add Demo Mode banner to dashboard
    section Mobile
        b30028e8 : Make MOC dashboard responsive for mobile
        ed3a8b5f : Fix mobile breakpoint layout
        838c4639 : Shrink dashboard header for mobile
        6c13e173 : Redesign mobile stats to CRM-style 2x2 grid
    section Performance
        b3ea3d1e : Force dynamic rendering and disable cache
```

## Lessons Learned
- Prisma production dependencies need explicit alignment for Vercel builds.
- Demo mode and sample data make the dashboard easier to share without backend.
- Mobile breakpoints required multiple iterations to get the stat grid right.

## Final State
- Deployed via Vercel
- Supports demo mode, responsive layout, dynamic rendering
