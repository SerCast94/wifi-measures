declare module "html2canvas" {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string | null;
    width?: number;
    height?: number;
    logging?: boolean;
    onclone?: (document: Document) => void;
    foreignObjectRendering?: boolean;
    ignoreElements?: (element: Element) => boolean;
  }

  const html2canvas: (
    element: HTMLElement,
    options?: Html2CanvasOptions
  ) => Promise<HTMLCanvasElement>;

  export default html2canvas;
}
