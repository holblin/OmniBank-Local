import React from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "./Icon";
import { useAppTheme } from "../lib/theme";
import { useIsMutating } from "@tanstack/react-query";

export function ActionButton({
  label,
  icon,
  ...props
}: Omit<React.ComponentProps<typeof IconButton>, "icon"> & {
  icon: React.ComponentProps<typeof Icon>["name"];
}) {
  const { compact } = useAppTheme();
  const writing = useIsMutating() > 0;
  return (
    <IconButton
      label={label}
      tooltip={label}
      icon={<Icon name={icon} size={18} />}
      variant="ghost"
      size={compact ? "sm" : "md"}
      {...props}
      isDisabled={writing || props.isDisabled}
    />
  );
}
