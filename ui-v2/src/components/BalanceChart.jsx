import { TableRow, TableCell, TableHeaderCell } from "@astryxdesign/core/Table";
import { VirtualTable } from "./VirtualTable";
import * as stylex from "@stylexjs/stylex";
import React, { useMemo } from "react";
import { areaY, defineChart, dot, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useAppTheme } from "../lib/theme";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "./Dashboard.stylex.js";
export function BalanceChart({ history, currency }) {
  const { t, date, locale, money } = useLanguage();
  const { accent, border, muted } = useAppTheme();
  const definition = useMemo(() => {
    const tickDates = history
      .filter(
        (_, index) => index % Math.max(1, Math.ceil(history.length / 5)) === 0,
      )
      .map((point) => point.date);
    return defineChart({
      marks: [
        areaY(history, {
          x: "date",
          y: "balance",
          fill: accent,
          fillOpacity: 0.08,
        }),
        lineY(history, {
          x: "date",
          y: "balance",
          stroke: accent,
          strokeWidth: 2,
        }),
        ...(history.length === 1
          ? [
              dot(history, {
                x: "date",
                y: "balance",
                fill: accent,
                r: 4,
              }),
            ]
          : []),
      ],
      scales: {
        x: {
          scale: scalePoint,
          axis: {
            line: false,
            ticks: {
              values: tickDates,
              format: (value) => date(value),
              size: 0,
              padding: 10,
            },
            tickLabels: {
              fontSize: 10,
              fill: muted,
            },
          },
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: {
            stroke: border,
            strokeWidth: 1,
          },
          axis: {
            line: false,
            ticks: {
              count: 4,
              size: 0,
              padding: 10,
              format: (value) =>
                new Intl.NumberFormat(locale, {
                  notation: "compact",
                }).format(value),
            },
            tickLabels: {
              fontSize: 10,
              fill: muted,
            },
          },
        },
      },
      tooltip: {
        use: tooltip,
        format: (point) =>
          `${date(point.datum.date)} · ${money(point.datum.balance, currency)}`,
      },
    });
  }, [history, currency, locale, accent, border, muted]);
  return (
    <div {...stylex.props(s.chart)}>
      <Chart
        definition={definition}
        height={211}
        ariaLabel={t("balance_chart")}
      />
      <details {...stylex.props(s.chartData)}>
        <summary {...stylex.props(s.chartDataSummary)}>
          {t("chart_data")}
        </summary>
        <VirtualTable
          rows={history}
          renderRow={(point) => (
            <TableRow key={point.date}>
              <TableCell xstyle={[s.chartDataTd]}>{date(point.date)}</TableCell>
              <TableCell xstyle={[s.chartDataTd]}>
                {money(point.balance, currency)}
              </TableCell>
            </TableRow>
          )}
          header={
            <>
              <TableRow isHeaderRow>
                <TableHeaderCell xstyle={[s.chartDataTh]} scope="col">
                  {t("date")}
                </TableHeaderCell>
                <TableHeaderCell xstyle={[s.chartDataTh]} scope="col">
                  {t("balance")}
                </TableHeaderCell>
              </TableRow>
            </>
          }
          columnCount={2}
          xstyle={[s.chartDataTable]}
        />
      </details>
    </div>
  );
}
