import { cn } from '@/utils/shadcn';
import { Sparkles } from 'lucide-react';
import { ComponentProps, useEffect, useRef } from 'react';

interface SparklesIconProps extends ComponentProps<typeof Sparkles> {
  className?: string;
}

export function SparklesIcon({ className, ...props }: SparklesIconProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (wrapperRef.current && svgRef.current) {
      // Get the SVG element and serialize it to use as mask
      const svg = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svg);
      const encodedSvg = encodeURIComponent(svgString);
      const maskUrl = `url("data:image/svg+xml,${encodedSvg}")`;

      wrapperRef.current.style.webkitMaskImage = maskUrl;
      wrapperRef.current.style.maskImage = maskUrl;
      wrapperRef.current.style.webkitMaskSize = 'contain';
      wrapperRef.current.style.maskSize = 'contain';
      wrapperRef.current.style.webkitMaskRepeat = 'no-repeat';
      wrapperRef.current.style.maskRepeat = 'no-repeat';
      wrapperRef.current.style.webkitMaskPosition = 'center';
      wrapperRef.current.style.maskPosition = 'center';
    }
  }, []);

  return (
    <span ref={wrapperRef} className="ai-sparkles-icon-wrapper">
      <Sparkles
        ref={svgRef}
        className={cn('ai-sparkles-icon', className)}
        {...props}
      />
    </span>
  );
}
