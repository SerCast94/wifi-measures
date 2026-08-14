import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/core/atomic-components/avatar";

interface AvatarListProps {
  sources: string[];
  borderClass?: string;
}

export const AvatarList: React.FC<AvatarListProps> = ({
  sources,
  borderClass,
}) => {
  return (
    <div className="flex -space-x-4">
      {sources.map((src, index) => (
        <Avatar key={index} className={borderClass}>
          <AvatarImage src={src} alt={`Avatar ${index + 1}`} />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
};
