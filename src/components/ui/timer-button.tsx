import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const timerButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-smooth",
  {
    variants: {
      variant: {
        start: "bg-success hover:bg-success/90 text-success-foreground shadow-lg hover:shadow-xl",
        stop: "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl",
        pause: "bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg hover:shadow-xl",
        primary: "gradient-primary hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-xl",
        secondary: "gradient-secondary hover:opacity-90 text-secondary-foreground shadow-lg hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-16 rounded-lg px-12 text-lg font-semibold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface TimerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof timerButtonVariants> {}

const TimerButton = React.forwardRef<HTMLButtonElement, TimerButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(timerButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
TimerButton.displayName = "TimerButton";

export { TimerButton, timerButtonVariants };