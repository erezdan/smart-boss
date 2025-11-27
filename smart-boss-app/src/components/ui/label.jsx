import * as React from "react";
import { cn } from "../../utiles/utiles"; // helper to merge class names

/**
 * Generic Label component
 * Neutral by default, supports dark mode and className override
 */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium text-gray-700 dark:text-gray-200",
      className
    )}
    {...props}
  />
));

Label.displayName = "Label";

export { Label };
