import React from 'react';
import { Icon } from './Icon';
import s from './Dashboard.module.css';

export function MetricCard({ label, value, detail, icon, featured, warning }) {
  return <article className={`${s.metric} ${featured ? s.featured : ''}`}>
    <div className={s.metricTop}><span>{label}</span><span className={s.metricIcon}><Icon name={icon} size={18}/></span></div>
    <strong className={warning ? s.negative : ''}>{value}</strong>
    <p>{detail}</p>
  </article>;
}
