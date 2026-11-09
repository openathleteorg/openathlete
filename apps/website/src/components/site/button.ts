import { type VariantProps, cva } from 'class-variance-authority';

/** Link-shaped buttons: the site has almost no real <button>. */
export const buttonStyles = cva(
  'group/btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-sky/60 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-white shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_8px_20px_-8px_rgb(5_12_52/0.6)] hover:bg-ink-2',
        secondary:
          'border border-border bg-white text-ink shadow-[0_1px_2px_rgb(5_12_52/0.06)] hover:border-ink/25 hover:bg-paper',
        ghost: 'text-ink hover:bg-secondary',
        light: 'bg-white text-ink hover:bg-white/90',
        outlineLight:
          'border border-white/20 text-white hover:border-white/40 hover:bg-white/5',
        coffee:
          'bg-[#ffdd00] text-ink shadow-[0_8px_20px_-10px_rgb(200_160_0/0.9)] hover:bg-[#ffe433]',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[0.95rem]',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
