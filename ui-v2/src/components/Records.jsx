import React from "react";
import { TableCell, TableHeaderCell, TableRow } from "@astryxdesign/core/Table";
import { VirtualTable } from "./VirtualTable";
import { useLanguage } from "../lib/i18n";
import * as stylex from "@stylexjs/stylex";
import { HStack } from "@astryxdesign/core/HStack";
import { styles as s } from "./Pages.stylex";

export function Records({ rows, columns, title, actions }) {
  const { t } = useLanguage();
  const count = columns.length + (actions ? 1 : 0);
  return (
    <VirtualTable
      rows={rows}
      caption={<caption {...stylex.props(s.tableCaption)}>{t(title)}</caption>}
      columnCount={count}
      emptyState={
        !rows.length ? (
          <p {...stylex.props(s.recordEmpty)}>{t("no_records")}</p>
        ) : null
      }
      header={
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.key}>
              {t(column.label || column.key)}
            </TableHeaderCell>
          ))}
          {actions && (
            <TableHeaderCell xstyle={[s.recordActions]}>
              {t("actions")}
            </TableHeaderCell>
          )}
        </TableRow>
      }
      renderRow={(row) => (
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column.key}>
              {column.render ? column.render(row) : (row[column.key] ?? "—")}
            </TableCell>
          ))}
          {actions && (
            <TableCell xstyle={[s.recordActions]}>
              <HStack gap={1} wrap="nowrap">
                {actions(row)}
              </HStack>
            </TableCell>
          )}
        </TableRow>
      )}
    />
  );
}
