import { makeAssistantToolUI } from "@assistant-ui/react";
import { HypothesesDisplay } from "./hypotheses-display";

export const HypothesesToolUI = makeAssistantToolUI({
    toolName: "generate_hypotheses", // This MUST match the name your agent uses
    render: HypothesesDisplay,
});

export const toolUIs = [
    HypothesesToolUI,
];
