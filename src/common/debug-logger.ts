/**
 * Debug logger for Node.js backend
 * Writes NDJSON logs to file
 */

import * as fs from 'fs';

const LOG_PATH =
  'C:\\Users\\ctrpr\\Projects\\AI-Film-Studio\\.benchmarks\\.cursor\\debug.log';

export function debugLog(
  location: string,
  message: string,
  data: any,
  hypothesisId?: string,
) {
  try {
    const logEntry = {
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: hypothesisId || 'unknown',
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(LOG_PATH, logLine, 'utf8');
  } catch (error) {
    // Silently fail if logging doesn't work
  }
}
