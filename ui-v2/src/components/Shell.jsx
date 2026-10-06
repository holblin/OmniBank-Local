import React, { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Link, useLocation } from '@tanstack/react-router';
import { Icon } from './Icon';
import { useLanguage } from '../lib/i18n';
import { useAppTheme, themeNames } from '../lib/theme';
import { legacyUrl } from '../lib/api';
import s from './Shell.module.css';

export function Shell({ children, profile }) {
  const { t, language, setLanguage } = useLanguage();
  const { name, setTheme, compact, toggleCompact } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation({ select: location => location.pathname });
  const page = pathname.replace(/^\/v2(?=\/|$)/, '').split('/').filter(Boolean)[0] || 'dashboard';
  const pageKey = { budgets: 'budgets', summary: 'summary', history: 'history' }[page] || 'dashboard';
  const links = [['/history', 'arrows', 'history'], ['accounts', 'wallet', 'accounts'], ['/budgets', 'target', 'budgets'], ['/summary', 'chart', 'summary'], ['recurrences', 'calendar', 'recurrences']];
  return <div className={s.shell} data-ui-density={compact ? 'compact' : 'comfortable'}>
    <a className={s.skip} href="#main">{t('skip')}</a>
    {menuOpen && <button className={s.backdrop} aria-label={t('close_menu')} onClick={() => setMenuOpen(false)} />}
    <aside className={`${s.sidebar} ${menuOpen ? s.open : ''}`} aria-label={t('navigation')}>
      <Link className={s.brand} to="/"><span className={s.mark}><Icon name="bank" size={24}/></span><span>OmniBank<small>LOCAL</small></span></Link>
      <div className={s.workspace}><span className={s.avatar}>{(profile?.name || 'O').slice(0, 1).toUpperCase()}</span><div><strong>{profile?.name || t('workspace')}</strong><small>{t('personal_space')}</small></div><Icon name="chevron" size={15}/></div>
      <p className={s.navLabel}>{t('finance')}</p>
      <nav className={s.nav}>
        <Link to="/" className={pageKey === 'dashboard' ? s.active : undefined} aria-current={pageKey === 'dashboard' ? 'page' : undefined}><Icon name="grid"/><span>{t('dashboard')}</span>{pageKey === 'dashboard' && <span className={s.activeDot}/>}</Link>
        {links.map(([view, icon, key]) => view.startsWith('/') ? <Link key={view} to={view} className={pageKey === key ? s.active : undefined} aria-current={pageKey === key ? 'page' : undefined} onClick={() => setMenuOpen(false)}><Icon name={icon}/><span>{t(key)}</span>{pageKey === key && <span className={s.activeDot}/>}</Link> : <a key={view} href={legacyUrl(view)}><Icon name={icon}/><span>{t(key)}</span></a>)}
      </nav>
      <p className={s.navLabel}>{t('tools')}</p>
      <nav className={s.nav}>
        <a href={legacyUrl('chat')}><Icon name="spark"/><span>{t('assistant')}</span><Badge label={t('local')} variant="neutral"/></a>
        <a href={legacyUrl('config')}><Icon name="settings"/><span>{t('settings')}</span></a>
      </nav>
      <div className={s.sidebarBottom}>
        <div className={s.privacy}><Icon name="shield" size={24}/><strong>{t('privacy_title')}</strong><p>{t('privacy_body')}</p><span><i/>{t('on_device')}</span></div>
        <a className={s.return} href={legacyUrl({ history: 'all_operations', summary: 'analytics', budgets: 'budgets' }[page] || 'dashboard')}><Icon name="arrows" size={16}/>{t('return_v1')}</a>
      </div>
    </aside>
    <div className={s.main}>
      <header className={s.topbar}>
        <div className={s.breadcrumb}><Button className={s.menu} label={menuOpen ? t('close_menu') : t('open_menu')} isIconOnly icon={<Icon name={menuOpen ? 'close' : 'menu'}/>} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}/><span>{t('workspace')}</span><Icon name="chevron" size={13}/><strong>{t(pageKey)}</strong></div>
        <div className={s.topActions}><select className={s.theme} aria-label={t('theme')} value={name} onChange={event => setTheme(event.target.value)}>{themeNames.map(theme => <option key={theme} value={theme}>{theme === 'neutral' ? t('theme_neutral') : theme === 'y2k' ? 'Y2K' : theme[0].toUpperCase() + theme.slice(1)}</option>)}</select><button className={s.density} aria-pressed={compact} onClick={toggleCompact}>{t('compact')}</button><Badge label={t('beta')} variant="neutral"/><span className={s.local}><i/>{t('local_storage')}</span><button className={s.lang} onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} aria-label={t('change_language')}>{language.toUpperCase()} <span>⌄</span></button></div>
      </header>
      <main id="main" className={s.content}>{children}</main>
      <footer className={s.footer}><span>OmniBank Local <span>·</span> {t('footer')}</span><span><Icon name="shield" size={13}/>{t('private')}</span></footer>
    </div>
  </div>;
}
