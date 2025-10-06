declare module 'html-to-image' {
  export function toPng(
    node: HTMLElement,
    options?: {
      pixelRatio?: number;
      cacheBust?: boolean;
      backgroundColor?: string;
      width?: number;
      height?: number;
      style?: Partial<CSSStyleDeclaration>;
      filter?: (node: HTMLElement) => boolean;
      canvasWidth?: number;
      canvasHeight?: number;
    },
  ): Promise<string>;
}
