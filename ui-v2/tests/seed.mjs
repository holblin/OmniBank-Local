// Synthetic data only. Called against the isolated preview/test backend.
export async function seed(request) {
  const existing = await (await request.get('/api/accounts/')).json();
  if (existing.length) return existing;
  async function post(path, data) {
    const response = await request.post(path, { data });
    if (!response.ok()) throw new Error(`Échec de création des données de test : ${response.status()} ${await response.text()}`);
    return response.json();
  }
  const current = await post('/api/accounts/', { name: 'Compte courant', type: 'Courant', initial_balance: 2400.35, currency: 'EUR' });
  const savings = await post('/api/accounts/', { name: 'Livret A', type: 'Épargne', initial_balance: 7200, currency: 'EUR' });
  await post('/api/config/', { main_account_id: String(current.id), pay_category: 'Salaire', base_pay_day: '28', enable_ai_reports: 'false', enable_org_mode: 'false' });
  const today = new Date();
  const iso = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const ago = n => { const date = new Date(today); date.setDate(date.getDate() - n); return iso(date); };
  const expenses = [
    ['Courses du marché', 68.4, 'Alimentation'], ['Café du quartier', 12.5, 'Loisirs'],
    ['Abonnement internet', 39.99, 'Abonnements'], ['Librairie', 24.9, 'Loisirs'],
    ['Courses alimentaires', 52.8, 'Alimentation'], ['Transport en commun', 32.6, 'Transport'],
  ];
  for (let n = 90; n >= 0; n--) {
    const date = new Date(today); date.setDate(date.getDate() - n);
    if (date.getDate() === 28) await post('/api/transactions/', { date_operation: iso(date), description: 'Salaire mensuel', amount: 2450, type: 'income', category: 'Salaire', to_account_id: current.id, reconciliation_date: iso(date), is_salary: true });
    if (date.getDate() === 1) await post('/api/transactions/', { date_operation: iso(date), description: 'Loyer & charges', amount: 820, type: 'expense_fixed', category: 'Logement', from_account_id: current.id, reconciliation_date: iso(date) });
    if (n % 4 === 0 || n < 6 || n === 90) {
      const [description, amount, category] = expenses[n % expenses.length];
      await post('/api/transactions/', { date_operation: iso(date), description, amount, type: 'expense_var', category, from_account_id: current.id, reconciliation_date: n === 0 ? null : iso(date) });
    }
  }
  await post('/api/transactions/', { date_operation: ago(8), description: 'Virement épargne', amount: 150, type: 'transfer', category: 'Épargne', from_account_id: current.id, to_account_id: savings.id, reconciliation_date: ago(8) });
  const future = new Date(today); future.setDate(future.getDate() + 2);
  await post('/api/transactions/', { date_operation: iso(future), description: 'Assurance habitation à venir', amount: 42.5, type: 'expense_fixed', category: 'Assurance', from_account_id: current.id });
  for (const [name, monthly_amount, categories] of [['Alimentation', 350, ['Alimentation']], ['Loisirs & sorties', 180, ['Loisirs']], ['Abonnements', 100, ['Abonnements']]]) {
    await post('/api/budgets/', { name, monthly_amount, categories, period: 'monthly' });
  }
  return [current, savings];
}
