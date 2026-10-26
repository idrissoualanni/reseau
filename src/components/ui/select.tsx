"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectContextValue = {
  value: string[];
  multiple: boolean;
  toggle: (item: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("Les composants Select doivent être utilisés dans <Select>.");
  return context;
}

type SelectProps = {
  multiple?: boolean;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  children: React.ReactNode;
};

function Select({ multiple = false, value = [], onValueChange, children }: SelectProps) {
  const toggle = React.useCallback(
    (item: string) => {
      if (!onValueChange) return;
      if (multiple) {
        onValueChange(
          value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item],
        );
        return;
      }
      onValueChange([item]);
    },
    [multiple, onValueChange, value],
  );

  const context = React.useMemo(
    () => ({ value, multiple, toggle }),
    [value, multiple, toggle],
  );

  return (
    <SelectContext.Provider value={context}>
      <DropdownMenuPrimitive.Root>{children}</DropdownMenuPrimitive.Root>
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      type="button"
      data-slot="select-trigger"
      className={cn(
        "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 opacity-50" />
    </DropdownMenuPrimitive.Trigger>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, multiple } = useSelectContext();
  const label =
    value.length === 0
      ? placeholder
      : multiple
        ? `${value.length} sélectionné${value.length > 1 ? "s" : ""}`
        : value[0];
  return (
    <span data-slot="select-value" className="truncate text-left">
      {label}
    </span>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="select-content"
        sideOffset={4}
        className={cn(
          "bg-popover text-popover-foreground z-50 max-h-72 min-w-[8rem] overflow-y-auto rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

type SelectItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>, "value" | "children">;

function SelectItem({ value, className, children, ...props }: SelectItemProps) {
  const { value: selectedValues, multiple, toggle } = useSelectContext();
  const selected = selectedValues.includes(value);

  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="select-item"
      checked={selected}
      onCheckedChange={() => toggle(value)}
      onSelect={(event) => {
        // En multi-sélection, le menu reste ouvert.
        if (multiple) event.preventDefault();
      }}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
