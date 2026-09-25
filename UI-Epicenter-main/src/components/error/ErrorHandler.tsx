import { XCircle, X, AlertCircle, Inbox } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AxiosError } from "axios";
import { LoadingSpinner } from "../ui/spinner";
import { Card } from "../ui/card";

interface ApiErrorResponse {
  status: boolean;
  statusCode: string;
  message: string;
  data?: any;
}

interface ErrorHandlerProps {
  error?: Error | AxiosError | null;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onRetry?: () => void;
}

export function ErrorHandler({
  error,
  isLoading,
  isEmpty,
  emptyMessage = "No data found",
  emptyDescription = "",
  onRetry,
  onClose
}: ErrorHandlerProps & { onClose?: () => void }) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    let errorMessage = "Something went wrong. Please try again.";

    if (error instanceof AxiosError) {
      const errorResponse = error.response?.data as ApiErrorResponse;
      errorMessage = errorResponse?.message || error.message;
    }

    return (
      <Alert variant="destructive" className="border-red-500/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm mt-2">
          {errorMessage === "Object reference not set to an instance of an object."
            ? "No data available at the moment. Please try again later."
            : errorMessage}
        </AlertDescription>
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="bg-[#01a982] hover:bg-[#01a982]/90"
            >
              Try Again
            </Button>
          )}
          {onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Dismiss
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <Card className="p-8 dark:bg-gray-800">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Inbox className="h-12 w-12 text-[#01a982]" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold dark:text-white text-gray-900">
              {emptyMessage}
            </h3>
            <p className="text-sm text-gray-500">
              {emptyDescription}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}