Workflow Studio Roadmap

Purpose

Workflow Studio is the configuration engine that allows firms to define:
	•	How inspections are structured (future)
	•	What is required before leaving a job site (future)
	•	How photos are labeled and organized (future)
	•	How General Loss Reports (GLR) and Photo Reports are structured (initial focus)

This system must support multiple carriers, claim types, property types, and report types without changing inspection data collection.

⸻

Core Architecture (Non-Negotiable)

System Roles

INSPEKTiT (Field App)
	•	Collects inspection data
	•	Captures photos and metadata
	•	Builds canonical report data via extraction layer
	•	Generates PDFs (GLR + Photo Report)

INSPEKTiQ (Admin Platform)
	•	Defines workflows and templates
	•	Controls report structure and requirements
	•	Provides admin UI for firms
	•	Does NOT generate reports

⸻

Critical Rules
	1.	Templates control presentation, NOT data collection
	2.	Extraction layer is the single source of truth for report data
	3.	Shared registry defines all valid sections and fields
	4.	Never couple Workflow Studio to raw inspectionData structure
	5.	PDF renderers must remain stable until explicitly refactored
	6.	Inspection workflow UI is NOT modified in early phases

⸻

Shared Contract

The system depends on three stable layers:
	1.	Extraction Layer (INSPEKTiT)
	•	extractReportData.js
	•	Produces canonical report shape
	2.	Registry (Shared)
	•	workflowRegistry.js / workflowRegistry.ts
	•	Defines sections, fields, modes, subsections
	3.	Template Config (INSPEKTiQ)
	•	Stored per firm
	•	References registry keys only

⸻

Report Types
	•	initial_report
	•	interim_report
	•	final_report
	•	supplement_report
	•	inspection_only

Important:
Report type ≠ report number

Reports must be sequentially numbered:
	•	Report 1
	•	Report 2
	•	Report 3

Revisions:
	•	Report 2 (Revised YYYY-MM-DD HH:MM)

⸻

Phases

Phase 0 — Foundation (Current)

Status: IN PROGRESS
	•	Extraction layer implemented
	•	Canonical contract defined
	•	Shared registry created and frozen (v1)
	•	Refactor validation underway (bug fixes)

⸻

Phase 1 — Workflow Studio UI (INSPEKTiQ)

Goal:
Build full admin UI using mock/local state only

Includes:
	•	Workflow Studio main tab
	•	Workflow list page
	•	Workflow editor shell
	•	Reports tab (primary focus)
	•	Preview tab (outline only)

Excludes:
	•	No database writes
	•	No template persistence
	•	No live report integration

⸻

Phase 2 — Persistence (INSPEKTiQ)

Goal:
Store and retrieve workflow templates

Includes:
	•	workflow_templates table
	•	CRUD operations
	•	Default template per firm
	•	Version-safe schema

⸻

Phase 3 — Template Matching

Goal:
Auto-select correct template for a claim

Matching Inputs:
	•	carrier
	•	loss type
	•	claim type
	•	property type

Behavior:
	•	Score-based matching
	•	Fallback to firm default
	•	Final fallback to system default

⸻

Phase 4 — Report Integration (INSPEKTiT)

Goal:
Use templates to control report output

Includes:
	•	Apply section ordering
	•	Apply enabled/disabled sections
	•	Apply heading overrides
	•	Apply modes (summary/full)

Does NOT change:
	•	Data collection
	•	Photo logic
	•	Sentence builders (initially)

⸻

Phase 5 — Inspection Workflow Customization (Future)

Goal:
Allow firms to control inspection flow

Includes:
	•	Required fields
	•	Section visibility
	•	Custom inspection items
	•	Photo requirements

⸻

Guardrails (Strict)

DO NOT:
	•	Modify inspection UI during Phase 0–3
	•	Change PDF layout logic during Phase 0–3
	•	Introduce new section keys outside registry
	•	Couple templates to raw inspectionData
	•	Build conditional logic before Phase 3

ALWAYS:
	•	Use canonical contract
	•	Use registry keys only
	•	Keep changes isolated to current phase
	•	Validate against real claim outputs

⸻

Current Status
	•	Extraction layer: COMPLETE (under validation)
	•	Photo + GLR outputs: being verified against real claims
	•	Registry: LOCKED (v1)
	•	INSPEKTiQ: ready for Workflow Studio UI build

Active Work:
	•	Fixing report regressions (INSPEKTiT)
	•	Preparing Workflow Studio UI (INSPEKTiQ)

⸻

Definition of Success (Phase 1)
	•	Admin can open Workflow Studio
	•	Admin can create/edit a workflow (local state)
	•	Admin can reorder report sections
	•	Admin can toggle sections on/off
	•	Admin can preview report structure (outline)

No backend required for success in this phase.

⸻

Long-Term Vision

Workflow Studio becomes the control layer for:
	•	Inspection workflows
	•	Photo systems
	•	Report generation
	•	Carrier-specific compliance
	•	Automation rules (CHECKiT / CLOSEiT evolution)

This replaces hardcoded logic with a configurable system while preserving speed and simplicity in the field.

⸻

Notes
	•	Backward compatibility is required at all times
	•	Existing reports must continue to generate correctly
	•	Every phase must be independently shippable
	•	Simplicity in the field app is the highest priority
:::