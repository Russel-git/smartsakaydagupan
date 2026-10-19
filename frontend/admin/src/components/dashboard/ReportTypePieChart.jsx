import React, { useState } from "react";
import {
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  Navigation,
  Wrench,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../../contexts/theme/ThemeContext";

const CATEGORY_ICONS = {
  overcharging: DollarSign,
  reckless_driving: AlertTriangle,
  harassment: ShieldAlert,
  route_deviation: Navigation,
  vehicle_condition: Wrench,
  other: HelpCircle,
};

const DEFAULT_CATEGORIES = [
  {
    key: "overcharging",
    label: "Overcharging",
    color: "#F59E0B",
    focusArea: "Fare Regulation & Base Tariff Compliance",
    recommendation:
      "Deploy POSO fare monitors at major terminals (Perez Blvd, Lucao, Malimgas) and verify printed LTFRB fare matrix compliance inside PUVs.",
  },
  {
    key: "reckless_driving",
    label: "Reckless Driving",
    color: "#EF4444",
    focusArea: "Speed Enforcement & Commuter Safety",
    recommendation:
      "Establish radar speed checks on fast corridors (Bonuan, Bolosan Highway) and mandate safety retraining for flagged operators.",
  },
  {
    key: "harassment",
    label: "Harassment",
    color: "#8B5CF6",
    focusArea: "Commuter Protection & Safe Spaces",
    recommendation:
      "Expedite priority field hearings with POSO/GAD desk, display emergency reporting hotlines, and penalize abusive crew members.",
  },
  {
    key: "route_deviation",
    label: "Route Deviation",
    color: "#3B82F6",
    focusArea: "Franchise Corridor Integrity",
    recommendation:
      "Conduct random route checkpoint audits to stop cutting-trips (cutting line) and ensure PUVs complete their full franchise routes.",
  },
  {
    key: "vehicle_condition",
    label: "Vehicle Condition",
    color: "#10B981",
    focusArea: "Roadworthiness & Emission Standards",
    recommendation:
      "Conduct joint LGU-LTO roadworthiness spot inspections and emission testing on dilapidated public utility jeepneys.",
  },
  {
    key: "other",
    label: "Other",
    color: "#6B7280",
    focusArea: "General Commuter Relations",
    recommendation:
      "Review general commuter feedback and coordinate service quality orientations with Dagupan transport federation leaders.",
  },
];

/**
 * ReportTypePieChart Component
 * Displays a responsive SVG Donut/Pie chart breakdown of commuter report types,
 * complete with percentage legend and actionable LGU prevention recommendations.
 */
const ReportTypePieChart = ({
  categoryBreakdown = [],
  topCategory = null,
  totalReports = 0,
}) => {
  const { colors } = useTheme();
  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);

  // Merge incoming data with default structure to guarantee all 6 types are present
  const mergedCategories = DEFAULT_CATEGORIES.map((def) => {
    const found = categoryBreakdown.find((c) => c.key === def.key);
    return {
      ...def,
      count: found?.count || 0,
      percentage: found?.percentage || 0,
      focusArea: found?.focusArea || def.focusArea,
      recommendation: found?.recommendation || def.recommendation,
    };
  });

  const grandTotal =
    totalReports > 0
      ? totalReports
      : mergedCategories.reduce((sum, c) => sum + c.count, 0);

  // Recalculate percentages accurately against grandTotal
  const categoriesWithPct = mergedCategories.map((c) => ({
    ...c,
    percentage:
      grandTotal > 0 ? parseFloat(((c.count / grandTotal) * 100).toFixed(1)) : 0,
  }));

  // Identify top category
  const activeTopCategory =
    topCategory && topCategory.count > 0
      ? topCategory
      : [...categoriesWithPct].sort((a, b) => b.count - a.count)[0] ||
        categoriesWithPct[0];

  // Currently inspected category (selected > hovered > top)
  const activeCategory =
    categoriesWithPct.find((c) => c.key === (selectedKey || hoveredKey)) ||
    activeTopCategory;

  // SVG Geometry Settings
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 100;
  const innerRadius = 62;

  // Calculate arc angles
  let currentAngle = -Math.PI / 2;
  const slices = categoriesWithPct.map((cat) => {
    const sliceAngle =
      grandTotal > 0 ? (cat.count / grandTotal) * 2 * Math.PI : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...cat,
      startAngle,
      endAngle,
      sliceAngle,
    };
  });

  const createArcPath = (start, end, rOut, rIn) => {
    const angleDiff = end - start;
    if (angleDiff <= 0.0001) return "";

    // If nearly a full circle, split into two arcs to prevent SVG glitch
    if (angleDiff >= 2 * Math.PI - 0.001) {
      const mid = start + Math.PI;
      const x1 = cx + rOut * Math.cos(start);
      const y1 = cy + rOut * Math.sin(start);
      const xMid = cx + rOut * Math.cos(mid);
      const yMid = cy + rOut * Math.sin(mid);
      const xIn1 = cx + rIn * Math.cos(start);
      const yIn1 = cy + rIn * Math.sin(start);
      const xInMid = cx + rIn * Math.cos(mid);
      const yInMid = cy + rIn * Math.sin(mid);

      return `M ${x1} ${y1} A ${rOut} ${rOut} 0 0 1 ${xMid} ${yMid} A ${rOut} ${rOut} 0 0 1 ${x1} ${y1} M ${xIn1} ${yIn1} A ${rIn} ${rIn} 0 0 0 ${xInMid} ${yInMid} A ${rIn} ${rIn} 0 0 0 ${xIn1} ${yIn1} Z`;
    }

    const x1 = cx + rOut * Math.cos(start);
    const y1 = cy + rOut * Math.sin(start);
    const x2 = cx + rOut * Math.cos(end);
    const y2 = cy + rOut * Math.sin(end);

    const x3 = cx + rIn * Math.cos(end);
    const y3 = cy + rIn * Math.sin(end);
    const x4 = cx + rIn * Math.cos(start);
    const y4 = cy + rIn * Math.sin(start);

    const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const ActiveIcon = CATEGORY_ICONS[activeCategory?.key] || HelpCircle;

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: "16px",
        border: `1px solid ${colors.border}`,
        padding: "24px",
        marginBottom: "28px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Title & Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: colors.textPrimary,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Commuter Grievance Category Distribution</span>
            </h3>
            <p style={{ fontSize: "12px", color: colors.textMuted, margin: "4px 0 0 0" }}>
              Comprehensive breakdown of reported commuter infractions across Dagupan City transit corridors
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: `${colors.primary}15`,
              color: colors.primary,
              fontSize: "11px",
              fontWeight: "700",
              border: `1px solid ${colors.primary}35`,
            }}
          >
            <span>Total: {grandTotal.toLocaleString()} Reports Filed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pie/Donut Chart + Legend + Recommendation Box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "28px",
          alignItems: "center",
        }}
      >
        {/* Left Column: Interactive SVG Donut / Pie */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ width: size, height: size, position: "relative" }}>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              {/* Background ring if empty */}
              {grandTotal === 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={(outerRadius + innerRadius) / 2}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth={outerRadius - innerRadius}
                  strokeDasharray="4 4"
                />
              )}

              {/* Slices */}
              {slices.map((slice) => {
                if (slice.count === 0) return null;
                const isHovered = (hoveredKey || selectedKey) === slice.key;
                const rOut = isHovered ? outerRadius + 5 : outerRadius;
                const pathData = createArcPath(
                  slice.startAngle,
                  slice.endAngle,
                  rOut,
                  innerRadius
                );

                return (
                  <path
                    key={slice.key}
                    d={pathData}
                    fill={slice.color}
                    stroke={colors.surface}
                    strokeWidth="2.5"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      opacity: hoveredKey && hoveredKey !== slice.key ? 0.45 : 1,
                      filter: isHovered
                        ? `drop-shadow(0 4px 8px ${slice.color}60)`
                        : "none",
                    }}
                    onMouseEnter={() => setHoveredKey(slice.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() =>
                      setSelectedKey(selectedKey === slice.key ? null : slice.key)
                    }
                  />
                );
              })}

              {/* Center Readout Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius - 4}
                fill={colors.surface || "#FFFFFF"}
                stroke={colors.border}
                strokeWidth="1.5"
              />
            </svg>

            {/* Center Content Overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                textAlign: "center",
                padding: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: activeCategory
                    ? activeCategory.key === "overcharging"
                      ? "#D97706"
                      : activeCategory.color
                    : colors.textPrimary,
                  lineHeight: 1.1,
                }}
              >
                {activeCategory ? activeCategory.count : grandTotal}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: colors.textPrimary,
                  marginTop: "2px",
                  maxWidth: "96px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeCategory ? activeCategory.label : "Reports"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: colors.textSecondary,
                  marginTop: "1px",
                }}
              >
                {activeCategory ? `${activeCategory.percentage}%` : "100%"}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "11.5px",
              color: colors.textSecondary,
              marginTop: "10px",
              fontWeight: "600",
            }}
          >
            💡 Hover or click any slice to view category details
          </div>
        </div>

        {/* Right Column: 6 Category Legend + Clickable Item Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {categoriesWithPct.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key] || HelpCircle;
            const isHovered = (hoveredKey || selectedKey) === cat.key;
            const isSelected = selectedKey === cat.key;
            const badgeTextColor =
              cat.key === "overcharging" ? "#B45309" : cat.color;

            return (
              <div
                key={cat.key}
                onClick={() => setSelectedKey(isSelected ? null : cat.key)}
                onMouseEnter={() => setHoveredKey(cat.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: isSelected
                    ? `${cat.color}20`
                    : isHovered
                    ? `${colors.primary}12`
                    : colors.surface || "#FFFFFF",
                  border: `1.5px solid ${
                    isSelected ? cat.color : isHovered ? `${cat.color}80` : colors.border
                  }`,
                  boxShadow: isSelected
                    ? `0 3px 10px ${cat.color}25`
                    : "0 1px 3px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: isHovered ? "translateX(3px)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      backgroundColor: `${cat.color}22`,
                      color: cat.key === "overcharging" ? "#B45309" : cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: colors.textPrimary,
                      }}
                    >
                      {cat.label}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: colors.textSecondary,
                        fontWeight: "500",
                      }}
                    >
                      {cat.focusArea}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: "800",
                      color: colors.textPrimary,
                    }}
                  >
                    {cat.count}
                  </span>

                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: `${cat.color}20`,
                      color: badgeTextColor,
                      minWidth: "48px",
                      textAlign: "center",
                    }}
                  >
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Advisory Box: Specific Aspect for LGU Focus & Prevention */}
      {activeCategory && (
        <div
          style={{
            marginTop: "24px",
            padding: "18px 20px",
            borderRadius: "12px",
            backgroundColor: colors.surface || "#FFFFFF",
            border: `2px solid ${activeCategory.color}55`,
            boxShadow: `0 4px 16px ${activeCategory.color}15`,
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: activeCategory.key === "overcharging" ? "#D97706" : activeCategory.color,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <Lightbulb size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: activeCategory.key === "overcharging" ? "#D97706" : activeCategory.color,
                  color: "#FFFFFF",
                }}
              >
                LGU Priority Focus Area
              </span>

              <span style={{ fontSize: "14.5px", fontWeight: "800", color: colors.textPrimary }}>
                {activeCategory.label}: {activeCategory.focusArea}
              </span>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: activeCategory.key === "overcharging" ? "#B45309" : activeCategory.color,
                }}
              >
                ({activeCategory.count} reports • {activeCategory.percentage}% of all grievances)
              </span>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: colors.textPrimary,
                lineHeight: "1.55",
                marginTop: "4px",
              }}
            >
              <strong style={{ color: colors.textPrimary }}>Recommended Prevention Strategy: </strong>
              {activeCategory.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTypePieChart;
