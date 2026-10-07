import * as stylex from "@stylexjs/stylex";
import { styles as s } from "./Pages.stylex";
import React, { useMemo } from "react";
import { defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useLanguage } from "../lib/i18n";
import { useAppTheme } from "../lib/theme";
export default function SummaryChart({
  points,
  currency,
}: {
  points: { month: string; income: number; expense: number }[];
  currency?: string;
}) {
  const { t, money, locale, privacy } = useLanguage();
  const { accent, border, muted } = useAppTheme();
  const chart = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(points, {
            x: "month",
            y: "income",
            stroke: accent,
            strokeWidth: 2,
          }),
          lineY(points, {
            x: "month",
            y: "expense",
            stroke: muted,
            strokeWidth: 2,
            strokeDasharray: "5,4",
          }),
        ],
        scales: {
          x: {
            scale: scalePoint,
            axis: {
              line: false,
              ticks: {
                values: points
                  .filter(
                    (_, i) =>
                      i % Math.max(1, Math.ceil(points.length / 5)) === 0,
                  )
                  .map((p) => p.month),
                format: (value) =>
                  new Intl.DateTimeFormat(locale, { month: "short" }).format(
                    new Date(`${value}-01T12:00:00`),
                  ),
                size: 0,
              },
              tickLabels: { fontSize: 10, fill: muted },
            },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: { stroke: border },
            axis: {
              line: false,
              ticks: {
                count: 4,
                size: 0,
                format: (value) =>
                  new Intl.NumberFormat(locale, { notation: "compact" }).format(
                    value,
                  ),
              },
              tickLabels: { fontSize: 10, fill: muted },
            },
          },
        },
        tooltip: {
          use: tooltip,
          format: (point) =>
            `${point.datum.month} · ${t("income")}: ${money(point.datum.income, currency)} · ${t("expenses")}: ${money(point.datum.expense, currency)}`,
        },
      }),
    [points, currency, locale, accent, border, muted],
  );
  if (privacy) return <p>{t("amounts_hidden")}</p>;
  return (
    <>
      <Chart
        definition={chart}
        height={230}
        ariaLabel={t("monthly_cashflow")}
      />
      <p {...stylex.props(s.chartLegend)}>
        {t("income")} — · {t("expenses")} - -
      </p>
    </>
  );
}
