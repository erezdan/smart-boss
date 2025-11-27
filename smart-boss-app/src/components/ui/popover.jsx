import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverContent = React.forwardRef(
  (
    {
      className = "",
      side = "bottom",
      align = "start",
      sideOffset = 8,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={`z-[100] rounded-md border bg-white p-0 shadow-lg outline-none ${className}`}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = "PopoverContent";
