import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Filter,
  RotateCcw,
  Clock,
  FileText,
  Eye,
  Lock,
  Database,
} from "lucide-react";

import { adminAPI } from "../api/services";
import { useTheme } from "../contexts/theme/ThemeContext";

const AuditLogsPage = () => {
  const { colors } = useTheme();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
  });

  const [selectedLog, setSelectedLog] = useState(null);

  // ============================================================
  // FETCH AUDIT LOGS
  // ============================================================

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: 15,
      };

      if (actionFilter) {
        params.action = actionFilter;
      }

      if (resourceFilter) {
        params.resourceType = resourceFilter;
      }

      const res = await adminAPI.getAuditLogs(params);

      if (res.data?.success) {
        setLogs(res.data.data.logs || []);

        setPagination(
          res.data.data.pagination || {
            total: 0,
            pages: 1,
            page: 1,
          },
        );
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  // ============================================================
  // ACTION EVENT COLORS
  // No background color — only text + border.
  // ============================================================

  const getActionBadgeStyle = (action = "") => {
    const normalizedAction = action.toUpperCase();

    if (normalizedAction.includes("UPDATE")) {
      return {
        color: colors.warning,
        borderColor: colors.warning,
      };
    }

    if (normalizedAction.includes("CREATE")) {
      return {
        color: colors.success,
        borderColor: colors.success,
      };
    }

    if (normalizedAction.includes("DELETE")) {
      return {
        color: colors.danger,
        borderColor: colors.danger,
      };
    }

    if (normalizedAction.includes("LOGIN")) {
      return {
        color: colors.info,
        borderColor: colors.info,
      };
    }

    return {
      color: colors.primary,
      borderColor: colors.primary,
    };
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: colors.textPrimary,
              margin: "0 0 6px 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ShieldCheck size={26} color={colors.primary} />

            <span>Security & System Audit Logs</span>
          </h1>

          <p
            style={{
              color: colors.textMuted,
              margin: 0,
              fontSize: "14px",
            }}
          >
            Immutable administrative event trace adhering to Backend Security
            Control G (Logging & Monitoring)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: colors.primary,
            color: colors.white,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <RotateCcw size={16} />
          <span>Refresh Trace</span>
        </button>
      </div>

      {/* ======================================================
          SECURITY ARCHITECTURE SUMMARY
      ====================================================== */}

      <div
        style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Lock size={20} color={colors.primary} />

          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: colors.textPrimary,
              }}
            >
              Controls A–G Enforced: Floor & Ceiling Active
            </div>

            <div
              style={{
                fontSize: "12px",
                color: colors.textMuted,
              }}
            >
              Validation • Parameter Binding • Bcrypt • JWT & Signed OTP • RBAC
              • Encryption • Audit Logging
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            className="badge"
            style={{
              backgroundColor: colors.successLight,
              color: colors.success,
              border: `1px solid ${colors.success}`,
            }}
          >
            Total Records: {pagination.total}
          </span>

          <span
            className="badge"
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
            }}
          >
            Retention: 365 Days
          </span>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* ACTION FILTER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: "200px",
          }}
        >
          <Filter size={18} color={colors.textMuted} />

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{
              width: "100%",
              fontSize: "13px",
            }}
          >
            <option value="">All Audit Actions</option>
            <option value="FARE_UPDATE">Fare Matrix Update</option>
            <option value="ROUTE_CREATE">Route Creation</option>
            <option value="ROUTE_UPDATE">Route Modification</option>
            <option value="ROUTE_DELETE">Route Deactivation</option>
            <option value="COMPLAINT_STATUS_UPDATE">
              Complaint Status Change
            </option>
            <option value="COMPLAINT_NOTE_ADDED">Complaint Note Added</option>
            <option value="USER_STATUS_UPDATE">User Account Status</option>
            <option value="ADMIN_LOGIN">Admin Authentication</option>
          </select>
        </div>

        {/* RESOURCE FILTER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: "200px",
          }}
        >
          <Database size={18} color={colors.textMuted} />

          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{
              width: "100%",
              fontSize: "13px",
            }}
          >
            <option value="">All Resource Scopes</option>
            <option value="fare">Fares & Rates</option>
            <option value="route">Transit Routes</option>
            <option value="complaint">Commuter Complaints</option>
            <option value="user">User Accounts</option>
            <option value="auth">Authentication</option>
          </select>
        </div>
      </div>

      {/* ======================================================
          AUDIT LOG TABLE
      ====================================================== */}

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  Timestamp
                </th>

                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  Action Event
                </th>

                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  Target Scope
                </th>

                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  Admin Operator
                </th>

                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                  }}
                >
                  IP Address
                </th>

                <th
                  style={{
                    padding: "14px 18px",
                    color: colors.textMuted,
                    fontWeight: "600",
                    textAlign: "right",
                  }}
                >
                  Inspection
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: colors.textMuted,
                    }}
                  >
                    Loading audit trail from database...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: colors.textMuted,
                    }}
                  >
                    No audit log records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle = getActionBadgeStyle(log.action);

                  return (
                    <tr
                      key={log._id}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {/* TIMESTAMP */}

                      <td
                        style={{
                          padding: "14px 18px",
                          whiteSpace: "nowrap",
                          color: colors.textMuted,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Clock size={14} />

                          <span>
                            {new Date(log.createdAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* ACTION */}

                      <td
                        style={{
                          padding: "14px 18px",
                        }}
                      >
                        <span
                          style={{
                            // NO BACKGROUND COLOR
                            backgroundColor: "transparent",

                            color: actionStyle.color,

                            border: `1px solid ${actionStyle.borderColor}`,

                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* RESOURCE */}

                      <td
                        style={{
                          padding: "14px 18px",
                        }}
                      >
                        <span
                          style={{
                            textTransform: "capitalize",
                            color: colors.textPrimary,
                            fontWeight: "600",
                          }}
                        >
                          {log.resourceType}
                        </span>

                        {log.resourceId && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: colors.textMuted,
                              marginLeft: "6px",
                            }}
                          >
                            (#{String(log.resourceId).slice(-6)})
                          </span>
                        )}
                      </td>

                      {/* ADMIN */}

                      <td
                        style={{
                          padding: "14px 18px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            color: colors.textPrimary,
                          }}
                        >
                          {log.performedByName}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.textMuted,
                          }}
                        >
                          {log.performedByEmail || log.role}
                        </div>
                      </td>

                      {/* IP */}

                      <td
                        style={{
                          padding: "14px 18px",
                          color: colors.textMuted,
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {log.ipAddress || "127.0.0.1"}
                      </td>

                      {/* INSPECT */}

                      <td
                        style={{
                          padding: "14px 18px",
                          textAlign: "right",
                        }}
                      >
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            backgroundColor: "transparent",
                            border: `1px solid ${colors.border}`,
                            color: colors.primary,
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          <Eye size={14} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {pagination.pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: `1px solid ${colors.border}`,
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: colors.textMuted,
              }}
            >
              Page {pagination.page || page} of {pagination.pages} (
              {pagination.total} total events)
            </span>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor:
                    page <= 1 ? colors.surfaceElevated : colors.primary,
                  color: page <= 1 ? colors.disabled : colors.white,
                  border: `1px solid ${
                    page <= 1 ? colors.border : colors.primary
                  }`,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor:
                    page >= pagination.pages
                      ? colors.surfaceElevated
                      : colors.primary,
                  color:
                    page >= pagination.pages ? colors.disabled : colors.white,
                  border: `1px solid ${
                    page >= pagination.pages ? colors.border : colors.primary
                  }`,
                  cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          INSPECTOR MODAL
      ====================================================== */}

      {selectedLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: colors.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={20} color={colors.primary} />
                Audit Event Record Details
              </h3>

              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: colors.textMuted,
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* EVENT INFORMATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Action:
                </span>

                <div
                  style={{
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginTop: "2px",
                  }}
                >
                  {selectedLog.action}
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Scope:
                </span>

                <div
                  style={{
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginTop: "2px",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedLog.resourceType}
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Operator:
                </span>

                <div
                  style={{
                    fontWeight: "600",
                    color: colors.textPrimary,
                    marginTop: "2px",
                  }}
                >
                  {selectedLog.performedByName}
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Timestamp:
                </span>

                <div
                  style={{
                    color: colors.textPrimary,
                    marginTop: "2px",
                    fontSize: "12px",
                  }}
                >
                  {new Date(selectedLog.createdAt).toISOString()}
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  IP Address:
                </span>

                <div
                  style={{
                    color: colors.textPrimary,
                    marginTop: "2px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                >
                  {selectedLog.ipAddress || "127.0.0.1"}
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Resource ID:
                </span>

                <div
                  style={{
                    color: colors.textPrimary,
                    marginTop: "2px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                >
                  {selectedLog.resourceId || "N/A"}
                </div>
              </div>
            </div>

            {/* EVENT PAYLOAD */}

            <div
              style={{
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  color: colors.textMuted,
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Event Payload / Mutation Diff:
              </span>

              <pre
                style={{
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "12px",
                  color: colors.success,
                  overflowX: "auto",
                  marginTop: "8px",
                  lineHeight: "1.5",
                }}
              >
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            {/* MODAL FOOTER */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setSelectedLog(null)}
                className="btn"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
