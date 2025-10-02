import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react";

export const ProjectInfoDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "incomplete";

  // Handle loading state
  if (isLoading) {
    return (
      <Card data-stage="project-info" className="mb-4 mt-2 w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Database className="size-4" />
              </div>
              <CardTitle className="text-lg">Project Setup</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Loading
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            I'm retrieving your project information and configuration details.
          </p>
        </CardHeader>
      </Card>
    );
  }

  // Handle completed state
  if (isCompleted) {
    return (
      <Card data-stage="project-info" className="mb-4 mt-2 w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-green-100 text-green-600">
                <CheckCircle className="size-4" />
              </div>
              <CardTitle className="text-lg">Project Setup</CardTitle>
            </div>
            <Badge className="bg-green-600 hover:bg-green-600 text-xs">Complete</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            I now understand your project configuration and context.
          </p>
        </CardHeader>
      </Card>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <Card data-stage="project-info" className="mb-4 mt-2 w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-red-100 text-red-600">
                <AlertCircle className="size-4" />
              </div>
              <CardTitle className="text-lg">Project Setup</CardTitle>
            </div>
            <Badge className="bg-red-600 hover:bg-red-600 text-xs">Failed</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            I couldn't load your project information: {status.reason || "unknown error"}
          </p>
        </CardHeader>
        {status.error && (
          <CardContent className="pt-0">
            <pre className="whitespace-pre-wrap text-xs bg-red-50 text-red-700 p-3 rounded border border-red-200">
              {typeof status.error === 'string' ? status.error : JSON.stringify(status.error, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    );
  }

  // Fallback for any other states
  return (
    <Card data-stage="project-info" className="mb-4 mt-2 w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gray-100 text-gray-600">
              <Database className="size-4" />
            </div>
            <CardTitle className="text-lg">Project Setup</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">{status.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          I'm ready to retrieve your project information.
        </p>
      </CardHeader>
    </Card>
  );
};
