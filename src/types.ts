export enum UserRole {
  OWNER = 'owner',       // مالك النظام
  ADMIN = 'admin',       // مدير
  MONITOR = 'monitor',   // مراقب
  EMERGENCY = 'emergency', // فني طوارئ
  WORKER = 'worker'      // عامل
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  floorAccess?: string; // If restricted to specific floors (optional)
  phone?: string;
}

export interface Bed {
  id: string;
  number: string;
}

export interface Room {
  id: string;
  number: string;
  beds: Bed[];
}

export interface Wing {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Floor {
  id: string;
  name: string; // Floor 1, Floor 2, etc.
  wings: Wing[];
}

export enum CallType {
  EMERGENCY = 'emergency',     // طوارئ/مساعدة لنزيل
  RELIEF = 'relief'            // استبدال نفسه/يحتاج موظف بديل
}

export enum CallStatus {
  PENDING = 'pending',         // قيد الانتظار
  ACCEPTED = 'accepted',       // تم القبول
  RESOLVED = 'resolved',       // تم الحل / الإغلاق
}

export interface CallRequest {
  id: string;
  workerId: string;
  workerName: string;
  type: CallType;
  floorId: string;
  floorName: string;
  wingId: string;
  wingName: string;
  roomId: string;
  roomNumber: string;
  bedId?: string;
  bedNumber?: string;
  status: CallStatus;
  createdAt: string;           // ISO String
  acceptedAt?: string;         // ISO String
  resolvedAt?: string;         // ISO String
  responderId?: string;
  responderName?: string;
  durationSeconds?: number;     // calculated upon resolve
  notes?: string;
}

export interface SystemStats {
  totalCalls: number;
  emergencyCount: number;
  reliefCount: number;
  avgResponseTimeSeconds: number;
  callsByFloor: Record<string, number>;
  callsByHour: Record<number, number>;
  callsByStatus: Record<string, number>;
}

export type LanguageCode = 'ar' | 'en' | 'ur'; // Arabic, English, Urdu (common in rehabilitation support)

export interface TranslationSet {
  nidaa: string;
  emergencyCall: string;
  reliefCall: string;
  selectLocation: string;
  floor: string;
  wing: string;
  room: string;
  bed: string;
  workerName: string;
  sendNidaa: string;
  cancel: string;
  confirm: string;
  activeRequests: string;
  pending: string;
  accepted: string;
  resolved: string;
  accept: string;
  resolve: string;
  responder: string;
  responseTime: string;
  seconds: string;
  minutes: string;
  dashboard: string;
  login: string;
  logout: string;
  username: string;
  password: string;
  invalidCredentials: string;
  systemOwner: string;
  admin: string;
  monitor: string;
  emergencyTech: string;
  worker: string;
  bigScreen: string;
  observerScreen: string;
  emergencyScreen: string;
  backToSelection: string;
  alertNewCall: string;
  welcome: string;
  reliefRequestDesc: string;
  emergencyRequestDesc: string;
  historyLogs: string;
  settings: string;
  aiReports: string;
  buildingConfig: string;
  userManagement: string;
  noActiveCalls: string;
  generateAiReport: string;
  aiAnalyzing: string;
  aiSummaryReport: string;
  responseSpeed: string;
  emergencyTitle: string;
  [key: string]: any;
}
