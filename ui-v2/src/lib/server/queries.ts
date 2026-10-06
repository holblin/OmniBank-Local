import type {
  Account,
  AccountBalance,
  Transaction,
  Budget,
  BudgetStatus,
  Allocation,
  BudgetTransaction,
  DashboardStats,
  Trend,
  CategorySummary,
} from "./models";
import {
  queryOptions,
  useQueries,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { get, mutate } from "../http";
import { localDate } from "../navigation";
import { useProfileLock } from "../useProfileLock";

type ProfileId = string;
type Filters = Record<string, string>;
type Profile = { id: ProfileId; currency: string; has_pin: boolean };
type Configuration = { enable_org_mode?: string };
type Definition = Pick<UseQueryOptions<unknown>, "queryKey" | "queryFn">;
type DataOf<T extends Definition> = Awaited<
  ReturnType<Extract<T["queryFn"], (...args: never[]) => unknown>>
>;

// Domain keys include profile and every server-side filter. Each function lives
// next to its key; pages compose queries instead of implementing fetch effects.
export const accounts = {
  list: (id: ProfileId) =>
    queryOptions<Account[]>({
      queryKey: ["accounts", id, "list"],
      queryFn: ({ signal }) => get<Account[]>("/api/accounts/", signal),
    }),
  balances: (id: ProfileId) =>
    queryOptions<AccountBalance[]>({
      queryKey: ["accounts", id, "balances"],
      queryFn: ({ signal }) =>
        get<AccountBalance[]>("/api/stats/accounts", signal),
    }),
};
export const transactions = {
  list: (id: ProfileId, filters: Filters) =>
    queryOptions<Transaction[]>({
      queryKey: ["transactions", id, "list", filters],
      queryFn: ({ signal }) =>
        get<Transaction[]>(
          `/api/transactions/?${new URLSearchParams(filters)}`,
          signal,
        ),
    }),
};
export const budgets = {
  list: (id: ProfileId) =>
    queryOptions<Budget[]>({
      queryKey: ["budgets", id, "list"],
      queryFn: ({ signal }) => get<Budget[]>("/api/budgets/", signal),
    }),
  status: (id: ProfileId, month = "") =>
    queryOptions<{ budgets: BudgetStatus[] }>({
      queryKey: ["budgets", id, "status", month],
      queryFn: ({ signal }) =>
        get<{ budgets: BudgetStatus[] }>(
          `/api/budgets/status${month ? `?period_filter=all&year=${month.slice(0, 4)}&month=${Number(month.slice(5))}` : ""}`,
          signal,
        ),
    }),
  transactions: (id: ProfileId, budgetId: number, month: string) =>
    queryOptions<BudgetTransaction[]>({
      queryKey: ["budgets", id, budgetId, "transactions", month],
      queryFn: ({ signal }) =>
        get<BudgetTransaction[]>(
          `/api/budgets/${budgetId}/transactions?year=${month.slice(0, 4)}&month=${Number(month.slice(5))}`,
          signal,
        ),
    }),
  allocations: (id: ProfileId, budgetId: number) =>
    queryOptions<Allocation[]>({
      queryKey: ["budgets", id, budgetId, "allocations"],
      queryFn: ({ signal }) =>
        get<Allocation[]>(`/api/budgets/${budgetId}/allocations`, signal),
    }),
};
export const statistics = {
  dashboard: (id: ProfileId) =>
    queryOptions<DashboardStats>({
      queryKey: ["statistics", id, "dashboard"],
      queryFn: ({ signal }) =>
        get<DashboardStats>("/api/stats/dashboard", signal),
    }),
  summary: (id: ProfileId, filters: Filters) =>
    queryOptions<CategorySummary>({
      queryKey: ["statistics", id, "summary", filters],
      queryFn: ({ signal }) =>
        get<CategorySummary>(
          `/api/stats/categories_by_month?${new URLSearchParams(filters)}`,
          signal,
        ),
    }),
  trend: (id: ProfileId, account: string) =>
    queryOptions<Trend>({
      queryKey: ["statistics", id, "trend", account],
      queryFn: async ({ signal }) => {
        const result = await get<Trend>(`/api/stats/trends/${account}`, signal);
        if (result.error) throw new Error(result.error);
        return result;
      },
    }),
};

export function useSession() {
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["profiles", "active"],
    queryFn: ({ signal }) => get<Profile>("/api/profiles/active", signal),
  });
  const config = useQuery({
    queryKey: ["configuration"],
    queryFn: ({ signal }) => get<Configuration>("/api/config/", signal),
  });
  const blocked = Boolean(
    (profile.data?.has_pin &&
      sessionStorage.getItem("omni_is_locked") !== "false") ||
      (config.data?.enable_org_mode === "true" &&
        !sessionStorage.getItem("omni_current_user")),
  );
  useEffect(() => {
    if (blocked) {
      client.clear();
      window.location.replace('/v2/unlock');
    }
  }, [blocked, client]);
  useProfileLock(profile.data);
  return {
    profile: profile.data,
    config: config.data,
    enabled: Boolean(profile.data && config.data && !blocked),
    loading: profile.isPending || config.isPending,
    error: profile.isError || config.isError,
    refresh: () => Promise.all([profile.refetch(), config.refetch()]),
  };
}

export function useServerQueries<T extends Record<string, Definition>>(
  definitions: (id: ProfileId) => T,
) {
  const session = useSession();
  const entries = Object.entries(definitions(session.profile?.id ?? ""));
  const results = useQueries({
    queries: entries.map(([, option]) => ({
      ...option,
      enabled: session.enabled,
    })),
  });
  const ready =
    session.enabled && results.every((result) => result.data !== undefined);
  return {
    profile: session.profile,
    config: session.config,
    data: ready
      ? (Object.fromEntries(
          entries.map(([name], index) => [name, results[index].data]),
        ) as { [K in keyof T]: DataOf<T[K]> })
      : undefined,
    loading:
      session.loading ||
      (!session.error && !ready && results.some((result) => result.isPending)),
    error: session.error || results.some((result) => result.isError),
    fetching: results.some((result) => result.isFetching),
    refresh: () =>
      session.enabled
        ? Promise.all([
            session.refresh(),
            ...results.map((result) => result.refetch()),
          ])
        : session.refresh(),
  };
}

export function useDashboard() {
  return useServerQueries((id) => ({
    stats: statistics.dashboard(id),
    accounts: accounts.balances(id),
    budgets: budgets.status(id),
  }));
}
export function useHistory(filters: Filters) {
  return useServerQueries((id) => ({
    transactions: transactions.list(id, filters),
    accounts: accounts.list(id),
    budgets: budgets.list(id),
  }));
}
export function useBudgets(month: string) {
  return useServerQueries((id) => ({
    budgets: budgets.list(id),
    status: budgets.status(id, month),
    accounts: accounts.list(id),
  }));
}
export function useBudgetDetail(budgetId: number, month: string) {
  return useServerQueries((id) => ({
    transactions: budgets.transactions(id, budgetId, month),
    allocations: budgets.allocations(id, budgetId),
  }));
}
export function useSummary(filters: Filters) {
  return useServerQueries((id) => ({
    summary: statistics.summary(id, filters),
    accounts: accounts.list(id),
  }));
}
export function useTrend(account: string) {
  const session = useSession();
  return useQuery({
    ...statistics.trend(session.profile?.id ?? "", account),
    enabled: session.enabled && Boolean(account),
  });
}
export function useRecent(account: string) {
  const session = useSession();
  return useQuery({
    ...transactions.list(session.profile?.id ?? "", {
      limit: "6",
      date_end: localDate(),
      ...(account ? { account_id: account } : {}),
    }),
    enabled: session.enabled,
  });
}

type Write = {
  path: string;
  method: "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
};
export function useWrite(
  domain: "transactions" | "budgets",
  profileId: ProfileId = "",
) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [domain, profileId, "write"],
    mutationFn: ({ path, method, body }: Write) => {
      if (!profileId) throw new Error("Profil non disponible");
      return mutate(path, method, body);
    },
    onMutate: async (write) => {
      // Only reconciliation is speculative. Monetary writes stay authoritative.
      if (
        domain !== "transactions" ||
        write.method !== "PUT" ||
        !write.body ||
        Object.keys(write.body).length !== 1 ||
        !("reconciliation_date" in write.body)
      )
        return;
      const queryKey = ["transactions", profileId, "list"];
      await client.cancelQueries({ queryKey });
      const previous = client.getQueriesData<Transaction[]>({ queryKey });
      const id = Number(write.path.split("/").at(-1));
      for (const [key, data] of previous) {
        const filters = key[3] as Filters;
        // Filtered lists change membership; let the server resolve those.
        if (!filters.reconciled || filters.reconciled === "all")
          client.setQueryData(
            key,
            data?.map((row) =>
              row.id === id
                ? {
                    ...row,
                    reconciliation_date: write.body!.reconciliation_date as
                      | string
                      | null,
                  }
                : row,
            ),
          );
      }
      return previous;
    },
    onError: (_error, _write, previous) =>
      previous?.forEach(([key, data]) => client.setQueryData(key, data)),
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: [domain, profileId] }),
        client.invalidateQueries({
          queryKey:
            domain === "transactions"
              ? ["statistics", profileId]
              : ["statistics", profileId, "dashboard"],
        }),
        ...(domain === "transactions"
          ? [
              client.invalidateQueries({ queryKey: ["accounts", profileId] }),
              client.invalidateQueries({ queryKey: ["budgets", profileId] }),
            ]
          : []),
      ]),
  });
}
