import React from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from './Icon';
import { useLanguage } from '../lib/i18n';
import { legacyUrl } from '../lib/api';
import s from './Dashboard.module.css';

export function TransactionList({ transactions, accounts, loading, error }) {
  const { t, money, date } = useLanguage();
  return <section className={s.panel}>
    <div className={s.panelHeading}><div><h2>{t('recent_transactions')}</h2><p>{t('recent_subtitle')}</p></div><a href={legacyUrl('all_operations')} className={s.textLink}>{t('see_all')}<Icon name="arrow" size={15}/></a></div>
    {loading ? <p className={s.message} role="status">{t('loading')}</p> : error ? <p className={s.message} role="alert">{t('transactions_error')}</p> : !transactions.length ? <div className={s.empty}><Icon name="arrows" size={28}/><strong>{t('no_transactions')}</strong><p>{t('no_transactions_body')}</p><a href={legacyUrl('dashboard', 'new')}>{t('new_transaction')}<Icon name="plus" size={14}/></a></div> : <div className={s.tableScroll}>
      <table className={s.transactions}>
        <thead><tr><th>{t('transaction')}</th><th>{t('date')}</th><th>{t('status')}</th><th>{t('amount')}</th></tr></thead>
        <tbody>{transactions.map(tx => {
          const income = tx.type === 'income';
          const transfer = tx.type === 'transfer';
          const account = accounts.find(a => a.id === (income ? tx.to_account_id : tx.from_account_id));
          return <tr key={tx.id}>
            <td><div className={s.transactionCell}><span className={`${s.transactionIcon} ${income ? s.incomeIcon : transfer ? s.transferIcon : ''}`}><Icon name={transfer ? 'arrows' : income ? 'down' : 'up'} size={17}/></span><div><strong>{tx.description}</strong><small>{tx.category || t('uncategorised')}{account ? ` · ${account.name}` : ''}</small></div></div></td>
            <td>{date(tx.date_operation)}</td>
            <td><Badge label={t(tx.reconciliation_date ? 'reconciled' : 'pending')} variant={tx.reconciliation_date ? 'success' : 'neutral'}/></td>
            <td className={`${s.amount} ${income ? s.income : ''}`}>{transfer ? '' : income ? '+ ' : '− '}{money(Math.abs(tx.amount), account?.currency || 'EUR')}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </section>;
}
