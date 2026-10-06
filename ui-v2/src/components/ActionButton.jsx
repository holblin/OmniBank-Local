import React from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "./Icon";
import { useAppTheme } from "../lib/theme";

export function ActionButton({ label, icon, ...props }) {
  const { compact } = useAppTheme();
  return (
    <IconButton
      label={label}
      tooltip={label}
      icon={<Icon name={icon} size={18} />}
      variant="ghost"
      size={compact ? "sm" : "md"}
      {...props}
    />
  );
}
