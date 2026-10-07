// Read models mirror the existing local FastAPI responses. Amounts are supplied
// by the backend. Core balances remain authoritative; overview presentation
// statistics derive from the supplied ledger using integer cents.
export interface Account {
  id: number;
  name: string;
  type: string;
  currency: string;
  current_balance: number;
  is_closed: boolean;
  initial_balance: number;
  color?: string;
  interest_rate?: number;
  borrowed_amount?: number;
  monthly_payment?: number;
  loan_insurance?: number;
  loan_end_date?: string;
}
export interface AccountBalance
  extends Omit<Account, "current_balance" | "initial_balance"> {
  balance: number;
  is_loan: boolean;
}
export interface Transaction {
  is_salary?: boolean;
  id: number;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  date_operation: string;
  reconciliation_date: string | null;
  from_account_id: number | null;
  to_account_id: number | null;
  budget_id: number | null;
  is_skipped: boolean;
  attachments?: string | null;
  check_slip_number?: string | null;
  recurrence_id?: number | null;
}
export interface Budget {
  id: number;
  name: string;
  monthly_amount: number;
  period: string;
  envelope_type: string;
  is_project: boolean;
  is_closed: boolean;
  is_locked: boolean;
  categories: string[];
  account_ids: number[];
  start_date: string | null;
  end_date: string | null;
}
export interface BudgetStatus
  extends Omit<Budget, "monthly_amount" | "is_locked"> {
  balance?: number;
  percent: number;
  spent: number;
  remaining: number;
  budget_amount: number;
  income: number;
  expenses: number;
}
export interface Allocation {
  id: number;
  date: string;
  amount: number;
  note: string | null;
}
export interface BudgetTransaction {
  id: number;
  description: string;
  date: string;
  amount: number;
}
export interface DashboardStats {
  rest_to_live_with_income: number;
  total_unreconciled_expenses: number;
  total_unreconciled_income: number;
  liquid_net_worth: number;
  loan_total: number;
  net_worth: number;
  rest_to_live: number;
  unreconciled_expenses: number;
  main_account_id: number | null;
  next_pay_date: string | null;
  next_pay_amount: number;
  overdraft_warning: { date: string } | null;
  savings_summary: { balance: number };
}
export interface Trend {
  error?: string;
  history: { date: string; balance: number }[];
  current_balance: number;
}
export interface CategorySummary {
  months: string[];
  by_type: Record<
    string,
    {
      grand_total: number;
      totals_per_month: Record<string, number>;
      categories: Record<string, Record<string, number>>;
      totals_per_cat: Record<string, number>;
    }
  >;
}
