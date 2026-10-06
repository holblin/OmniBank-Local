import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import React from "react";
import { Icon } from "./Icon";
import { styles as s } from "./Dashboard.stylex.js";
export function MetricCard({ label, value, detail, icon, featured, warning }) {
  const { compact } = useAppTheme();
  return (
    <article
      {...stylex.props(
        s.metric,
        featured && s.featured,
        compact && s.compactMetric,
      )}
    >
      <div
        {...stylex.props(
          s.metricTop,
          featured && s.featuredMetricTop,
          compact && s.compactMetricTop,
        )}
      >
        <span>{label}</span>
        <span {...stylex.props(s.metricIcon, featured && s.featuredMetricIcon)}>
          <Icon name={icon} size={18} />
        </span>
      </div>
      <strong
        {...stylex.props(
          s.metricStrong,
          warning && s.negative,
          compact && s.compactMetricStrong,
        )}
      >
        {value}
      </strong>
      <p {...stylex.props(s.metricP, featured && s.featuredP)}>{detail}</p>
    </article>
  );
}
