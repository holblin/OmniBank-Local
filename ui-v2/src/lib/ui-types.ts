import type { ReactNode } from "react";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { Profile } from "./server/workspaces";

export type XStyle = StyleXStyles;
export type Write = {
  path: string;
  method?: "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown> | number[];
};
export type PendingAction = {
  write: Write;
  label: string;
  description: string;
};
export interface ResourceState {
  profile?: Profile;
  data?: unknown;
  loading: boolean;
  error: boolean;
  fetching?: boolean;
  refresh: () => unknown;
}
export interface FieldDefinition {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  nullable?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  options?: { value: string | number; label?: string }[];
}
export type FormValue = string | number | boolean | null;
export type FormValues = Record<string, FormValue>;
export type EditorProps = {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  busy?: boolean;
  error?: boolean;
};
