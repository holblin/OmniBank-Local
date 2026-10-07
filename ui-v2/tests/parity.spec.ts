import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";
test.beforeAll(async ({ request }) => {
  await seed(request);
});

test.afterEach(async ({ request }) => {
  const recurrences: { id: number; description: string }[] = await (
    await request.get("/api/recurrences/")
  ).json();
  for (const row of recurrences.filter((row) =>
    row.description.startsWith("Récurrence parité"),
  ))
    await request.delete(`/api/recurrences/${row.id}`);
  const transactions: { id: number; description: string }[] = await (
    await request.get("/api/transactions/?limit=100000")
  ).json();
  for (const row of transactions.filter((row) =>
    [
      "CSV natif parité",
      "Achat corrigé parité",
      "Annulation globale parité",
      "Chronologie parité",
    ].includes(row.description),
  ))
    await request.delete(`/api/transactions/${row.id}`);
  const budgets: { id: number; name: string }[] = await (
    await request.get("/api/budgets/")
  ).json();
  for (const row of budgets.filter((row) =>
    row.name.startsWith("Suggestion parité"),
  ))
    await request.delete(`/api/budgets/${row.id}`);
  const scenarios: { id: number; name: string }[] = await (
    await request.get("/api/simulator/scenarios")
  ).json();
  for (const row of scenarios.filter((row) => row.name === "Achat Véhicule"))
    await request.delete(`/api/simulator/scenarios/${row.id}`);
});

test("native CSV restoration and editable statement preview save through the real local API", async ({
  page,
  request,
}) => {
  const accounts: { id: number; name: string }[] = await (
    await request.get("/api/accounts/")
  ).json();
  const account = accounts.find((row) => row.name === "Compte courant")!;
  await page.goto("/v2/imports");
  await page.getByLabel("Type d’import").selectOption("native");
  await page.getByLabel("Relevé bancaire").setInputFiles({
    name: "native-parity.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Date de saisie;Date opération;Description;Montant;Type;Catégorie;Depuis;Vers;Date de rapprochement;ID;Documents joints\n01/10/2026;01/10/2026;CSV natif parité;12,34;Dépenses variables;Transport;Compte courant;;01/10/2026;native-parity-1;uploads/evidence-parity.txt\n",
    ),
  });
  await page
    .getByLabel("Restaurer les documents joints", { exact: true })
    .setInputFiles({
      name: "evidence-parity.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Pièce de test synthétique"),
    });
  await page.route(
    "**/api/csv/upload_attachments",
    (route) =>
      route.fulfill({
        status: 500,
        json: { detail: "Échec simulé de transfert des documents" },
      }),
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Restaurer un CSV OmniBank", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", {
      name: "Enregistrer les opérations sélectionnées",
      exact: true,
    })
    .click();
  await expect(page.getByRole("alertdialog")).toContainText("La sauvegarde a échoué");
  expect(
    await (
      await request.get("/api/transactions/?search=CSV%20natif%20parité")
    ).json(),
  ).toHaveLength(0);
  await page
    .getByRole("alertdialog")
    .getByRole("button", {
      name: "Enregistrer les opérations sélectionnées",
      exact: true,
    })
    .click();
  await expect(
    page.locator('p[role="status"]').filter({ hasText: "Import enregistré" }),
  ).toBeVisible();
  const native = await (
    await request.get("/api/transactions/?search=CSV%20natif%20parité")
  ).json();
  expect(native[0].amount).toBe(12.34);
  expect(native[0].attachments).toMatch(
    /^uploads\/[^/]+_evidence-parity\.txt$/,
  );
  await page.getByLabel("Type d’import").selectOption("statement");
  await page
    .getByLabel("Sélectionner un compte")
    .selectOption(String(account.id));
  await page.getByLabel("Relevé bancaire").setInputFiles({
    name: "statement-parity.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Date;Libellé;Montant\n01/10/2026;Achat preview parité;-23,45\n",
    ),
  });
  await page
    .getByRole("button", { name: "Inspecter le fichier", exact: true })
    .click();
  await expect(page.getByText("Confiance: 100%")).toBeVisible();
  await page
    .getByRole("button", { name: "Aperçu de l’import", exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: "Aperçu de l’import" }),
  ).toContainText("Achat preview parité");
  await page
    .getByRole("table", { name: "Aperçu de l’import" })
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Libellé", exact: true })
    .fill("Achat corrigé parité");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Enregistrer les opérations sélectionnées",
      exact: true,
    })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", {
      name: "Enregistrer les opérations sélectionnées",
      exact: true,
    })
    .click();
  await expect(
    page.locator('p[role="status"]').filter({ hasText: "Import enregistré" }),
  ).toBeVisible();
  const saved = await (
    await request.get("/api/transactions/?search=Achat%20corrigé%20parité")
  ).json();
  expect(saved[0].amount).toBe(23.45);
  expect(saved[0].from_account_id).toBe(account.id);
});

test("annual recurrence renewal generates instances and propagates amount changes", async ({
  page,
  request,
}) => {
  const account = (await (await request.get("/api/accounts/")).json())[0];
  const created = await request.post("/api/recurrences/", {
    data: {
      description: "Récurrence parité",
      amount: 45,
      type: "expense_fixed",
      category: "Transport",
      frequency: "Monthly",
      day_of_month: 8,
      from_account_id: account.id,
    },
  });
  expect(created.ok()).toBeTruthy();
  const recurrence = await created.json();
  await page.goto("/v2/recurrences");
  await page
    .getByRole("button", { name: "Préparer l’année", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Récurrence parité", exact: true })
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("55.55");
  await page
    .getByRole("dialog", { name: "Préparer l’année" })
    .getByRole("button", { name: "Nouvelle récurrence", exact: true })
    .click();
  const newTemplate = page.getByRole("dialog", { name: "Nouvelle récurrence" });
  await newTemplate
    .getByLabel("Libellé", { exact: true })
    .fill("Récurrence parité annuelle");
  await newTemplate.getByLabel("Montant", { exact: true }).fill("21.34");
  await newTemplate
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Préparer l’année" }),
  ).toContainText("Récurrence parité annuelle");
  await page
    .getByRole("button", { name: "Appliquer le renouvellement", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Échéances générées")
    .selectOption(String(recurrence.id));
  const table = page.getByRole("table", { name: "Échéances générées" });
  await expect(table).toContainText("55,55");
  await table
    .getByRole("button", {
      name: "Propager aux prochaines échéances",
      exact: true,
    })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("66.66");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(table).toContainText("66,66");
});

test("trends controls, simulator presets and detailed results are native V2 workflows", async ({
  page,
}) => {
  await page.goto("/v2/trends");
  await page.getByLabel("Période", { exact: true }).selectOption("3");
  await page.getByLabel("Alignement").selectOption("calendar");
  await page.getByLabel("Superposer les années précédentes").check();
  await expect(page.getByRole("table", { name: "Statistiques" })).toBeVisible();
  await page.getByLabel("Affichage du graphique").selectOption("monthly_net");
  await expect(
    page.getByRole("img", { name: "Évolution quotidienne du solde du compte" }),
  ).toBeVisible();
  await page.goto("/v2/simulator");
  await page.getByLabel("Modèles de scénario").selectOption("vehicle_project");
  await page
    .getByRole("button", { name: "Créer depuis le modèle", exact: true })
    .click();
  await expect(page.getByRole("table", { name: "Scénarios" })).toContainText(
    "Achat Véhicule",
  );
  await page
    .getByRole("button", { name: "Lancer une simulation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: "Projection mois par mois" }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Indicateurs de projection" }),
  ).toBeVisible();
});

test("history column preferences, category drilldown, privacy and global undo work", async ({
  page,
  request,
}) => {
  await page.goto("/v2/history?category=Transport");
  await expect(
    page.getByRole("heading", { name: "Historique", exact: true }),
  ).toBeVisible();
  await page.getByText("Colonnes visibles", { exact: true }).click();
  await page.getByLabel("Montant", { exact: true }).uncheck();
  await expect(
    page.getByRole("columnheader", { name: "Montant", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Montant", { exact: true }).check();
  await page.goto("/v2");
  await page
    .getByRole("button", { name: "Masquer les montants", exact: true })
    .click();
  await expect(page.getByText("Montants masqués").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Afficher les montants", exact: true })
    .click();
  const accounts = await (await request.get("/api/accounts/")).json();
  const response = await request.post("/api/transactions/", {
    data: {
      description: "Annulation globale parité",
      date_operation: "2026-10-01",
      type: "expense_var",
      amount: 10,
      from_account_id: accounts[0].id,
    },
  });
  expect(response.ok()).toBeTruthy();
  await page.reload();
  await page
    .getByRole("button", { name: "Annuler la modification", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await (
            await request.get(
              "/api/transactions/?search=Annulation%20globale%20parité",
            )
          ).json()
        ).length,
    )
    .toBe(0);
  await page.getByRole("button", { name: "Rétablir", exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await (
            await request.get(
              "/api/transactions/?search=Annulation%20globale%20parité",
            )
          ).json()
        ).length,
    )
    .toBe(1);
});

test("automatic sync settings persist and assistant context can be edited and reset", async ({
  page,
  request,
}) => {
  await page.goto("/v2/bank-sync");
  await page
    .getByRole("button", { name: "Relevé automatique", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Intervalle en heures", exact: true })
    .fill("48");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await request.get("/api/bank-sync/settings/auto-sync")).json())
          .interval_hours,
    )
    .toBe(48);
  const contextSession = await (
    await request.post("/api/chat/sessions", {
      data: { title: "Contexte parité", role: "advisor" },
    })
  ).json();
  await page.goto("/v2/assistant");
  await page
    .getByRole("combobox", { name: "Conversation", exact: true })
    .selectOption(String(contextSession.id));
  await page
    .getByRole("button", { name: "Modifier le résumé", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Résumé du contexte", exact: true })
    .fill("Conserver les objectifs annuels.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator("summary")
    .filter({ hasText: "Résumé du contexte" })
    .click();
  await expect(
    page.getByText("Conserver les objectifs annuels."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restaurer le contexte complet", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Restaurer le contexte complet", exact: true })
    .click();
  await expect(page.getByText("Conserver les objectifs annuels.")).toHaveCount(
    0,
  );
});

test("budget proposals can be reviewed and accepted in bulk into real envelopes", async ({
  page,
  request,
}) => {
  await page.route("**/api/budgets/ai_suggest", (route) =>
    route.fulfill({
      json: {
        proposals: [
          {
            name: "Suggestion parité transport",
            categories: ["Transport"],
            suggested_amount: 125.55,
            suggested_period: "monthly",
            justification: "Moyenne des déplacements",
          },
          {
            name: "Suggestion parité loisirs",
            categories: ["Loisirs"],
            suggested_amount: 60.25,
            suggested_period: "monthly",
            justification: "Moyenne des loisirs",
          },
        ],
        unclassified_categories: [],
      },
    }),
  );
  await page.goto("/v2/budgets");
  await page.getByText("Suggestions d’enveloppes", { exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Capacité budgétaire" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Analyser les enveloppes avec l’IA locale",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("table", { name: "Suggestions d’enveloppes" }),
  ).toContainText("Suggestion parité transport");
  await page
    .getByRole("button", {
      name: "Accepter les suggestions sélectionnées",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => {
      const budgets: { name: string; monthly_amount: number }[] = await (
        await request.get("/api/budgets/")
      ).json();
      return budgets
        .filter((row) => row.name.startsWith("Suggestion parité"))
        .map((row) => row.monthly_amount)
        .sort();
    })
    .toEqual([125.55, 60.25]);
});

test("overview timeline supports reconciliation, skipping and editing", async ({
  page,
  request,
}) => {
  const account = (await (await request.get("/api/accounts/")).json())[0];
  const created = await request.post("/api/transactions/", {
    data: {
      description: "Chronologie parité",
      date_operation: "2026-10-01",
      type: "expense_var",
      amount: 31.45,
      from_account_id: account.id,
    },
  });
  expect(created.ok()).toBeTruthy();
  const tx = await created.json();
  await page.goto("/v2/overview");
  const table = page.getByRole("table", { name: "Chronologie financière" });
  const row = table.getByRole("row").filter({ hasText: "Chronologie parité" });
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: "Ignorer cette échéance", exact: true })
    .click();
  await expect
    .poll(async () => {
      const items = await (
        await request.get("/api/transactions/?search=Chronologie%20parité")
      ).json();
      return items[0].is_skipped;
    })
    .toBe(true);
  await page
    .getByRole("combobox", { name: "Chronologie financière", exact: true })
    .selectOption("all");
  const timelineViewport = page.getByRole("region", {
    name: "Chronologie financière",
    exact: true,
  });
  await timelineViewport.focus();
  for (let step = 0; step < 15 && (await row.count()) === 0; step++) {
    await timelineViewport.press("PageDown");
    await timelineViewport.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }
  await row
    .getByRole("button", { name: "Réactiver cette échéance", exact: true })
    .click();
  await row.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("32.45");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(row).toContainText("32,45");
  await row.getByRole("button", { name: "Rapprocher", exact: true }).click();
  await expect
    .poll(async () => {
      const items = await (
        await request.get("/api/transactions/?search=Chronologie%20parité")
      ).json();
      return Boolean(
        items.find((item: { id: number }) => item.id === tx.id)
          ?.reconciliation_date,
      );
    })
    .toBe(true);
});

test("clearing a ledger requires confirmation and the explicit backend header", async ({
  page,
}) => {
  let calls = 0;
  let confirmationHeader: string | undefined;
  await page.route("**/api/transactions/all/clear", (route) => {
    calls++;
    confirmationHeader = route.request().headers()["x-confirm-danger"];
    return route.fulfill({ json: { deleted: 0 } });
  });
  await page.goto("/v2/settings");
  await page.getByRole("button", { name: "Sauvegardes", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Effacer toutes les opérations du profil",
      exact: true,
    })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Annuler", exact: true })
    .click();
  expect(calls).toBe(0);
  await page
    .getByRole("button", {
      name: "Effacer toutes les opérations du profil",
      exact: true,
    })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", {
      name: "Effacer toutes les opérations du profil",
      exact: true,
    })
    .click();
  await expect.poll(() => calls).toBe(1);
  expect(confirmationHeader).toBe("clear");
});
