export interface ParsedE2EId {
  /** 8-digit ISPB of the initiating institution */
  ispb: string;
  /** Date/time the transaction was initiated (UTC) */
  initiatedAt: Date;
  /** The 11-char unique suffix */
  suffix: string;
}

const E2EID_REGEX = /^E\d{8}\d{8}\d{4}[A-Za-z0-9]{11}$/;

/**
 * Parses a Pix endToEndId (E2E ID) as defined by BACEN.
 *
 * Format: `E{ISPB8}{YYYYMMDD}{HHmm}{11 alphanumeric chars}`
 * Example: `E6074694820230615143012345678901`
 *
 * @throws {Error} if the string is not a valid E2E ID or contains impossible date/time values
 */
export function parseE2EId(e2eId: string): ParsedE2EId {
  if (!E2EID_REGEX.test(e2eId)) {
    throw new Error(
      `Invalid endToEndId: "${e2eId}". Expected format: E{ISPB8}{YYYYMMDD}{HHmm}{11 alphanumeric chars}`
    );
  }

  const ispb = e2eId.slice(1, 9);
  const year = Number(e2eId.slice(9, 13));
  const month = Number(e2eId.slice(13, 15));
  const day = Number(e2eId.slice(15, 17));
  const hour = Number(e2eId.slice(17, 19));
  const minute = Number(e2eId.slice(19, 21));
  const suffix = e2eId.slice(21);

  if (month < 1 || month > 12) {
    throw new Error(`Invalid endToEndId: month ${month} is out of range (01–12)`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid endToEndId: day ${day} is out of range (01–31)`);
  }
  if (hour > 23) {
    throw new Error(`Invalid endToEndId: hour ${hour} is out of range (00–23)`);
  }
  if (minute > 59) {
    throw new Error(`Invalid endToEndId: minute ${minute} is out of range (00–59)`);
  }

  const initiatedAt = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (
    initiatedAt.getUTCFullYear() !== year ||
    initiatedAt.getUTCMonth() + 1 !== month ||
    initiatedAt.getUTCDate() !== day
  ) {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    throw new Error(`Invalid endToEndId: date ${year}-${mm}-${dd} does not exist`);
  }

  return { ispb, initiatedAt, suffix };
}

/**
 * Returns `true` if the given string is a syntactically and semantically valid Pix endToEndId.
 * Never throws.
 */
export function isValidE2EId(e2eId: string): boolean {
  try {
    parseE2EId(e2eId);
    return true;
  } catch {
    return false;
  }
}
