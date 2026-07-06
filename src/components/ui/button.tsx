import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 px-4 py-2.5 text-sm",
  {
    variants: {
      variant: {
        default: "bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
        outline: "border border-slate-300 bg-white hover:bg-slate-50 focus-visible:ring-slate-400",
        soft: "border border-brand-200 bg-white text-brand-800 hover:bg-brand-700 hover:text-white hover:border-brand-700 focus-visible:ring-brand-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        ghost: "hover:bg-slate-100 focus-visible:ring-slate-400",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
