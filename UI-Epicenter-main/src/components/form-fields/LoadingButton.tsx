import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export const LoadingButton = ({ 
  loading, 
  text, 
  loadingText = "Processing..." 
}: { 
  loading: boolean; 
  text: string; 
  loadingText?: string;
}) => (
  <Button
    type="submit"
    variant="hpButton"
    className="px-8 min-w-[120px] flex items-center justify-center"
    disabled={loading}
  >
    {loading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingText}
      </>
    ) : (
      text
    )}
  </Button>
);
