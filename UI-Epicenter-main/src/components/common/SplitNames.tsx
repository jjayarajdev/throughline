import React from "react";
import { Circle } from "lucide-react"; // optional: replace with your preferred dot icon

interface SplitnameTypeProps {
  names?: string | null;
}

export const SplitNames: React.FC<SplitnameTypeProps> = ({
  names,
}) => {
  if (!names) return null;

  const types = names
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean); 

  return (
    <div className="space-y-1">
      {types.map((type, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <p className="whitespace-pre-line">{type}</p>
        </div>
      ))}
    </div>
  );
};
