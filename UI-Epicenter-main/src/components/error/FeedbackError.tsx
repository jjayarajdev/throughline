import { AlertCircle } from "lucide-react";

export default function FeedbackError({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {message || "Failed to load feedback form."}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please check the link or contact support if the issue persists.
        </p>
      </div>
    </div>
  );
}
