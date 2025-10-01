import { makeAssistantToolUI } from "@assistant-ui/react";
import { HypothesesDisplay } from "./hypotheses-display";
import { VariantsDisplay } from "./variants-display";
import { BrandAnalysisDisplay } from "./brand-analysis-display";
import { ExperimentCreationDisplay } from "./experiment-creation-display";
import { ExperimentPreviewDisplay } from "./experiment-preview-display";

export const HypothesesToolUI = makeAssistantToolUI({
    toolName: "generate_hypotheses", // This MUST match the name your agent uses
    render: HypothesesDisplay,
});

export const VariantsToolUI = makeAssistantToolUI({
    toolName: "generate_variants", // This MUST match the name your agent uses
    render: VariantsDisplay,
});

export const BrandAnalysisToolUI = makeAssistantToolUI({
    toolName: "get_brand_analysis", // This MUST match the name your agent uses
    render: BrandAnalysisDisplay,
});

export const ExperimentCreationToolUI = makeAssistantToolUI({
    toolName: "create_experiment", // This MUST match the name your agent uses
    render: ExperimentCreationDisplay,
});

// Hidden tool UI for check_variants - doesn't show any UI
export const CheckVariantsToolUI = makeAssistantToolUI({
    toolName: "check_variants", // This MUST match the name your agent uses
    render: () => null, // Return null to hide the function call message
});

export const ExperimentPreviewToolUI = makeAssistantToolUI({
    toolName: "preview_experiment", // This MUST match the name your agent uses
    render: ExperimentPreviewDisplay,
});

export const toolUIs = [
    HypothesesToolUI,
    VariantsToolUI,
    BrandAnalysisToolUI,
    ExperimentCreationToolUI,
    CheckVariantsToolUI,
    ExperimentPreviewToolUI,
];
