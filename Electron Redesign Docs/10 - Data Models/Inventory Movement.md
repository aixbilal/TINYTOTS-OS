# Inventory Movement

## Document Information

| Field | Value |
|---|---|
| Document ID | 10-Inventory Movement |
| Folder | 10 - Data Models |
| Status | Planned |
| Version | 1.0.0 |
| Primary Source | TinyTots OS redesign specification |
| Implementation Source | Verified TinyTots OS repository/database schema |
| Last Updated | 2026-08-09 |

## Purpose

Auditable stock changes and movement history.

## Scope

This document defines the semantic contract of the data model, including its purpose, identity, attributes, relationships, lifecycle, constraints, and current-versus-target state.

This is a **data contract document**, not a database migration guide.

## Source Discipline

The redesign specification defines target-state requirements. The verified repository and database schema establish current implementation.

Where neither source establishes a detail:

> TODO — Source information unavailable.

Do not infer fields, relationships, constraints, or business rules as existing behavior.

## Model Responsibility

This model is responsible for representing its defined business entity or data concern.

Business workflows belong to **09 — Features**.

System architecture belongs to **03 — Architecture**.

Implementation and migrations belong to **11 — Development**.

## Identity

- Primary identifier: **TODO — verify source/schema**
- Identifier type: **TODO**
- Uniqueness requirements: **TODO**
- External identifiers: **TODO**

## Attributes

| Attribute | Type | Required | Description | Source / Status |
|---|---|---|---|---|
| TODO | TODO | TODO | TODO | TODO |

Exact attributes must be extracted from the authoritative redesign material and verified against the repository/schema before being finalized.

## Relationships

| Related Model | Relationship | Description | Source / Status |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

Do not assume cardinality or foreign-key behavior without evidence.

## Lifecycle

| State / Event | Effect on Model | Source / Status |
|---|---|---|
| Creation | TODO | TODO |
| Update | TODO | TODO |
| Deletion / Archival | TODO | TODO |

Only source-supported lifecycle states should be documented as requirements.

## Validation & Constraints

Potential categories requiring verification:

- Required fields
- Uniqueness
- Referential integrity
- Valid ranges
- Status transitions
- Domain constraints
- Soft-delete/archive behavior
- Audit requirements

Exact constraints: **TODO unless verified.**

## Data Ownership

**System of Record:** TODO — verify.

**Write Authority:** TODO — verify.

**Read Consumers:** TODO — verify.

**Synchronization Authority:** TODO — verify where applicable.

## Current Implementation

Current implementation status must be verified against the repository and database schema.

- Model/table: TODO
- Current fields: TODO
- Relationships: TODO
- Current constraints: TODO
- Current gaps: TODO

Do not claim implementation merely because a conceptual model exists in the redesign document.

## Redesign / Target State

The redesign specification defines the intended future-state semantics.

Target-state requirements:

- TODO — extract from authoritative redesign source.
- TODO — identify required changes.
- TODO — identify unresolved decisions.

## Current vs Target

| Area | Current Implementation | Target Requirement | Gap / Action |
|---|---|---|---|
| Identity | TODO | TODO | TODO |
| Attributes | TODO | TODO | TODO |
| Relationships | TODO | TODO | TODO |
| Constraints | TODO | TODO | TODO |
| Lifecycle | TODO | TODO | TODO |

## Data Integrity

Data integrity requirements must be defined from source evidence.

**TODO — verify transaction, referential-integrity, uniqueness, and validation requirements.**

## Security & Privacy

Identify only source-supported requirements for:

- Access control
- Sensitive fields
- Personally identifiable information
- Encryption
- Retention
- Auditability

Exact requirements: **TODO.**

## Synchronization & Offline Considerations

Where this model participates in synchronization or offline operation, document:

- Local representation
- Synchronization authority
- Conflict behavior
- Queueing behavior
- Retry behavior
- Recovery behavior

Unsupported behavior remains TODO.

## Implementation Notes

Database-specific implementation, migrations, indexes, triggers, RLS policies, and repository code belong in the appropriate architecture/development documentation unless this model document needs to reference them.

## TODO

- Verify exact schema/model definition.
- Verify all relationships and cardinalities.
- Verify lifecycle and constraints.
- Verify current implementation.
- Extract target-state requirements from the redesign source.
- Document required migrations where applicable.
- Add model-specific testing requirements in Phase 12 — Testing.

## Boundary

An Inventory Movement records a stock change or adjustment.

```text
Inventory
    ↑
Inventory Movement
```

Exact movement types, quantities, references, timestamps, and actor/source fields must be verified from the repository and source specification.

## Related Documents

- 03 — Architecture
- 09 — Features
- 11 — Development
- 12 — Testing
- Related model documents in this phase

## Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-09 | Initial data-model engineering specification. |
