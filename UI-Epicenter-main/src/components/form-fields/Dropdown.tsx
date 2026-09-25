import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Filter } from "lucide-react";
import clsx from "clsx";

type RoundType = {
  value?: number | string;
  id?: number | string;
  name?: string;
};

interface RoundDropdownProps {
  options: RoundType[];
  onSelect: (item: RoundType) => void;
  defaultLabel?: string;
  index?: number;
  isLableVisible?: boolean;
}

export default function RoundDropdown({
  options,
  onSelect,
  defaultLabel,
  index,
  isLableVisible = true,
}: RoundDropdownProps) {
  const [selected, setSelected] = useState<RoundType | null>(() => {
    return options && options.length > 0 ? options[index] : null;
  });

  useEffect(() => {
    if (selected && options.length > 0) {
      onSelect(selected);
    }
  }, []);

  useEffect(() => {
    if (options && options.length > 0 && !selected) {
      const defaultOption = options[index] || options[0];
      setSelected(defaultOption);
      onSelect(defaultOption);
    }
  }, [options]);

  const handleSelect = (item: RoundType) => {
    setSelected(item);
    onSelect(item);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isLableVisible ? "outline" : "ghost"}
          className="w-auto justify-between bg-transparent *:hover:bg-transparent"
        >
          {isLableVisible && (
            <>{selected ? selected.name  : defaultLabel || "Select..."}</>
          )}
          <Filter className=" h-4 w-4 text-green-700" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        {options.map((item, index) => (
          <DropdownMenuItem
            className={clsx(
              "flex items-center justify-between cursor-pointer")}
            key={index}
            onClick={() => handleSelect(item)}
          >
            {item.name}
            {(selected?.name === item.name) && (
              <Check className="h-4 w-4 text-green-700" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
