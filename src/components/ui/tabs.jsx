"use client";

/* eslint-disable react/prop-types */

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [localValue, setLocalValue] = React.useState(defaultValue || value);

  React.useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue) => {
    setLocalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : localValue,
      onValueChange: handleValueChange,
    }),
    [value, localValue, handleValueChange]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsContext = React.createContext({});

const TabsList = ({ children, className }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-muted p-1",
        className
      )}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, disabled, className, children, ...props }) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className, children, ...props }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
