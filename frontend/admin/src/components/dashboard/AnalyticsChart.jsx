import React, { useState } from "react";
import { useTheme } from "../../contexts/theme/ThemeContext";

/**
 * AnalyticsChart Component
 * 
 * Props:
 * - title: string
 * - subtitle: string
 * - data: Array<{ key: string, label: string, shortLabel: string, [seriesKey: string]: number }>
 * - series: Array<{ key: string, label: string, color: string }>
 * - timeRange: number (6 or 12)
 * - onTimeRangeChange: (range: number) => void
 * - emptyMessage: string
 */
const AnalyticsChart = ({
  title,
  subtitle,
  data = [],
  series = [],
  timeRange = 6,
  onTimeRangeChange,
  emptyMessage = "No analytics data recorded for this period",
}) => {
  const { colors } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute maximum value across series to scale the grouped bars correctly
  const maxValue = Math.max(
    ...data.flatMap((item) =>
      series.map((s) => Number(item[s.key]) || 0)
    ),
    1
  );

  // Determine nice ceiling for Y-axis (e.g. 5, 10, 20, 50, etc.)
  const getCeiling = (max) => {
    if (max <= 5) return 5;
    if (max <= 10) return 10;
    if (max <= 25) return 25;
    if (max <= 50) return 50;
    if (max <= 100) return 100;
    const factor = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / factor) * factor;
  };

  const yCeil = getCeiling(maxValue);
  const gridTicks = [0, Math.round(yCeil * 0.25), Math.round(yCeil * 0.5), Math.round(yCeil * 0.75), yCeil];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const barGroupWidth = data.length > 0 ? chartWidth / data.length : 0;
  const barPadding = Math.min(16, barGroupWidth * 0.25);
  const effectiveWidth = Math.max(8, barGroupWidth - barPadding * 2);
  const individualBarWidth = series.length > 1 ? Math.max(4, (effectiveWidth - (series.length - 1) * 3) / series.length) : effectiveWidth;

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: "16px",
        border: `1px solid ${colors.border}`,
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        position: "relative",
      }}
    >
      {/* Header with Title and Range Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                margin: "4px 0 0 0",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Time range selector buttons */}
        {onTimeRangeChange && (
          <div
            style={{
              display: "flex",
              backgroundColor: colors.background,
              borderRadius: "8px",
              padding: "3px",
              border: `1px solid ${colors.border}`,
            }}
          >
            {[6, 12].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onTimeRangeChange(r)}
                style={{
                  border: "none",
                  backgroundColor: timeRange === r ? colors.primary : "transparent",
                  color: timeRange === r ? "#FFFFFF" : colors.textSecondary,
                  fontWeight: timeRange === r ? "700" : "500",
                  fontSize: "11px",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {r} Months
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Series Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
          fontSize: "12px",
          color: colors.textSecondary,
        }}
      >
        {series.map((s) => {
          const totalForSeries = data.reduce((acc, curr) => acc + (Number(curr[s.key]) || 0), 0);
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  backgroundColor: s.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: "600", color: colors.textPrimary }}>{s.label}:</span>
              <span>{totalForSeries.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* SVG Responsive Chart */}
      <div style={{ width: "100%", position: "relative" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", overflow: "visible" }}
        >
          {/* Horizontal Grid lines */}
          {gridTicks.map((tick, i) => {
            const y = padding.top + chartHeight - (tick / yCeil) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke={colors.border}
                  strokeDasharray={i === 0 ? "none" : "3,3"}
                  strokeWidth="1"
                  opacity="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={colors.textMuted}
                  fontWeight="500"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Render Bars per Month */}
          {data.map((item, idx) => {
            const groupX = padding.left + idx * barGroupWidth;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.key || idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Background hover highlight column */}
                <rect
                  x={groupX}
                  y={padding.top}
                  width={barGroupWidth}
                  height={chartHeight}
                  fill={isHovered ? colors.primary : "transparent"}
                  opacity={isHovered ? 0.06 : 0}
                  rx="6"
                />

                {/* Bars for each series */}
                {series.map((s, sIdx) => {
                  const val = Number(item[s.key]) || 0;
                  const barH = (val / yCeil) * chartHeight;
                  const barX =
                    groupX +
                    barPadding +
                    (series.length > 1 ? sIdx * (individualBarWidth + 3) : 0);
                  const barY = padding.top + chartHeight - barH;

                  return (
                    <rect
                      key={s.key}
                      x={barX}
                      y={barY}
                      width={individualBarWidth}
                      height={Math.max(barH, val > 0 ? 3 : 0)}
                      fill={s.color}
                      opacity={isHovered ? 1 : 0.88}
                      rx="3"
                      style={{
                        transition: "all 0.2s ease",
                      }}
                    />
                  );
                })}

                {/* X-Axis Month Label */}
                <text
                  x={groupX + barGroupWidth / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? "700" : "500"}
                  fill={isHovered ? colors.primary : colors.textMuted}
                >
                  {item.shortLabel || item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay (High-Contrast Universal Dark Slate for Theme 2 Light Mode) */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: `${Math.min(
                Math.max(
                  ((padding.left + (hoveredIndex + 0.5) * barGroupWidth) / svgWidth) * 100,
                  18
                ),
                82
              )}%`,
              transform: "translateX(-50%)",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "12px",
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.25)",
              pointerEvents: "none",
              zIndex: 30,
              minWidth: "160px",
              border: "1px solid rgba(255, 255, 255, 0.18)",
            }}
          >
            <div
              style={{
                fontWeight: "800",
                fontSize: "12.5px",
                color: "#FFFFFF",
                marginBottom: "6px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                paddingBottom: "4px",
                letterSpacing: "0.2px",
              }}
            >
              {data[hoveredIndex].label}
            </div>
            {series.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "11.5px",
                  marginTop: "4px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: s.color,
                      boxShadow: `0 0 6px ${s.color}90`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#E2E8F0", fontWeight: "600" }}>{s.label}:</span>
                </span>
                <span
                  style={{
                    fontWeight: "800",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontFamily: "monospace",
                  }}
                >
                  {(data[hoveredIndex][s.key] || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            color: colors.textMuted,
            fontSize: "13px",
          }}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
