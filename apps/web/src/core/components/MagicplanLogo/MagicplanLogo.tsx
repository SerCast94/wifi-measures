import { cn } from "@/core/lib/utils";
import { useTheme } from "@/core/providers/ThemeProvider/ThemeProvider";
import MagicplanLogoOnDark from "@/assets/images/logos/magicplan-logo-on-dark.svg";
import MagicplanLogoOnLight from "@/assets/images/logos/magicplan-logo-on-light.svg";

interface MagicplanLogoProps {
  className?: string;
}

const MagicplanLogo = ({ className }: MagicplanLogoProps) => {
  const { isInDarkMode } = useTheme();

  return (
    <img
      src={isInDarkMode ? MagicplanLogoOnDark : MagicplanLogoOnLight}
      alt="magicplan-logo"
      className={cn("w-6 h-6", className)}
    />
  );
};

export default MagicplanLogo;
