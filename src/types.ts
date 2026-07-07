export interface ShortLink {
  id: string; // The alias
  originalUrl: string;
  createdAt: string; // ISO String
  expiresAt: string | null; // ISO String or null
  clicks: number;
  userId: string; // 'guest' or Auth user ID
  title: string | null;
  apiCreated?: boolean;
}

export interface ClickStats {
  id: string;
  linkId: string;
  timestamp: string; // ISO String
  browser: string;
  os: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  referer: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  apiKey: string;
  createdAt: string;
}

export interface DailyClicks {
  date: string;
  clicks: number;
}

export interface BrowserStats {
  name: string;
  clicks: number;
}

export interface OsStats {
  name: string;
  clicks: number;
}

export interface DeviceStats {
  name: string;
  clicks: number;
}

export interface RefererStats {
  name: string;
  clicks: number;
}
