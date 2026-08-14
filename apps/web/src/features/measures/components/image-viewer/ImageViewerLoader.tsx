interface ImageViewerLoaderProps {
  pendingMessage: string;
}

export const ImageViewerLoader = ({
  pendingMessage,
}: ImageViewerLoaderProps) => {
  return (
    <div
      id="loader"
      className="absolute inset-0 z-20 h-full bg-black/50"
      onClick={(e) => e.preventDefault()}
    >
      <div className="spinner"></div>
      <p className="text-foreground">{pendingMessage}</p>
    </div>
  );
};
