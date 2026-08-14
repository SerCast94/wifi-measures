// components/ProgressBar.tsx

import { Progress } from "./progress";

interface ProgressBarProps {
  value: number; // entre 0 y 100
  label?: string;
}

export const ProgressBar = ({ value, label }: ProgressBarProps) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {label && <p className="mb-1 text-sm text-muted-foreground">{label}</p>}
      <div className="relative h-4 overflow-hidden text-white rounded-full bg-primary-800">
        <Progress value={value} style={{ width: `${value}%` }} />
        <div className="absolute inset-0 flex items-center justify-center text-xs">
          {value}%
        </div>
      </div>
    </div>
  );
};
