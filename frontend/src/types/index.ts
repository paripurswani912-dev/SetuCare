export type Role = 'ASHA' | 'DOCTOR' | 'FACILITY_ADMIN' | 'DISTRICT_MANAGER' | 'ADMIN';
export type Language = 'en' | 'hi';

export interface Patient {
  patient_id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  abha_id?: string | null;
  created_at?: string;
}

export interface PatientCreate {
  name: string;
  age: number;
  gender: string;
  phone: string;
  abha_id?: string;
}

export interface Consent {
  consent_id: number;
  patient_id: number;
  purpose: string;
  granted_to: string;
  status: 'GRANTED' | 'REVOKED' | 'EXPIRED';
  granted_at?: string;
  expires_at?: string;
}

export interface ConsentCreate {
  patient_id: number;
  purpose?: string;
  granted_to?: string;
  valid_days?: number;
}

export type ReferralStatus =
  | 'CREATED'
  | 'ACKNOWLEDGED'
  | 'APPOINTMENT'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'TREATMENT'
  | 'COUNTER_REFERRAL'
  | 'FOLLOW_UP'
  | 'COMPLETED';

export type Priority = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export interface Referral {
  referral_id: number;
  patient_id: number;
  from_facility: string;
  to_facility: string;
  reason: string;
  service_required: string;
  resource_type?: string | null;
  resource_id?: string | null;
  priority: Priority;
  priority_reason?: string | null;
  triage_score?: number | null;
  status: ReferralStatus;
  escalated: boolean;
  created_at: string;
  sla_deadline?: string | null;
  acknowledged_at?: string | null;
  appointment_date?: string | null;
  treatment_notes?: string | null;
  counter_referral_notes?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
}

export interface ReferralCreate {
  patient_id: number;
  from_facility: string;
  to_facility: string;
  reason: string;
  service_required: string;
  resource_type?: string;
  resource_id?: string;
  priority: Priority;
  priority_reason?: string;
  triage_score?: number;
}

export interface AuditLog {
  log_id: number;
  referral_id?: number | null;
  action: string;
  actor: string;
  role: string;
  details?: string | null;
  created_at: string;
}

export interface Notification {
  notification_id: number;
  referral_id?: number | null;
  recipient: string;
  channel: string;
  message: string;
  created_at: string;
}

export interface ReferralTimeline {
  referral: Referral;
  patient: {
    patient_id: number;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    abha_id?: string | null;
  };
  consent_active: boolean;
  sla_breached: boolean;
  events: AuditLog[];
  notifications: Notification[];
}

export interface QueueItem {
  queue_position: number;
  referral_id: number;
  patient_id: number;
  priority: Priority;
  service_required: string;
  resource_type?: string;
  resource_id?: string;
  status: ReferralStatus;
}

export interface Resource {
  resource_id: number;
  facility_name: string;
  resource_type: string;
  resource_name: string;
  quantity: number;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface ResourceCreate {
  facility_name: string;
  resource_type: string;
  resource_name: string;
  quantity: number;
}

export interface ResourceMatch {
  resource_id: number;
  facility_name: string;
  resource_name: string;
  available: number;
}

export interface Prescription {
  prescription_id: number;
  referral_id: number;
  doctor_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  created_at?: string;
}

export interface PrescriptionCreate {
  referral_id: number;
  doctor_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface AvailabilityResponse {
  prescription_id: number;
  medicine_name: string;
  facility_name: string;
  availability: 'AVAILABLE' | 'OUT_OF_STOCK' | 'NOT_FOUND';
  quantity: number;
}

export interface MedicineInventory {
  inventory_id: number;
  medicine_name: string;
  facility_name: string;
  quantity: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'NOT_FOUND';
}

export interface MedicineInventoryCreate {
  medicine_name: string;
  facility_name: string;
  quantity: number;
}

export interface MedicineDispense {
  dispense_id: number;
  prescription_id: number;
  inventory_id: number;
  quantity: number;
  dispensed_by: string;
  dispensed_at?: string;
}

export interface DashboardSummary {
  total_referrals: number;
  completed: number;
  completion_rate: number;
  pending: number;
  sla_breached: number;
  escalated: number;
  sla_compliance_rate: number;
  avg_ack_minutes: number;
  by_status: Record<ReferralStatus, number>;
  by_priority: Record<Priority, number>;
  by_facility: Record<string, number>;
}

export interface SLABreach {
  referral_id: number;
  to_facility: string;
  priority: Priority;
  sla_deadline: string;
  escalated: boolean;
  hours_overdue: number;
}

export interface QueuedOfflineRequest {
  id: string;
  endpoint: string;
  method: string;
  body?: any;
  timestamp: string;
}
