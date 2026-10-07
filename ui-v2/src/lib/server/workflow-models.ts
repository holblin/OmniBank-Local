import type { Transaction } from "./models";

export type FinancialInfo =
  | {
      type: "loan";
      current_balance: number;
      repaid_amount: number;
      repaid_percent: number;
      amortization: {
        capital_month: number;
        interest_month: number;
        total_monthly: number;
      };
    }
  | { type: "savings"; current_balance: number; estimated_interest: number };
export interface SimulationMonth {
  month: string;
  baseline_end_balance: number;
  simulated_end_balance: number;
  baseline_income: number;
  baseline_expense: number;
  simulated_income: number;
  simulated_expense: number;
  optimistic_end_balance: number;
  pessimistic_end_balance: number;
  difference: number;
  baseline_fixed: number;
  baseline_variable: number;
  simulated_events_impact: number;
}
export interface SimulationResult {
  baseline_final_balance: number;
  simulated_final_balance: number;
  monthly_data: SimulationMonth[];
  total_difference: number;
  percentage_difference: number;
  min_simulated_balance: number;
  first_overdraft_date: string | null;
  max_overdraft_amount: number;
  avg_simulated_net: number;
  break_even_monthly_saving: number;
  break_even_var_reduction_pct: number;
  break_even_maintain_initial_saving: number;
  fixed_deficit_monthly: number;
  avg_variable_expense: number;
  variable_expense_stddev: number;
  excluded_outliers_count: number;
  excluded_income_outliers_count: number;
  seasonal_history_months: number;
  predicted_salary: number;
}
export interface SimulatorPreset {
  id: string;
  name_fr: string;
  name_en: string;
  desc_fr: string;
  desc_en: string;
  events: {
    label_fr: string;
    label_en: string;
    event_type: string;
    amount: number;
    duration_months: number;
    notes_fr: string;
    notes_en: string;
  }[];
}
export interface VaultStatus {
  is_unlocked: boolean;
  vault_token?: string;
}
export interface RemoteAccount {
  id: string;
  label: string;
  balance?: number;
}
export interface BankChallenge {
  session_id: string;
  type: string;
  message: string;
}
export interface StreamEvent extends Partial<BankChallenge> {
  content?: string;
  status?: string;
  clear_text?: boolean;
  error?: string;
  step?: string;
  accounts?: RemoteAccount[];
}
export interface BankBackend {
  name: string;
  description: string;
  fields: {
    id: string;
    label: string;
    type: string;
    required: boolean;
    choices?: Record<string, string>;
  }[];
}
export interface PendingRow {
  csv_id: string;
  amount: number;
  description: string;
  date_operation: string;
  already_reconciled?: boolean;
  _excluded?: boolean;
  matched_tx_id?: number;
  is_coming?: boolean;
  is_reconciled?: boolean;
  matched_db_id?: number;
  match_type?: string;
  category?: string;
}
export interface BankPending {
  accounts: {
    account_id: number;
    account_name: string;
    connection_id: number;
    label?: string;
    name?: string;
    transactions: PendingRow[];
  }[];
}
export interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  created_at: string;
  is_read: boolean;
  is_archived: boolean;
  link?: string;
  detail?: string;
  detailed_content?: string;
  content?: string;
}
export interface BackupStatus {
  files: { filename: string; size: number }[];
}
export interface SharedStorageInfo {
  mode: string;
  path: string;
  shared_path?: string;
  is_shared: boolean;
  active: boolean;
  data_dir: string;
  current_data_dir: string;
}
export interface MaintenancePreview {
  count: number;
  sample?: Transaction[];
  transactions?: Transaction[];
  groups?: { transactions: Transaction[] }[];
}
export interface LicenseStatus {
  active: boolean;
  email?: string;
}
export interface OrganizationUser {
  id: number;
  name: string;
  is_active: boolean;
}
export interface Proposal {
  messageId?: number;
  action: string;
  params: Record<string, unknown>;
}
