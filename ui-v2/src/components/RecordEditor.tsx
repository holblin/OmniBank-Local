import React, { useId } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { Field, Editor } from "./Page";
import { styles as s } from "./Pages.stylex";
import { useLanguage } from "../lib/i18n";

// Explicit field definitions belong to each domain page. This component owns
// only accessible form controls and dialog submission, never API semantics.
export function RecordEditor({
  title,
  fields,
  initial,
  busy,
  error,
  onClose,
  onSave,
}: {
  title: string;
  fields: import("../lib/ui-types").FieldDefinition[];
  initial: object;
  busy?: boolean;
  error?: boolean;
  onClose: () => void;
  onSave: (body: import("../lib/ui-types").FormValues) => unknown;
}) {
  const formId = useId();
  const values = initial as import("../lib/ui-types").FormValues;
  const { t } = useLanguage();
  return (
    <Editor title={title} busy={busy} error={error} onClose={onClose}
      actions={<Button form={formId} type="submit" variant="primary" label={t("save")} isLoading={busy} />} >
      <form id={formId}
        {...stylex.props(s.form)}
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const body: import("../lib/ui-types").FormValues = {};
          for (const field of fields) {
            const value = String(values.get(field.name) ?? "");
            body[field.name] =
              field.type === "checkbox"
                ? values.has(field.name)
                : field.type === "number"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value === "" && field.nullable
                    ? null
                    : value;
          }
          onSave(body);
        }}
      >
        {fields.map((field) => (
          <Field key={field.name} label={t(field.label || field.name)}>
            {field.options ? (
              <select
                name={field.name}
                required={field.required}
                defaultValue={String(values[field.name] ?? "")}
                {...stylex.props(s.fieldSelect)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label ?? t(option.value)}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                name={field.name}
                required={field.required}
                defaultValue={String(values[field.name] ?? "")}
                rows={5}
                {...stylex.props(s.fieldTextarea)}
              />
            ) : (
              <input
                name={field.name}
                type={field.type || "text"}
                required={field.required}
                pattern={
                  field.required && (!field.type || field.type === "text")
                    ? ".*\\S.*"
                    : undefined
                }
                min={field.min}
                max={field.max}
                step={
                  field.type === "number" ? (field.step ?? "0.01") : undefined
                }
                defaultValue={
                  field.type === "checkbox"
                    ? undefined
                    : String(values[field.name] ?? "")
                }
                defaultChecked={
                  field.type === "checkbox"
                    ? Boolean(values[field.name])
                    : undefined
                }
                {...stylex.props(
                  field.type === "checkbox" ? s.check : s.fieldInput,
                )}
              />
            )}
          </Field>
        ))}
      </form>
    </Editor>
  );
}
