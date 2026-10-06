import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Shell } from '../components/Shell';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { BudgetList } from '../components/BudgetList';
import { TransactionList } from '../components/TransactionList';
import { get, legacyUrl, loadDashboard, loadTransactions, localDate } from '../lib/api';
import { useProfileLock } from '../lib/useResource';
import { useLanguage } from '../lib/i18n';
import s from '../components/Dashboard.module.css';

const BalanceChart = lazy(() => import('../components/BalanceChart').then(module => ({ default: module.BalanceChart })));

export function Dashboard() {
  const { t, money, date, locale } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [days, setDays] = useState(30);
  const [trend, setTrend] = useState({ loading: true, history: [] });
  const [transactions, setTransactions] = useState({ loading: true, items: [] });
  useProfileLock(data?.profile);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    loadDashboard(controller.signal).then(result => {
      setData(result);
      setAccountId(previous => result.accounts.some(a => String(a.id) === previous) ? previous : String(result.stats.main_account_id || result.accounts[0]?.id || ''));
    }).catch(e => { if (e.name !== 'AbortError') setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!data || loading || error) return;
    const controller = new AbortController();
    setTransactions({ loading: true, items: [] });
    loadTransactions(accountId, controller.signal).then(items => setTransactions({ loading: false, items }))
      .catch(e => { if (e.name !== 'AbortError') setTransactions({ loading: false, items: [], error: true }); });
    setTrend({ loading: true, history: [] });
    if (accountId) {
      get(`/api/stats/trends/${accountId}`, controller.signal).then(result => {
        if (result.error) throw new Error(result.error);
        setTrend({ loading: false, history: result.history, balance: result.current_balance });
      }).catch(e => { if (e.name !== 'AbortError') setTrend({ loading: false, history: [], error: true }); });
    } else setTrend({ loading: false, history: [] });
    return () => controller.abort();
  }, [data, accountId, loading, error]);
  const account = data?.accounts.find(a => String(a.id) === accountId);
  const currency = data?.profile.currency || 'EUR';
  const chartCurrency = account?.currency || currency;
  const history = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return trend.history.filter(point => point.date >= localDate(cutoff));
  }, [trend.history, days]);
  const hasPayForecast = stats => stats.next_pay_date && stats.next_pay_amount > 0;
  const stats = data?.stats;
  return <Shell profile={data?.profile}>
    <div className={s.pageHeading}>
      <div><div className={s.eyebrow}>{new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div><h1>{t('dashboard')}</h1><p>{t('intro')}</p></div>
      <div className={s.actions}><Button label={t('refresh')} icon={<Icon name="refresh" size={16}/>} variant="secondary" isLoading={loading} onClick={() => setRevision(v => v + 1)}/><Button label={t('new_transaction')} icon={<Icon name="plus" size={17}/>} variant="primary" href="/v2/history?new=1"/></div>
    </div>
    {error ? <section className={`${s.panel} ${s.error}`} role="alert"><Icon name="refresh" size={30}/><h2>{t('connection_error')}</h2><p>{t('connection_error_body')}</p><Button label={t('retry')} onClick={() => setRevision(v => v + 1)}/></section> : loading ? <div role="status" className={s.loading}>{t('loading')}<div className={s.skeletonGrid}>{[0, 1, 2, 3].map(i => <div key={i}/>)}</div></div> : <>
      <div className={s.sectionLabel}><span>{t('overview')}</span><span><Icon name="check" size={12}/>{t('reconciled_balances')}</span></div>
      <div className={s.metrics}>
        <MetricCard label={t('net_worth')} value={money(stats.net_worth, currency)} detail={`${data.accounts.length} ${t('active_accounts')}`} icon="wallet" featured/>
        <MetricCard label={t('rest_to_live')} value={money(stats.rest_to_live, currency)} detail={t('until_payday')} icon="target" warning={stats.rest_to_live < 0}/>
        <MetricCard label={t('pending_expenses')} value={money(stats.unreconciled_expenses, currency)} detail={t('before_payday')} icon="clock"/>
        <MetricCard label={t('next_pay')} value={hasPayForecast(stats) ? money(stats.next_pay_amount, currency) : '—'} detail={hasPayForecast(stats) ? `${t('estimated_on')} ${date(stats.next_pay_date)}` : t('no_pay_forecast')} icon="calendar"/>
      </div>
      {stats.overdraft_warning && <div role="status" className={s.warning}><Icon name="clock" size={18}/>{t('overdraft_warning')} {date(stats.overdraft_warning.date)}</div>}
      <div className={s.midGrid}>
        <section className={`${s.panel} ${s.balancePanel}`}>
          <div className={s.panelHeading}><div><h2>{t('balance_evolution')}</h2><p>{t('balance_subtitle')}</p></div><div className={s.periods} role="group" aria-label={t('period')}>{[30, 90].map(period => <button key={period} onClick={() => setDays(period)} aria-pressed={days === period} className={days === period ? s.periodActive : ''}>{period} {t('days')}</button>)}</div></div>
          {data.accounts.length > 0 && <div className={s.chartHeading}><label className={s.accountSelect}><Icon name="wallet" size={15}/><span className={s.srOnly}>{t('select_account')}</span><select value={accountId} onChange={event => setAccountId(event.target.value)} aria-label={t('select_account')}>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><strong>{!trend.loading && !trend.error ? money(trend.balance, chartCurrency) : '—'}</strong></div>}
          {trend.loading ? <div className={s.chartPlaceholder} role="status">{t('loading')}</div> : trend.error ? <div className={s.chartPlaceholder} role="alert">{t('chart_error')}</div> : !history.length ? <div className={s.chartPlaceholder}>{t(data.accounts.length ? 'no_chart_data' : 'no_accounts')}<a href={legacyUrl('accounts')}>{t('manage_accounts')}<Icon name="arrow" size={14}/></a></div> : <Suspense fallback={<div className={s.chartPlaceholder} role="status">{t('loading')}</div>}><BalanceChart history={history} currency={chartCurrency}/></Suspense>}
          <div className={s.chartNote}><span><i/>{t('account_balance')}</span><span>{t('all_operations_note')}</span></div>
        </section>
        <BudgetList budgets={data.budgets} currency={currency}/>
      </div>
      <div className={s.bottomGrid}>
        <TransactionList transactions={transactions.items} accounts={data.accounts} loading={transactions.loading} error={transactions.error}/>
        <section className={`${s.panel} ${s.accountsPanel}`}>
          <div className={s.panelHeading}><div><h2>{t('my_accounts')}</h2><p>{t('reconciled_balances')}</p></div><a className={s.iconLink} href={legacyUrl('accounts')} aria-label={t('manage_accounts')}><Icon name="arrow" size={17}/></a></div>
          {data.accounts.length ? <div className={s.accountList}>{data.accounts.map(a => <button key={a.id} className={`${s.account} ${String(a.id) === accountId ? s.accountActive : ''}`} aria-pressed={String(a.id) === accountId} onClick={() => setAccountId(String(a.id))}><span className={s.accountIcon}><Icon name={a.is_loan ? 'bank' : 'wallet'} size={18}/></span><span><strong>{a.name}</strong><small>{a.type}</small></span><b>{money(a.balance, a.currency)}</b></button>)}</div> : <div className={s.empty}><Icon name="wallet" size={28}/><strong>{t('no_accounts')}</strong><a href={legacyUrl('accounts')}>{t('add_account')}<Icon name="plus" size={14}/></a></div>}
          <a href={legacyUrl('accounts')} className={s.panelFooter}>{t('manage_accounts')}<Icon name="arrow" size={15}/></a>
          <div className={s.savings}><span className={s.savingsIcon}><Icon name="target" size={23}/></span><div><strong>{t('savings')}</strong><p>{t('savings_subtitle')}</p></div><b>{money(stats.savings_summary.balance, currency)}</b></div>
        </section>
      </div>
      <div className={s.migrationNote}><Badge label={t('preview')} variant="neutral"/><span>{t('migration_note')}</span><a href={legacyUrl()}>{t('return_v1')}<Icon name="arrow" size={14}/></a></div>
    </>}
  </Shell>;
}
