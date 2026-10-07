import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";
test.beforeAll(async ({ request }) => {
  await seed(request);
});
const pages = {
  accounts: "Comptes",
  categories: "Catégories",
  recurrences: "Récurrences",
  trends: "Tendances",
  simulator: "Simulateur",
  assistant: "Assistant IA",
  settings: "Paramètres",
  "bank-sync": "Synchronisation bancaire",
  journal: "Journal des modifications",
  imports: "Importer et exporter",
  notifications: "Notifications",
  setup: "Bienvenue chez vous.",
  overview: "Vue d’ensemble",
};
test("every remaining page loads natively in desktop and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [path, title] of Object.entries(pages)) {
      await page.goto(`/v2/${path}`);
      await expect(
        page.getByRole("heading", { name: title, exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Chargement…" }),
      ).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(
        "Erreur de connexion",
      );
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        )
        .toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("account editing stays in a dialog and deletion requires confirmation", async ({
  page,
  request,
}) => {
  await page.goto("/v2/accounts");
  await page
    .getByRole("button", { name: "Nouveau compte", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nom", { exact: true }).fill("V2 compte test");
  await dialog.getByLabel("Solde initial", { exact: true }).fill("123.45");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  const row = page.getByRole("row").filter({ hasText: "V2 compte test" });
  await expect(row).toContainText("123,45");
  await row.getByRole("button", { name: "Modifier", exact: true }).click();
  await dialog.getByLabel("Nom", { exact: true }).fill("V2 compte modifié");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  const updated = page
    .getByRole("row")
    .filter({ hasText: "V2 compte modifié" });
  await updated.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(updated).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(updated).toHaveCount(0);
  const accounts = await (await request.get("/api/accounts/")).json();
  expect(
    accounts.some((row: { name: string }) => row.name === "V2 compte modifié"),
  ).toBe(false);
});
test("recurrence creation and closure preserve API types", async ({
  page,
  request,
}) => {
  await page.goto("/v2/recurrences");
  await page
    .getByRole("button", { name: "Nouvelle récurrence", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Libellé", { exact: true })
    .fill("V2 récurrence test");
  await dialog.getByLabel("Montant", { exact: true }).fill("15.25");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  const row = page.getByRole("row").filter({ hasText: "V2 récurrence test" });
  await expect(row).toBeVisible();
  const rows = await (await request.get("/api/recurrences/")).json();
  expect(
    rows.find(
      (row: { description: string }) =>
        row.description === "V2 récurrence test",
    ).type,
  ).toBe("expense_var");
  await row.getByRole("button", { name: "Clôturer", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Date de clôture")
    .fill("2026-10-06");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(row).toHaveCount(0);
});
test("scenario event and projection use the local simulation engine", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/v2/simulator");
  await page
    .getByRole("button", { name: "Nouveau scénario", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nom", { exact: true })
    .fill("V2 scénario test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "V2 scénario test" })
    .getByRole("button", { name: "Choisir ce scénario", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nouvel événement", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Libellé", { exact: true })
    .fill("V2 achat test");
  await page
    .getByRole("dialog")
    .getByLabel("Montant", { exact: true })
    .fill("120");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "V2 achat test" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lancer une simulation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Horizon (mois)", { exact: true })
    .fill("6");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByText("Solde final simulé:", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("category CRUD and settings tools save through domain APIs", async ({
  page,
  request,
}) => {
  await page.goto("/v2/categories");
  await page
    .getByRole("button", { name: "Nouvelle catégorie", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nom", { exact: true })
    .fill("V2 catégorie test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  const row = page.getByRole("row").filter({ hasText: "V2 catégorie test" });
  await expect(row).toContainText("Dépenses variables");
  await row.getByRole("button", { name: "Supprimer", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await page.goto("/v2/settings");
  for (const title of [
    "Profils",
    "Sauvegardes",
    "Diagnostic",
    "Licence",
    "Équipe",
    "Règles de libellés",
    "Taux de change",
    "Mémoire de l’assistant",
    "Stockage partagé",
  ]) {
    await page
      .getByRole("navigation", { name: "Paramètres", exact: true })
      .getByRole("button", { name: title, exact: true })
      .click();
    await expect(page.locator("main")).not.toContainText(
      "Problème de connexion",
    );
  }
  await page
    .getByRole("navigation", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Règles de libellés", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Libellé bancaire", { exact: true })
    .fill("V2 TEST BANK LABEL");
  await page
    .getByRole("dialog")
    .getByLabel("Libellé lisible", { exact: true })
    .fill("V2 libellé test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "V2 TEST BANK LABEL" }),
  ).toBeVisible();
  const rules = await (await request.get("/api/smart-labels/mappings")).json();
  expect(
    rules.find(
      (row: { clean_description: string; is_manual: boolean }) =>
        row.clean_description === "V2 libellé test",
    ).is_manual,
  ).toBe(true);
});
test("PIN protected profile switch clears previous financial data and returns natively", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/profiles/", {
    data: {
      name: "V2 profil test",
      pin: "2468",
      auto_activate: false,
      currency: "EUR",
    },
  });
  expect(response.ok()).toBe(true);
  await page.goto("/v2/settings");
  await page
    .getByRole("navigation", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Profils", exact: true })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "V2 profil test" })
    .getByRole("button", { name: "Changer de profil", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Code PIN", { exact: true })
    .fill("2468");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page).toHaveURL(/\/v2\/?$/);
  await expect(
    page.getByRole("link").filter({ hasText: "V2 profil test" }),
  ).toBeVisible();
  await page.goto("/v2/accounts");
  await expect(
    page.getByRole("row").filter({ hasText: "Compte courant" }),
  ).toHaveCount(0);
  await page.goto("/v2/settings");
  await page
    .getByRole("navigation", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Profils", exact: true })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "V2 profil test" })
    .getByRole("button", { name: "Retirer le code PIN", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Code PIN actuel", { exact: true })
    .fill("2468");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  expect(
    (await (await request.get("/api/profiles/active")).json()).has_pin,
  ).toBe(true);
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Retirer le code PIN", exact: true })
    .click();
  await expect(page).toHaveURL(/\/v2\/?$/);
  expect(
    (await (await request.get("/api/profiles/active")).json()).has_pin,
  ).toBe(false);

  await page.goto("/v2/settings");
  await page
    .getByRole("navigation", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Profils", exact: true })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "Mon Profil" })
    .getByRole("button", { name: "Changer de profil", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page).toHaveURL(/\/v2\/?$/);
});
test("assistant streams locally, blocks remote images and confirms proposed financial actions", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/chat/sessions", {
    data: { title: "V2 conversation test", role: "advisor" },
  });
  const session = await response.json();
  const proposal = {
    action: "create_category",
    params: { name: "V2 AI category", type: "expense_var" },
  };
  let messages: { id: number; role: string; content: string }[] = [];
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:8436")) external.push(r.url());
  });
  await page.route(`**/api/chat/sessions/${session.id}/messages`, (route) =>
    route.fulfill({
      json: { messages, token_usage: { used: 50, limit: 4096 } },
    }),
  );
  await page.route(
    `**/api/chat/sessions/${session.id}/message`,
    async (route) => {
      const content = `Réponse locale. ![Remote image](https://example.com/private.png)\n\n\`\`\`action\n${JSON.stringify(proposal)}\n\`\`\``;
      messages = [{ id: 999, role: "assistant", content }];
      await route.fulfill({
        contentType: "text/event-stream",
        body: `data: ${JSON.stringify({ content })}\n\ndata: [DONE]\n\n`,
      });
    },
  );
  await page.goto("/v2/assistant");
  await page
    .getByRole("combobox", { name: "Conversation", exact: true })
    .selectOption(String(session.id));
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("V2 question test");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(
    page.getByText("Réponse locale.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Vérifier la proposition", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("V2 AI category");
  let categories = await (await request.get("/api/categories/")).json();
  expect(
    categories.some((row: { name: string }) => row.name === "V2 AI category"),
  ).toBe(false);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmer", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  categories = await (await request.get("/api/categories/")).json();
  expect(
    categories.some((row: { name: string }) => row.name === "V2 AI category"),
  ).toBe(true);
  expect(external).toEqual([]);
});

test("bank account mapping and statement review require explicit writes", async ({
  page,
  request,
}) => {
  const accounts = await (await request.get("/api/accounts/")).json();
  let writes: {
    path?: string;
    method?: string;
    body?: Record<string, unknown>;
    transaction?: {
      amount: number;
      category: string;
      account_id: number;
      csv_id: string;
    };
  }[] = [];
  let pending = [
    {
      csv_id: "v2-bank-row",
      description: "V2 import pending",
      amount: 15,
      type: "expense_var",
      category: "Alimentation",
      date_operation: "2026-10-01",
    },
  ];
  await page.route("**/api/bank-sync/connections", (route) =>
    route.fulfill({
      json: [
        {
          id: 999,
          label: "V2 banque test",
          backend: "test",
          is_active: true,
          account_mapping: "{}",
        },
      ],
    }),
  );
  await page.route("**/api/bank-sync/vault/status", (route) =>
    route.fulfill({
      json: { is_unlocked: true, vault_token: "test-local-token" },
    }),
  );
  await page.route("**/api/bank-sync/pending", (route) =>
    route.fulfill({
      json: {
        accounts: [
          {
            connection_id: 999,
            account_id: accounts[0].id,
            label: accounts[0].name,
            transactions: pending,
          },
        ],
      },
    }),
  );
  await page.route("**/api/bank-sync/connections/999/test-stream?*", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body:
        "event: accounts\ndata: " +
        JSON.stringify({
          accounts: [{ id: "remote-1", label: "V2 remote account" }],
        }) +
        "\n\n",
    }),
  );
  await page.route("**/api/bank-sync/connections/999", (route) => {
    writes.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/bank-sync/commit-ghost", (route) => {
    writes.push(route.request().postDataJSON());
    pending = [];
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/v2/bank-sync");
  await page
    .getByRole("row")
    .filter({ hasText: "V2 banque test" })
    .getByRole("button", { name: "Associer les comptes", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "V2 remote account", exact: true })
    .selectOption(String(accounts[0].id));
  expect(writes).toEqual([]);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(writes[0]).toEqual({
    account_mapping: { "remote-1": accounts[0].id },
  });
  await page
    .getByRole("row")
    .filter({ hasText: "V2 import pending" })
    .getByRole("button", { name: "Accepter", exact: true })
    .click();
  expect(writes).toHaveLength(1);
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Accepter", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "V2 import pending" }),
  ).toHaveCount(0);
  expect(writes[1].transaction!.account_id).toBe(accounts[0].id);
  expect(writes[1].transaction!.csv_id).toBe("v2-bank-row");
});

test("all migrated pages include English translations", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("omni_lang", "en"));
  for (const path of Object.keys(pages)) {
    await page.goto(`/v2/${path}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main")).not.toContainText("Loading");
    await expect(page.locator("main h1")).not.toBeEmpty();
    await expect(page.locator("main")).not.toContainText("Connection error");
  }
});

test("maintenance corrections send reviewed record IDs after confirmation", async ({
  page,
}) => {
  let writes: {
    path?: string;
    method?: string;
    body?: Record<string, unknown>;
    transaction?: {
      amount: number;
      category: string;
      account_id: number;
      csv_id: string;
    };
  }[] = [];
  const rows = [
    {
      id: 123,
      description: "V2 maintenance row",
      amount: 0,
      date_operation: "2026-10-01",
      category: "Test",
    },
  ];
  await page.route(
    "**/api/maintenance/convert_zeroed_to_skipped/preview",
    (route) =>
      route.fulfill({
        json: { count: rows.length, groups: [{ transactions: rows }] },
      }),
  );
  await page.route(
    "**/api/maintenance/convert_zeroed_to_skipped/apply",
    (route) => {
      writes.push(route.request().postDataJSON());
      rows.length = 0;
      return route.fulfill({ json: { converted: 1 } });
    },
  );
  await page.goto("/v2/settings");
  await page
    .getByRole("navigation", { name: "Paramètres", exact: true })
    .getByRole("button", { name: "Maintenance des données", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Vérification", exact: true })
    .selectOption("convert_zeroed_to_skipped");
  await expect(
    page.getByRole("row").filter({ hasText: "V2 maintenance row" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Appliquer la correction", exact: true })
    .click();
  expect(writes).toEqual([]);
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Appliquer la correction", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "V2 maintenance row" }),
  ).toHaveCount(0);
  expect(writes).toEqual([[123]]);
});
