import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ErrorPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Square,
} from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownText } from "./markdown-text";
import { ToolFallback } from "./tool-fallback";
import { toolUIs } from "./tool-registry";

export const Thread: FC = () => {

  return (
    <ThreadPrimitive.Root
      // aui-thread-root
      className="bg-background flex h-full flex-col"
      style={{
        ["--thread-max-width" as string]: "48rem",
        ["--thread-padding-x" as string]: "0rem",
      }}
    >
      {/* Render all registered tool UIs */}
      {toolUIs.map((ToolUI, index) => (
        <ToolUI key={index} />
      ))}

      {/* aui-thread-viewport */}
      <ThreadPrimitive.Viewport data-aui="thread-viewport" className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />

        {/* Loading state is now managed by assistant-ui primitives */}

        <ThreadPrimitive.If empty={false}>
          {/* aui-thread-viewport-spacer */}
          <motion.div className="min-h-6 min-w-6 shrink-0" />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <Composer />
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC<{ inline?: boolean }> = ({ inline = false }) => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        // aui-thread-scroll-to-bottom
        className={cn(
          "rounded-full disabled:invisible",
          inline
            ? "p-2 size-8"
            : "dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center p-4",
        )}
      >
        <ArrowDownIcon className={cn(inline ? "size-4" : undefined)} />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      {/* aui-thread-welcome-root */}
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
        {/* aui-thread-welcome-center */}
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          {/* aui-thread-welcome-message */}
          <div className="flex size-full flex-col justify-center px-8 md:mt-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.5 }}
              // aui-thread-welcome-message-motion-1
              className="text-2xl font-semibold"
            >
              Hello there!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
              // aui-thread-welcome-message-motion-2
              className="text-muted-foreground/65 text-2xl"
            >
              How can I help you today?
            </motion.div>
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    // aui-thread-welcome-suggestions
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {[
        {
          title: "Boost my Add-to-Cart",
          label: "conversion rate by improving my product page",
          action: "Boost my Add-to-Cart conversion rate by improving my product page",
        },
      ].map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          // aui-thread-welcome-suggestion-display
          className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block"
        >
          <ThreadPrimitive.Suggestion
            prompt={suggestedAction.action}
            method="replace"
            autoSend
            asChild
          >
            <Button
              variant="ghost"
              // aui-thread-welcome-suggestion
              className="dark:hover:bg-accent/60 h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
              aria-label={suggestedAction.action}
            >
              {/* aui-thread-welcome-suggestion-text-1 */}
              <span className="font-medium">{suggestedAction.title}</span>
              {/* aui-thread-welcome-suggestion-text-2 */}
              <p className="text-muted-foreground">{suggestedAction.label}</p>
            </Button>
          </ThreadPrimitive.Suggestion>
        </motion.div>
      ))}
    </div>
  );
};

const ComposerSuggestions: FC = () => {
  // Detect current stage by checking rendered tool cards in the viewport
  // Priority order reflects the funnel: brand-analysis -> hypotheses -> variants -> experiment-creation
  let stage: "brand-analysis" | "hypotheses" | "variants" | "experiment-creation" | "welcome" = "welcome";

  if (typeof window !== "undefined") {
    const viewport = document.querySelector('[data-aui="thread-viewport"]') || document;
    if (viewport.querySelector('[data-stage="experiment-creation"]')) {
      stage = "experiment-creation";
    } else if (viewport.querySelector('[data-stage="variants"]')) {
      stage = "variants";
    } else if (viewport.querySelector('[data-stage="hypotheses"]')) {
      stage = "hypotheses";
    } else if (viewport.querySelector('[data-stage="brand-analysis"]')) {
      stage = "brand-analysis";
    }
  }

  const stageToSuggestions: Record<string, { label: string; prompt: string }[]> = {
    welcome: [
      { label: "Let's look at the Brand Analysis", prompt: "Let's look at the brand analysis" },
      { label: "Go straight to Experiment Creation", prompt: "Let's go straight to experiment creation" },
    ],
    "brand-analysis": [
      { label: "Generate hypotheses", prompt: "Based on the brand analysis, generate testable hypotheses" },
      { label: "Show key brand insights", prompt: "Summarize the key insights from the brand analysis" },
    ],
    hypotheses: [
      { label: "Create variants for top hypothesis", prompt: "Create variants for the top scoring hypothesis" },
      { label: "Refine hypotheses", prompt: "Refine the hypotheses to be more specific and testable" },
    ],
    variants: [
      { label: "Proceed to experiment setup", prompt: "Proceed to experiment setup and configuration" },
      { label: "Generate more variants", prompt: "Generate more variants with different creative directions" },
      { label: "QA the generated variants", prompt: "Run a QA checklist on the generated variants" },
    ],
    "experiment-creation": [
      { label: "Configure traffic & targeting", prompt: "Configure experiment traffic allocation and targeting rules" },
      { label: "Prepare launch checklist", prompt: "Prepare a pre-launch checklist for the experiment" },
      { label: "Launch experiment", prompt: "Launch the experiment when ready" },
    ],
  };

  const suggestions = stageToSuggestions[stage] || stageToSuggestions.welcome;

  // Simple scroll-aware visibility (no debounce, basic direction check)
  const [isVisible, setIsVisible] = useState(true);
  const lastTopRef = useRef(0);

  useEffect(() => {
    const viewport = document.querySelector<HTMLDivElement>('[data-aui="thread-viewport"]');
    if (!viewport) return;

    const onScroll = () => {
      const cur = viewport.scrollTop;
      const last = lastTopRef.current;
      if (Math.abs(cur - last) < 2) return;
      // up => hide, down => show
      setIsVisible(cur >= last);
      lastTopRef.current = cur;
    };

    viewport.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => viewport.removeEventListener('scroll', onScroll as any);
  }, []);

  return (
    // aui-composer-inline-suggestions
    <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-3 px-2">
      {/* Not running: toggle between row and centered button with wait mode to prevent overlap */}
      <ThreadPrimitive.If running={false}>
        <AnimatePresence initial={false} mode="wait">
          {isVisible ? (
            <motion.div
              key="row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="flex flex-wrap items-center justify-start gap-2"
            >
              {suggestions.slice(0, 3).map((s, i) => (
                <div className="pointer-events-auto" key={`composer-suggestion-${i}`}>
                  <ThreadPrimitive.Suggestion
                    prompt={s.prompt}
                    method="replace"
                    autoSend
                    asChild
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full border border-gray-200/70 bg-white/70 text-gray-800 shadow-xs hover:bg-black hover:text-white dark:border-gray-700/60 dark:bg-gray-900/60 dark:text-gray-100 dark:hover:bg-white dark:hover:text-black transition-all backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm ease-in-out duration-300"
                    >
                      {s.label}
                    </Button>
                  </ThreadPrimitive.Suggestion>
                </div>
              ))}
              <div className="pointer-events-auto">
                <ThreadScrollToBottom inline />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <div className="pointer-events-auto">
                <ThreadScrollToBottom inline />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ThreadPrimitive.If>

      {/* Running: always show centered scroll button. Separate presence with wait to avoid overlap transitions */}
      <ThreadPrimitive.If running>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key="center-running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <div className="pointer-events-auto">
              <ThreadScrollToBottom inline />
            </div>
          </motion.div>
        </AnimatePresence>
      </ThreadPrimitive.If>
    </div>
  );
};

const Composer: FC = () => {
  // Loading state is now managed by assistant-ui primitives

  return (
    // aui-composer-wrapper
    <div className="bg-background relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6">
      {/* removed: separate floating scroll button; now shown inline with suggestions */}
      <ThreadPrimitive.Empty>
        <ThreadWelcomeSuggestions />
      </ThreadPrimitive.Empty>
      {/* aui-composer-root */}
      <ComposerPrimitive.Root className="relative flex w-full items-center rounded-2xl bg-gray-100 border border-gray-200 focus-within:ring-1 focus-within:ring-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:focus-within:ring-gray-600">
        <ComposerSuggestions />
        {/* aui-composer-input */}
        <ComposerPrimitive.Input
          placeholder="Send a message..."
          className="bg-transparent placeholder:text-gray-400 max-h-[calc(50dvh)] min-h-12 w-full resize-none rounded-2xl px-4 py-3 pr-16 text-base outline-none text-gray-900 dark:text-gray-100"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </div>
  );
};

const ComposerAction: FC = () => {
  // Loading state is now managed by assistant-ui primitives

  return (
    // aui-composer-action-wrapper
    <div className="flex items-center justify-end pr-2">
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <button
            type="submit"
            // aui-composer-send
            className="bg-black hover:bg-gray-800 text-white size-9 rounded-full border-0 flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
            aria-label="Send message"
          >
            {/* aui-composer-send-icon */}
            <ArrowUpIcon className="size-4" />
          </button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button
            type="button"
            // aui-composer-cancel
            className="bg-black hover:bg-gray-800 text-white size-9 rounded-full border-0 flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
            aria-label="Stop generating"
          >
            {/* aui-composer-cancel-icon */}
            <Square className="size-3 fill-white" />
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      {/* aui-message-error-root */}
      <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
        {/* aui-message-error-message */}
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        // aui-assistant-message-root
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        {/* aui-assistant-message-avatar */}
        <div className="ring-border bg-background col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 overflow-hidden relative">
          <NextImage
            src="/assets/logo_small.png"
            alt="Agent avatar"
            fill
            sizes="32px"
            className="object-cover"
            priority={false}
          />
        </div>

        {/* aui-assistant-message-content */}
        <div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 leading-7 break-words">
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
            }}
          />
          <MessageError />
        </div>

        <AssistantActionBar />

        {/* aui-assistant-branch-picker */}
        <BranchPicker className="col-start-2 row-start-2 mr-2 -ml-2" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      // aui-assistant-action-bar-root
      className="text-muted-foreground data-floating:bg-background col-start-3 row-start-2 mt-3 ml-3 flex gap-1 data-floating:absolute data-floating:mt-2 data-floating:rounded-md data-floating:border data-floating:p-1 data-floating:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        // aui-user-message-root
        className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-1 px-[var(--thread-padding-x)] py-4 [&:where(>*)]:col-start-2"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <UserActionBar />

        {/* aui-user-message-content */}
        <div className="bg-muted text-foreground col-start-2 rounded-3xl px-5 py-2.5 break-words">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>

        {/* aui-user-branch-picker */}
        <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      // aui-user-action-bar-root
      className="col-start-1 mt-2.5 mr-3 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    // aui-edit-composer-wrapper
    <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)]">
      {/* aui-edit-composer-root */}
      <ComposerPrimitive.Root className="bg-muted ml-auto flex w-full max-w-7/8 flex-col rounded-xl">
        {/* aui-edit-composer-input */}
        <ComposerPrimitive.Input
          className="text-foreground flex min-h-[60px] w-full resize-none bg-transparent p-4 outline-none"
          autoFocus
        />

        {/* aui-edit-composer-footer */}
        <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      // aui-branch-picker-root
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      {/* aui-branch-picker-state */}
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

