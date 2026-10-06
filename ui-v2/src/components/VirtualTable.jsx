import React, {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import * as stylex from "@stylexjs/stylex";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@astryxdesign/core/Table";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useAppTheme } from "../lib/theme";
import { useLanguage } from "../lib/i18n";
import { styles } from "./VirtualTable.stylex.js";

function rowKey(row, index) {
  return (
    row?.id ?? row?.date ?? row?.month ?? (Array.isArray(row) ? row[0] : index)
  );
}

// Astryx's default horizontal scroll wrapper would become a second sticky
// containing block. The shared viewport owns both scroll axes instead.
function ScrollContents({ children, beforeTable, afterTable }) {
  return (
    <>
      {beforeTable}
      {children}
      {afterTable}
    </>
  );
}

function usePrinting() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("print");
    const change = () => setPrinting(media.matches);
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    media.addEventListener("change", change);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    change();
    return () => {
      media.removeEventListener("change", change);
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  return printing;
}

export function VirtualTable({
  rows = [],
  renderRow,
  header,
  caption,
  xstyle,
  columnCount = 1,
  estimateSize = 64,
  resetKey,
  rowOffset = 0,
  unknownTotal = false,
  label,
  columnWidths,
}) {
  const { compact } = useAppTheme();
  const { t } = useLanguage();
  const viewport = useRef(null);
  const body = useRef(null);
  const head = useRef(null);
  const captionId = useId();
  const printing = usePrinting();
  const [bodyOffset, setBodyOffset] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const virtualized = rows.length > 12 && !printing;
  const rangeExtractor = useCallback(
    (range) => {
      const indices = defaultRangeExtractor(range);
      if (focusedIndex !== null && focusedIndex < rows.length)
        indices.push(focusedIndex);
      return [...new Set(indices)].sort((a, b) => a - b);
    },
    [focusedIndex, rows.length],
  );
  const virtualizer = useVirtualizer({
    count: rows.length,
    enabled: virtualized,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => rowKey(rows[index], index),
    estimateSize: () => (compact ? estimateSize * 0.75 : estimateSize),
    overscan: 4,
    scrollMargin: bodyOffset,
    scrollPaddingStart: head.current?.offsetHeight || 0,
    rangeExtractor,
  });
  useLayoutEffect(() => {
    const measure = () => {
      if (body.current && viewport.current) {
        setBodyOffset(
          body.current.getBoundingClientRect().top -
            viewport.current.getBoundingClientRect().top +
            viewport.current.scrollTop,
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (head.current) observer.observe(head.current);
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [compact, caption, rows.length]);
  const dataset =
    resetKey ??
    `${rowKey(rows[0], 0)}:${rowKey(rows.at(-1), rows.length - 1)}:${rows.length}`;
  useLayoutEffect(() => {
    viewport.current.scrollTop = 0;
    setFocusedIndex(null);
  }, [dataset]);

  const items = virtualized
    ? virtualizer.getVirtualItems()
    : rows.map((_, index) => ({ index, key: rowKey(rows[index], index) }));
  const bottom =
    virtualized && items.length
      ? Math.max(
          0,
          virtualizer.getTotalSize() - (items.at(-1).end - bodyOffset),
        )
      : 0;
  const spacer = (height) =>
    height > 0 && (
      <TableRow aria-hidden="true" role="presentation">
        <TableCell colSpan={columnCount} xstyle={styles.spacer(height)} />
      </TableRow>
    );
  return (
    <div
      ref={viewport}
      role="region"
      tabIndex={0}
      aria-labelledby={caption ? captionId : undefined}
      aria-label={caption ? undefined : label || t("table_scroll")}
      data-virtualized={virtualized}
      {...stylex.props(styles.viewport)}
      onFocusCapture={(event) => {
        const index = event.target.closest("[data-index]")?.dataset.index;
        if (index !== undefined) setFocusedIndex(Number(index));
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusedIndex(null);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !virtualized) return;
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          virtualizer.scrollToIndex(
            event.key === "Home" ? 0 : rows.length - 1,
            { align: event.key === "Home" ? "start" : "end" },
          );
        }
      }}
    >
      <Table
        scrollWrapper={ScrollContents}
        density={compact ? "compact" : "balanced"}
        dividers="rows"
        hasHover
        aria-rowcount={unknownTotal ? -1 : rows.length + 1}
        xstyle={[
          xstyle,
          styles.table,
          columnCount > 6 && styles.wide(columnCount),
        ]}
      >
        {caption && cloneElement(caption, { id: captionId })}
        {columnWidths && (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={index} {...stylex.props(styles.column(width))} />
            ))}
          </colgroup>
        )}
        <TableHeader ref={head} xstyle={styles.header}>
          {header}
        </TableHeader>
        <TableBody ref={body}>
          {items.map((item, position) => (
            <React.Fragment key={item.key}>
              {virtualized &&
                spacer(
                  Math.max(
                    0,
                    item.start -
                      (position ? items[position - 1].end : bodyOffset),
                  ),
                )}
              {cloneElement(renderRow(rows[item.index], item.index), {
                key: item.key,
                "data-index": item.index,
                "aria-rowindex": rowOffset + item.index + 2,
                ref: virtualized ? virtualizer.measureElement : undefined,
              })}
            </React.Fragment>
          ))}
          {spacer(bottom)}
        </TableBody>
      </Table>
    </div>
  );
}
