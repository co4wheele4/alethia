# Aletheia – Feature → UI Component Mapping

This document maps features to their corresponding UI components, providing a comprehensive guide for implementing the Aletheia frontend.

---

## 1. Truth Discovery (Core)

### 1.1 Structured Knowledge Views

**Components:**
- `KnowledgeTreeView` - Tree/graph hybrid view
- `KnowledgeNode` - Expandable nodes with lazy loading
- `HierarchyBreadcrumbs` - Breadcrumb always visible to show position in truth hierarchy

**UI Patterns:**
- Recursive tree
- Virtualized lists for scale

**Location:** `app/components/truth-discovery/`

---

### 1.2 Progressive Disclosure

**Components:**
- `SummaryCard` - Summaries shown by default
- `DetailDrawer` - Details slide in from side or expand inline
- `DisclosurePanel` - Clear "More context" affordance

**Location:** `app/components/truth-discovery/`

---

### 1.3 Source Attribution

**Components:**
- `SourceBadge` - Small badges next to fields
- `SourcePopover` - Hover/click to reveal source metadata
- `AttributionFooter` - Includes timestamp, origin, and immutable provenance metadata (no confidence)

**Location:** `app/components/truth-discovery/`

---

## 2. Clarity & Sense-Making

### 2.1 Explainability Panels

**Components:**
- `WhyPanel` - "Why am I seeing this?" link on computed values
- `ExplanationModal` - Step-by-step reasoning shown in plain language
- `ReasoningStepsList` - Detailed reasoning breakdown

**Location:** `app/components/clarity/`

---

### 2.2 Visual State Indicators

**Components:**
- `TruthStateIndicator` - Visual indicator for truth states
- `StatusPill` - Status display component

**States:**
- Known
- Inferred
- User-provided
- Unverified
- Error

**Location:** `app/components/clarity/`

---

### 2.3 Timeline / Change History

**Components:**
- `ChangeTimeline` - Vertical timeline
- `DiffViewer` - Inline diffs for text changes
- `VersionSelector` - Version switching without page reload

**Location:** `app/components/clarity/`

---

## 3. Integrity & Trust

### 3.1 Traceability Signals (No confidence)

**Components:**
- `AuditView` - Audit trail visualization
- `ProvenanceInspector` - Immutable ingestion metadata + parsing surface

**Requirements:**
- Explainability comes from explicit linkage: Document → Chunk → Mention → Entity (not probability)

**Location:** `app/components/integrity/`

---

### 3.2 Error Transparency

**Components:**
- `ErrorBanner` - Human-readable errors
- `InlineErrorCallout` - Inline error display
- `SystemStatusPanel` - System status and health

**Requirements:**
- Clear attribution: system vs user vs data

**Location:** `app/components/integrity/`

---

### 3.3 Audit-Friendly UI

**Components:**
- `AuditView` - Audit trail visualization
- `ImmutableRecordBadge` - Locked styling for immutable records
- `ReadOnlyField` - Read-only field component

**Requirements:**
- No hidden edit affordances

**Location:** `app/components/integrity/`

---

## 4. User Agency

### 4.1 Manual Overrides

**Components:**
- `OverrideToggle` - Explicit override UI
- `OverrideReasonInput` - Mandatory reason entry
- `OverrideHistoryPanel` - Full history visible

**Location:** `app/components/user-agency/`

---

### 4.2 Comparison & Contrast

**Components:**
- `SideBySideCompare` - Synchronized scrolling comparison
- `BeforeAfterView` - Visual diffs highlighted
- `ScenarioSwitcher` - Scenario switching interface

**Location:** `app/components/user-agency/`

---

### 4.3 Unknowns Surfacing

**Components:**
- `MissingDataAlert` - Dedicated UI for gaps
- `ConflictResolver` - Conflict resolution interface
- `UnknownsList` - List of unknown/missing data

**Requirements:**
- Never silently ignored

**Location:** `app/components/user-agency/`

---

## 5. Cognitive Load Reduction

### 5.1 Minimalist Visual Language

**Components:**
- `AletheiaLayout` - Main application layout
- `ContentSurface` - Content container
- `QuietBackground` - Minimal background styling

**Design Principles:**
- Typography-first
- No decorative noise
- Contrast reserved for meaning

**Location:** `app/components/layout/`

---

### 5.2 Focus Modes

**Components:**
- `FocusModeToggle` - Toggle focus mode
- `DistractionFreeView` - Collapses navigation and chrome

**Use Cases:**
- Ideal for reading, review, analysis

**Location:** `app/components/layout/`

---

## 6. Search & Discovery

### 6.1 Semantic Search

**Components:**
- `SemanticSearchBox` - Search input with semantic capabilities
- `SearchResultExplanation` - Results include "why matched"
- `SearchResultList` - Highlight semantic relevance

**Location:** `app/components/search/`

---

### 6.2 Knowledge Graph Navigation

**Components:**
- `KnowledgeGraphCanvas` - Interactive graph view
- `EntityNode` - Entity node in graph
- `RelationshipEdge` - Relationship edge in graph

**Features:**
- Click-through to structured detail pages

**Location:** `app/components/search/`

---

## 7. Ethical UX

### 7.1 No Dark Patterns

**Components:**
- `ExplicitConfirmDialog` - Plain language confirmations
- `ActionSummaryFooter` - Clear outcome statements

**Location:** `app/components/ethical/`

---

### 7.2 Explicit Tradeoffs

**Components:**
- `TradeoffCallout` - Lists consequences before action
- `DecisionImpactPanel` - Impact visualization

**Requirements:**
- No surprise side effects

**Location:** `app/components/ethical/`

---

## 8. Developer-Facing Truth (Dev Mode)

### 8.1 Deterministic UI State

**Components:**
- `StateInspector` - Inspect UI state vs data input
- `SnapshotViewer` - UI state snapshot viewer

**Use Cases:**
- Useful for debugging truth mismatches

**Location:** `app/components/dev/`

---

### 8.2 Observability

**Components:**
- `GraphQLOperationPanel` - Dev-only panels
- `NetworkTraceViewer` - Network request viewer
- `DataShapeInspector` - Data structure inspector

**Features:**
- Shows queries, variables, and responses

**Location:** `app/components/dev/`

---

## 9. Supergraph & AI-Ready

### 9.1 Supergraph Awareness

**Components:**
- `ServiceOwnershipBadge` - Service ownership indicator
- `FederationBoundaryIndicator` - Federation boundary display

**Visibility:**
- Invisible to end users
- Dev/debug mode shows service boundaries

**Location:** `app/components/supergraph/`

---

### 9.2 Explainable AI Hooks

**Components:**
- `AIResultCard` - AI output display
- `AIRationalePanel` - AI reasoning explanation
- `HumanOverrideButton` - Override AI results

**Requirements:**
- AI outputs are never final without explanation
- Overrides always available

**Location:** `app/components/ai/`

---

## Component Organization

```
app/components/
├── truth-discovery/
│   ├── KnowledgeTreeView.tsx
│   ├── KnowledgeNode.tsx
│   ├── HierarchyBreadcrumbs.tsx
│   ├── SummaryCard.tsx
│   ├── DetailDrawer.tsx
│   ├── DisclosurePanel.tsx
│   ├── SourceBadge.tsx
│   ├── SourcePopover.tsx
│   └── AttributionFooter.tsx
├── clarity/
│   ├── WhyPanel.tsx
│   ├── ExplanationModal.tsx
│   ├── ReasoningStepsList.tsx
│   ├── TruthStateIndicator.tsx
│   ├── ConfidenceMeter.tsx
│   ├── StatusPill.tsx
│   ├── ChangeTimeline.tsx
│   ├── DiffViewer.tsx
│   └── VersionSelector.tsx
├── integrity/
│   ├── ConfidenceBar.tsx
│   ├── ConfidenceTooltip.tsx
│   ├── ErrorBanner.tsx
│   ├── InlineErrorCallout.tsx
│   ├── SystemStatusPanel.tsx
│   ├── AuditView.tsx
│   ├── ImmutableRecordBadge.tsx
│   └── ReadOnlyField.tsx
├── user-agency/
│   ├── OverrideToggle.tsx
│   ├── OverrideReasonInput.tsx
│   ├── OverrideHistoryPanel.tsx
│   ├── SideBySideCompare.tsx
│   ├── BeforeAfterView.tsx
│   ├── ScenarioSwitcher.tsx
│   ├── MissingDataAlert.tsx
│   ├── ConflictResolver.tsx
│   └── UnknownsList.tsx
├── layout/
│   ├── AletheiaLayout.tsx
│   ├── ContentSurface.tsx
│   ├── QuietBackground.tsx
│   ├── FocusModeToggle.tsx
│   └── DistractionFreeView.tsx
├── search/
│   ├── SemanticSearchBox.tsx
│   ├── SearchResultExplanation.tsx
│   ├── SearchResultList.tsx
│   ├── KnowledgeGraphCanvas.tsx
│   ├── EntityNode.tsx
│   └── RelationshipEdge.tsx
├── ethical/
│   ├── ExplicitConfirmDialog.tsx
│   ├── ActionSummaryFooter.tsx
│   ├── TradeoffCallout.tsx
│   └── DecisionImpactPanel.tsx
├── dev/
│   ├── StateInspector.tsx
│   ├── SnapshotViewer.tsx
│   ├── GraphQLOperationPanel.tsx
│   ├── NetworkTraceViewer.tsx
│   └── DataShapeInspector.tsx
├── supergraph/
│   ├── ServiceOwnershipBadge.tsx
│   └── FederationBoundaryIndicator.tsx
└── ai/
    ├── AIResultCard.tsx
    ├── AIRationalePanel.tsx
    └── HumanOverrideButton.tsx
```

---

## Implementation Notes

### Design System
- Use Material-UI (MUI) components as base
- Apply Tailwind CSS for custom styling
- Follow minimalist visual language principles
- Ensure accessibility (WCAG 2.1 AA)

### State Management
- Use React hooks for local state
- Apollo Client for GraphQL data
- Consider Context API for shared UI state

### Performance
- Implement lazy loading for tree nodes
- Use virtualization for long lists
- Optimize re-renders with React.memo where appropriate

### Testing
- Unit tests for each component
- Integration tests for feature workflows
- Accessibility testing

---

**Last Updated:** January 2026
