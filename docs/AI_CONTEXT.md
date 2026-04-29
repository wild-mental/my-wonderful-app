# AI Context: Super-Calc Prototype

{
  "project": "Super-Calc UI Prototype",
  "stack": ["React", "TypeScript", "TailwindCSS", "React Router", "shadcn/ui", "Lucide React"],
  "architecture": {
    "type": "Client-side SPA",
    "routing": "Nested routing with Layout and AdminLayout separation",
    "data_flow": "Mocks decoupled in src/app/data/mock.ts to prevent view-layer contamination"
  },
  "key_patterns": [
    "Custom Hooks: useModal, useDebounce",
    "Tailwind: cn() utility for class merging, group-hover for micro-animations",
    "Performance: React.memo (IngredientBadge, StatCard), useCallback (event handlers)"
  ],
  "recent_updates": "Extracted UI constants (ERROR_TYPE_MAP, BADGE_CONFIG), split large components (SourceInfoModal), applied premium visual hierarchy to Admin stat cards.",
  "doc_strategy": "All major files have @file JSDoc/docstrings summarizing component intent and sequential function call flows for rapid context ingestion."
}
