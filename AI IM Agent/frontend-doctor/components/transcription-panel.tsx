"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

interface TranscriptionSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  isFinal: boolean;
}

interface TranscriptionPanelProps {
  transcripts: TranscriptionSegment[];
}

export function TranscriptionPanel({ transcripts }: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, autoScroll]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoScroll(isAtBottom);
    }
  };

  return (
    <Card title="Live Transcription" className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-3 pr-2"
        >
          {transcripts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No transcription yet. Start recording to see live transcription.</p>
            </div>
          ) : (
            transcripts.map((segment) => (
              <div
                key={segment.id}
                className={`p-3 rounded-lg ${
                  segment.isFinal
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  {segment.speaker && (
                    <Badge variant="info" className="text-xs">
                      {segment.speaker}
                    </Badge>
                  )}
                  {!segment.isFinal && (
                    <Badge variant="default" className="text-xs">
                      Partial
                    </Badge>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    segment.isFinal ? "text-gray-900" : "text-gray-600 italic"
                  }`}
                >
                  {segment.text}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(segment.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
