import { Link } from '@tanstack/react-router';
import React from 'react';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Icon } from './Icon';
import { useLanguage } from '../lib/i18n';
import s from './Dashboard.module.css';

export function BudgetList({ budgets, currency }) {
  const { t, money } = useLanguage();
  const spending = budgets.filter(b => !b.is_closed && b.envelope_type !== 'savings').slice(0, 3);
  return <section className={s.panel}>
    <div className={s.panelHeading}><div><h2>{t('budgets')}</h2><p>{t('budget_subtitle')}</p></div><Link className={s.iconLink} to="/budgets" aria-label={t('manage_budgets')}><Icon name="arrow" size={17}/></Link></div>
    {spending.length ? <div className={s.budgetList}>{spending.map(b => {
      const total = b.budget_amount + (b.income || 0);
      const used = b.expenses || 0;
      const percent = total > 0 ? used / total * 100 : 0;
      return <div className={s.budget} key={b.id}>
        <div className={s.budgetTop}><strong>{b.name}</strong><span>{Math.round(percent)} %</span></div>
        <ProgressBar label={b.name} isLabelHidden value={Math.min(100, Math.max(0, percent))} variant={percent > 100 ? 'error' : percent > 80 ? 'warning' : 'accent'}/>
        <div className={s.budgetBottom}><span>{money(used, currency)} <span>/ {money(total, currency)}</span></span><span>{t(percent > 100 ? 'over_budget' : 'spent')}</span></div>
      </div>;
    })}</div> : <div className={s.empty}><Icon name="target" size={28}/><strong>{t('no_budgets')}</strong><p>{t('no_budgets_body')}</p><Link to="/budgets">{t('create_budget')} <Icon name="arrow" size={14}/></Link></div>}
    <Link to="/budgets" className={s.panelFooter}>{t('manage_budgets')}<Icon name="arrow" size={15}/></Link>
  </section>;
}
