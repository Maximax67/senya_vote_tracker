import { google } from 'googleapis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null;

function getAuth() {
  if (auth) return auth;

  auth = new google.auth.GoogleAuth({
    credentials: {
      project_id: process.env.GOOGLE_PROJECT_ID,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return auth;
}

export async function getFormResponsesDates(): Promise<number[]> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID is not set');
  }

  const authClient = await getAuth().getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:A',
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return [];
  }

  const utcOffsetHours = parseInt(process.env.UTC_OFFSET || "0");
  const utcOffsetMs = utcOffsetHours * 60 * 60 * 1000;

  const dates = rows.slice(1).map(([value]) => {
    const [datePart, timePart] = value.split(' ');
    const [day, month, year] = datePart.split('.').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    const localDate = new Date(year, month - 1, day, hour, minute, second);
    const utcTime = localDate.getTime() - utcOffsetMs;

    return Math.floor(utcTime / 1000);
  });

  return dates;
}
