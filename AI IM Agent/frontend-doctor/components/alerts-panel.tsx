"use client";

import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useState } from "react";

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

export function AlertsPanel({ alerts, onAcknowledge }: AlertsPanelProps) {
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const handleAcknowledge = async (alertId: string) => {
    if (onAcknowledge) {
      setAcknowledging(alertId);
      try {
        await onAcknowledge(alertId);
      } finally {
        setAcknowledging(null);
      }
    }
  };

  const severityColors = {
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
    critical: "bg-red-50 border-red-200",
  };

  const severityBadges = {
    info: "info" as const,
    warning: "warning" as const,
    critical: "critical" as const,
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    // Critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <Card title="Clinical Alerts" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedAlerts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No alerts at this time.</p>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                severityColors[alert.severity]
              } ${alert.acknowledged ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant={severityBadges[alert.severity]}>
                  {alert.severity.toUpperCase()}
                </Badge>
                {!alert.acknowledged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to acknowledge this alert?"
                        )
                      ) {
                        handleAcknowledge(alert.id);
                      }
                    }}
                    disabled={acknowledging === alert.id}
                  >
                    {acknowledging === alert.id ? "Acknowledging..." : "Acknowledge"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-900 mb-2">{alert.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleString()}
                {alert.acknowledged && " • Acknowledged"}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
