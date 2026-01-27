"use client";

import { useState } from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

interface SOAPNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

interface NotesPanelProps {
  soap: SOAPNotes;
  sessionId: string;
  onUpdate?: (soap: Partial<SOAPNotes>) => void;
}

export function NotesPanel({ soap, sessionId, onUpdate }: NotesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSoap, setEditedSoap] = useState<SOAPNotes>(soap);

  const handleSave = () => {
    onUpdate?.(editedSoap);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSoap(soap);
    setIsEditing(false);
  };

  const updateField = (field: keyof SOAPNotes, value: string) => {
    setEditedSoap((prev) => ({ ...prev, [field]: value }));
  };

  const sections = [
    { key: "subjective" as const, label: "Subjective", placeholder: "Patient's reported symptoms, history..." },
    { key: "objective" as const, label: "Objective", placeholder: "Observable findings, vital signs..." },
    { key: "assessment" as const, label: "Assessment", placeholder: "Clinical assessment, diagnosis..." },
    { key: "plan" as const, label: "Plan", placeholder: "Treatment plan, follow-up actions..." },
  ];

  return (
    <Card
      title="SOAP Notes"
      headerActions={
        !isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        )
      }
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto space-y-4">
        {sections.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label}
            </label>
            {isEditing ? (
              <textarea
                value={editedSoap[key] || ""}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded-lg min-h-[80px]">
                {soap[key] ? (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {soap[key]}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">{placeholder}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
