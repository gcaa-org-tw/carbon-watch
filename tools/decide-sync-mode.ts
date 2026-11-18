import 'dotenv/config';
import { appendFileSync } from 'fs';
import { google } from 'googleapis';
import { Logger } from './lib/logger.js';
import { decideSyncMode, SYNC_SWITCH_RANGE, type SwitchRead } from './lib/sync-mode.js';

const EVENT = process.env.SYNC_EVENT ?? '';
const SCOPE = process.env.SYNC_SCOPE ?? '';

async function readSwitch(): Promise<SwitchRead> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!apiKey || !spreadsheetId) {
    return { ok: false, error: 'GOOGLE_SHEETS_API_KEY or GOOGLE_SHEETS_ID is not set' };
  }
  try {
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: SYNC_SWITCH_RANGE,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    return { ok: true, value: response.data.values?.[0]?.[0] };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const logger = new Logger();
  const read = EVENT === 'schedule' ? await readSwitch() : null;
  const mode = decideSyncMode(EVENT, SCOPE, read);
  const label = mode.fundOnly ? 'fund tabs only' : 'all tabs';

  logger.info(`Sync mode: ${label} (${mode.reason})`);
  if (mode.failSafe) {
    console.log(`::warning title=Sync switch ignored::${mode.reason}`);
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `fund_only=${mode.fundOnly}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Data sync\n\n- Mode: ${label}\n- Why: ${mode.reason}\n`
    );
  }
}

main();
