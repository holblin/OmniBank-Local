import React, { useMemo } from 'react';
import { areaY, defineChart, dot, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { scalePoint } from '@tanstack/charts/scales/point';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import { useAppTheme } from '../lib/theme';
import { useLanguage } from '../lib/i18n';
import s from './Dashboard.module.css';

export function BalanceChart({ history, currency }) {
  const { t, date, locale, money } = useLanguage();
  const { accent, border } = useAppTheme();
  const definition = useMemo(() => {
    const tickDates = history.filter((_, index) => index % Math.max(1, Math.ceil(history.length / 5)) === 0).map(point => point.date);
    return defineChart({
      marks: [
        areaY(history, { x: 'date', y: 'balance', fill: accent, fillOpacity: .08 }),
        lineY(history, { x: 'date', y: 'balance', stroke: accent, strokeWidth: 2 }),
        ...(history.length === 1 ? [dot(history, { x: 'date', y: 'balance', fill: accent, r: 4 })] : []),
      ],
      scales: {
        x: { scale: scalePoint, axis: { line: false, ticks: { values: tickDates, format: value => date(value), size: 0, padding: 10 }, tickLabels: { fontSize: 10 } } },
        y: { scale: scaleLinear, nice: true, grid: { stroke: border, strokeWidth: 1 }, axis: { line: false, ticks: { count: 4, size: 0, padding: 10, format: value => new Intl.NumberFormat(locale, { notation: 'compact' }).format(value) }, tickLabels: { fontSize: 10 } } },
      },
      tooltip: { use: tooltip, format: point => `${date(point.datum.date)} · ${money(point.datum.balance, currency)}` },
    });
  }, [history, currency, locale, accent, border]);
  return <div className={s.chart}><Chart definition={definition} height={211} ariaLabel={t('balance_chart')}/><details className={s.chartData}><summary>{t('chart_data')}</summary><table><thead><tr><th>{t('date')}</th><th>{t('balance')}</th></tr></thead><tbody>{history.map(point => <tr key={point.date}><td>{date(point.date)}</td><td>{money(point.balance, currency)}</td></tr>)}</tbody></table></details></div>;
}
