import {
  Activity,
  Bluetooth,
  Network,
  RadioTower,
  Smartphone,
  Wifi,
} from "lucide-react";
import { cn } from "@/core/lib/utils";
import type { AnalysisHostCounts } from "../types/analysis.types";

interface StatCardsProps {
  counts?: AnalysisHostCounts;
  activeType: string;
  onSelect: (type: string) => void;
}

const CARDS: Array<{
  key: keyof AnalysisHostCounts;
  label: string;
  icon: React.ElementType;
}> = [
  { key: "ap", label: "APs", icon: RadioTower },
  { key: "bssid", label: "BSSIDs", icon: Network },
  { key: "ssid", label: "SSIDs", icon: Wifi },
  { key: "client", label: "Clientes", icon: Smartphone },
  { key: "channel", label: "Canales", icon: Activity },
  { key: "probingClient", label: "Probing clients", icon: Network },
  { key: "bluetoothDevice", label: "Bluetooth", icon: Bluetooth },
];

export const StatCards = ({
  counts,
  activeType,
  onSelect,
}: StatCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
      {CARDS.map((card) => {
        const value = counts?.[card.key] ?? 0;
        const active = activeType === card.key;
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
              active
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xl font-bold">{value}</span>
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </button>
        );
      })}
    </div>
  );
};