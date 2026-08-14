import { useState, useEffect } from "react";

import { Search, X } from "lucide-react";

import { Input } from "./input";
import { Button } from "./button";

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  debounce?: number;
  placeholder?: string;
  className?: string;
  autofocus?: boolean;
}

export const DebouncedInput = ({
  value,
  onChange,
  disabled = false,
  debounce = 500,
  placeholder = "Escribe algo...",
  className = "",
  autofocus = false,
}: DebouncedInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      onChange(inputValue);
    }, debounce);

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, onChange, debounce]);

  const handleClear = () => {
    setInputValue("");
    onChange("");
  };

  return (
    <div className="relative w-full">
      <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
      <Input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        autoFocus={autofocus}
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="absolute w-6 h-6 p-0 text-gray-500 transform -translate-y-1/2 right-2 top-1/2 hover:text-gray-700"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
