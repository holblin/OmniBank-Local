import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { get, mutate } from "../http";
import { useServerQueries } from "./queries";

export interface Category {
  id: number;
  name: string;
  type: string;
  is_closed: boolean;
}
export interface Recurrence {
  id: number;
  description: string;
  amount: number;
  type: string;
  category?: string;
  frequency: string;
  day_of_month?: number;
  month_of_year?: number | null;
  max_occurrences?: number | null;
  is_closed: boolean;
  from_account_id?: number | null;
  to_account_id?: number | null;
}
export interface ScenarioEvent {
  id: number;
  label: string;
  event_type: string;
  amount: number;
  start_date: string;
  end_date?: string;
  duration_months?: number;
  account_id?: number;
  category?: string;
  is_active: boolean;
  notes?: string;
}
export interface Scenario {
  id: number;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  events: ScenarioEvent[];
}
export interface JournalEntry {
  id: number;
  timestamp: string;
  entity_type: string;
  entity_id: number;
  action_type: string;
  previous_state?: string;
  new_state?: string;
  is_undone: boolean;
  user_name?: string;
}
export interface ChatSession {
  id: number;
  title: string;
  role: string;
}
export interface ChatMessage {
  entity_snapshots?: Record<string, unknown> | null;
  id: number;
  role: string;
  content: string;
  timestamp: string;
}
export interface Conversation {
  messages: ChatMessage[];
  compressed_context?: string;
  token_usage: { used: number; limit: number };
}
export interface BankConnection {
  id: number;
  label: string;
  backend: string;
  is_active: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  last_error?: string;
  account_mapping?: string;
  has_credentials: boolean;
}
export interface Profile {
  id: string;
  name: string;
  currency: string;
  has_pin: boolean;
  pay_cycle_day?: number;
  date_format?: string;
}

// Keys describe the domain, profile, resource, and its parameters. Optional
// capabilities are queried only on their page, so a missing Ollama or bank
// provider never prevents the core financial pages from loading.
export function resource<T>(
  domain: string,
  profileId: string,
  kind: string,
  path: string,
) {
  return queryOptions<T>({
    queryKey: [domain, profileId, kind, path],
    queryFn: ({ signal }) => get<T>(path, signal),
  });
}
export function useWorkspace<T>(domain: string, path: string) {
  return useServerQueries((id) => ({
    items: resource<T>(domain, id, "list", path),
  }));
}
const dependencies: Record<string, string[]> = {
  accounts: [
    "accounts",
    "statistics",
    "transactions",
    "recurrences",
    "budgets",
    "setup",
  ],
  categories: [
    "categories",
    "statistics",
    "transactions",
    "recurrences",
    "budgets",
  ],
  recurrences: [
    "recurrences",
    "transactions",
    "statistics",
    "accounts",
    "budgets",
  ],
  simulator: ["simulator"],
  chat: ["chat"],
  "bank-sync": [
    "bank-sync",
    "transactions",
    "accounts",
    "statistics",
    "categories",
    "budgets",
  ],
  journal: [
    "setup",
    "journal",
    "accounts",
    "categories",
    "transactions",
    "recurrences",
    "budgets",
    "statistics",
  ],
  configuration: [
    "configuration",
    "statistics",
    "recurrences",
    "transactions",
    "profiles",
  ],
  "smart-labels": ["smart-labels", "bank-sync", "journal"],
  "exchange-rates": ["exchange-rates", "accounts", "statistics"],
};
export function useWorkspaceWrite(domain: string, profileId: string = "") {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [domain, profileId, "write"],
    mutationFn: ({
      path,
      method = "POST",
      body,
    }: {
      path: string;
      method?: "POST" | "PUT" | "DELETE";
      body?: Record<string, unknown> | number[];
    }) => {
      if (!profileId) throw new Error("Profil non disponible");
      return mutate(path, method, body);
    },
    onSettled: () =>
      Promise.all(
        [...(dependencies[domain] ?? [domain]), "journal"].map((key) =>
          client.invalidateQueries({
            queryKey:
              key === "configuration" || key === "profiles"
                ? [key]
                : [key, profileId],
          }),
        ),
      ),
  });
}
