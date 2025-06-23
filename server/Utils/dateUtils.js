// utils/dateUtils.js
export function getISTDateString(date = new Date()) {
  // Returns YYYY-MM-DD for the given date in IST timezone
  // Compute UTC time in ms, then add IST offset (+5:30)
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const istOffsetMinutes = 5 * 60 + 30; // 5 hours 30 minutes
  const istMs = utcMs + istOffsetMinutes * 60000;
  const istDate = new Date(istMs);
  // Format YYYY-MM-DD
  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDaysSinceBase(baseDateString) {
  // baseDateString: "YYYY-MM-DD" in IST representing Day 0 (e.g., quiz launch date)
  // Returns integer number of days difference from base to today, in IST.
  const todayIST = new Date();
  // Parse base date with IST offset
  // Construct a Date object for base date at 00:00 IST
  // ISO string "YYYY-MM-DDT00:00:00+05:30" ensures correct offset
  const baseISO = `${baseDateString}T00:00:00+05:30`;
  const baseDate = new Date(baseISO);
  // Compute difference in milliseconds using IST-normalized today
  // First, get today's IST midnight:
  const todayDateString = getISTDateString(todayIST);
  const todayMidnightISO = `${todayDateString}T00:00:00+05:30`;
  const todayMidnight = new Date(todayMidnightISO);

  const diffMs = todayMidnight.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
}
