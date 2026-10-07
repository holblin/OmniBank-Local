import React, { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { TextInput } from "@astryxdesign/core/TextInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { useNavigate } from "@tanstack/react-router";
import { Dashboard } from "./Dashboard";
import { Icon } from "../components/Icon";
import { Confirmation } from "../components/Confirmation";
import { useServerQueries, accounts } from "../lib/server/queries";
import { resource, useWorkspaceWrite } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { useAppTheme, themeNames } from "../lib/theme";
import type { Account } from "../lib/server/models";
import { styles as s } from "./Setup.stylex";

const steps = ["welcome", "space", "account", "start", "ready"] as const;
const icons = ["shield", "settings", "wallet", "arrows", "check"] as const;
const themeColors: Record<string, string> = {
  neutral: "#506a91", stone: "#927159", gothic: "#9d87ca",
  matcha: "#728d56", y2k: "#ce8da9", butter: "#d6b655",
};
type EntryMode = "manual" | "import" | "sync";

export function Setup() {
  const r = useServerQueries((id) => ({
    status: resource<{ needs_setup: boolean }>("setup", id, "status", "/api/setup/status"),
    accounts: accounts.list(id),
  }));
  const { t, language, setLanguage, money } = useLanguage();
  const theme = useAppTheme();
  const navigate = useNavigate();
  const demo = useRecordActions("journal", r.profile?.id);
  const accountWrite = useWorkspaceWrite("accounts", r.profile?.id);
  const preferences = useWorkspaceWrite("configuration", r.profile?.id);
  const [step, setStep] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("Compte courant");
  const [balance, setBalance] = useState<number | null>(0);
  const [mode, setMode] = useState<EntryMode>("manual");
  const [created, setCreated] = useState<Account | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!r.profile || initialized.current) return;
    initialized.current = true;
    setProfileName(r.profile.name);
    setCurrency(r.profile.currency || "EUR");
  }, [r.profile]);
  useEffect(() => {
    heading.current?.focus();
    body.current?.scrollTo({ top: 0 });
  }, [step]);
  useEffect(() => {
    if (demo.mutation.isSuccess) setStep(4);
  }, [demo.mutation.isSuccess]);
  const busy = accountWrite.isPending || preferences.isPending || demo.mutation.isPending;
  const savedAccount = created || r.data?.accounts[0];
  const error = accountWrite.isError || preferences.isError;
  const close = () => { if (!busy) void navigate({ to: "/" }); };
  async function next() {
    if (busy || !r.profile || !r.data) return;
    try {
      if (step === 1) {
        if (!profileName.trim()) return;
        await preferences.mutateAsync({
          path: `/api/profiles/${r.profile.id}`, method: "PUT",
          body: { name: profileName.trim(), currency },
        });
      }
      if (step === 2) {
        let account = savedAccount;
        if (!account) {
          if (!accountName.trim() || balance === null || !Number.isFinite(balance)) return;
          account = await accountWrite.mutateAsync({
            path: "/api/accounts/", body: {
              name: accountName.trim(), type: accountType, currency,
              initial_balance: balance, color: themeColors[theme.name],
            },
          }) as Account;
          setCreated(account);
        }
        // Keep the saved account for retries if selecting it as main fails.
        if (created || !savedAccount) {
          await accountWrite.mutateAsync({ path: `/api/stats/main_account/${account.id}`, body: {} });
        }
      }
      if (step === 4) {
        void navigate({ to: mode === "import" ? "/imports" : mode === "sync" ? "/bank-sync" : "/" });
      } else setStep(step + 1);
    } catch { /* Mutations retain the fields and expose a retryable error. */ }
  }
  const canContinue = Boolean(r.data) && !busy &&
    (step !== 1 || Boolean(profileName.trim())) &&
    (step !== 2 || Boolean(savedAccount) || Boolean(accountName.trim() && balance !== null && Number.isFinite(balance)));
  return <>
    <Dashboard />
    <Dialog isOpen width={960} maxHeight="calc(100dvh - 32px)" padding={0}
      purpose={busy ? "required" : "form"} aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description" onOpenChange={(open) => { if (!open) close(); }}>
      <form {...stylex.props(s.layout)} onSubmit={(event) => { event.preventDefault(); void next(); }}>
        <aside {...stylex.props(s.story)}>
          <div {...stylex.props(s.brand)}><Icon name="bank" size={25} /><strong>OmniBank <span {...stylex.props(s.local)}>LOCAL</span></strong></div>
          <div {...stylex.props(s.storyContent)}>
            <span {...stylex.props(s.eyebrow)}>{t("onboard_private")}</span>
            <h2 {...stylex.props(s.storyTitle)}>{t("onboard_story")}</h2>
            <p {...stylex.props(s.storyText)}>{t("onboard_story_body")}</p>
            <div aria-hidden="true" {...stylex.props(s.illustration)}>
              <div {...stylex.props(s.orbit)} />
              <div {...stylex.props(s.paper, s.paperBack)} />
              <div {...stylex.props(s.paper)}><Icon name="wallet" size={26} /><div {...stylex.props(s.artLine)} /><div {...stylex.props(s.artBars)}>{[15,22,18,30,38].map((height, index) => <i key={index} {...stylex.props(s.bar(height))} />)}</div></div>
              <div {...stylex.props(s.seal)}><Icon name="shield" size={23} /></div>
            </div>
          </div>
          <div {...stylex.props(s.trust)}><Icon name="shield" size={18} /><span>{t("onboard_trust")}</span></div>
        </aside>
        <div {...stylex.props(s.main)}>
          <header {...stylex.props(s.top)}>
            <span {...stylex.props(s.counter)}>{t("onboard_step")} {step + 1} / {steps.length}</span>
            <Button label={t("onboard_later")} variant="ghost" onClick={close} isDisabled={busy} />
          </header>
          <ol aria-label={t("onboard_progress")} {...stylex.props(s.progress)}>
            {steps.map((key, index) => <li key={key} aria-current={index === step ? "step" : undefined}
              {...stylex.props(s.progressItem, index <= step && s.progressActive)}>
              <span {...stylex.props(s.dot, index === step && s.dotActive, index < step && s.dotDone)}>{index < step ? <Icon name="check" size={12} /> : index + 1}</span>
              <span {...stylex.props(s.stepLabel)}>{t(`onboard_${key}_label`)}</span>
            </li>)}
          </ol>
          <div ref={body} {...stylex.props(s.body)}>
            <div {...stylex.props(s.stepIcon)}><Icon name={icons[step]!} size={25} /></div>
            <h1 id="onboarding-title" ref={heading} tabIndex={-1} {...stylex.props(s.title)}>{t(`onboard_${steps[step]}_title`)}</h1>
            <p id="onboarding-description" {...stylex.props(s.description)}>{t(`onboard_${steps[step]}_body`)}</p>
            {r.loading ? <p role="status">{t("loading")}</p> : r.error && !r.data ? <div role="alert"><p>{t("connection_error_body")}</p><Button label={t("retry")} onClick={r.refresh} /></div> : <>
              {step === 0 && <>
                <div {...stylex.props(s.benefits)}>{(["wallet", "chart", "shield"] as const).map((icon, i) => <div key={icon} {...stylex.props(s.benefit)}><span {...stylex.props(s.benefitIcon)}><Icon name={icon} size={19} /></span><div><strong>{t(`onboard_benefit_${i}`)}</strong><p {...stylex.props(s.small)}>{t(`onboard_benefit_${i}_body`)}</p></div></div>)}</div>
                <div {...stylex.props(s.demo)}><div><strong>{t("onboard_demo")}</strong><p {...stylex.props(s.small)}>{t("onboard_demo_body")}</p></div><Button label={t("load_demo")} variant="secondary" isDisabled={!r.data?.status.needs_setup || busy} onClick={() => demo.confirm({ path: "/api/setup/seed-demo", body: {} }, t("load_demo"), t("load_demo_warning"))} /></div>
              </>}
              {step === 1 && <div {...stylex.props(s.fields)}>
                <TextInput label={t("onboard_profile_name")} value={profileName} onChange={setProfileName} isRequired size="lg" />
                <div {...stylex.props(s.fieldPair)}>
                  <Selector label={t("currency")} value={currency} onChange={setCurrency} options={["EUR", "USD", "GBP", "CHF", "CAD", "JPY"]} size="lg" />
                  <Selector label={t("onboard_language")} value={language} onChange={(value) => setLanguage(value === "en" ? "en" : "fr")} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }]} size="lg" />
                </div>
                <fieldset {...stylex.props(s.fieldset)}><legend {...stylex.props(s.legend)}>{t("theme")}</legend><div {...stylex.props(s.themes)}>{themeNames.map((name) => <button key={name} type="button" aria-pressed={name === theme.name} onClick={() => theme.setTheme(name)} {...stylex.props(s.theme, name === theme.name && s.selected)}><span {...stylex.props(s.swatch(themeColors[name]!))} /><span>{name === "neutral" ? t("theme_neutral") : name[0]!.toUpperCase() + name.slice(1)}</span>{name === theme.name && <Icon name="check" size={14} />}</button>)}</div></fieldset>
                <p {...stylex.props(s.note)}><Icon name="shield" size={16} />{t("onboard_security_hint")}</p>
              </div>}
              {step === 2 && <div {...stylex.props(s.fields)}>{savedAccount ? <div {...stylex.props(s.summary)}><Icon name="check" size={23} /><div><strong>{savedAccount.name}</strong><p {...stylex.props(s.small)}>{t("onboard_account_saved")} · {money(savedAccount.initial_balance, savedAccount.currency)}</p></div></div> : <>
                <TextInput label={t("onboard_account_name")} value={accountName} onChange={setAccountName} placeholder={t("onboard_account_placeholder")} size="lg" isRequired />
                <Selector label={t("type")} value={accountType} onChange={setAccountType} options={[{ value: "Compte courant", label: t("onboard_current") }, { value: "Livret", label: t("onboard_savings") }]} size="lg" />
                <NumberInput label={`${t("initial_balance")} (${currency})`} value={balance} onChange={setBalance} step={0.01} size="lg" isRequired description={t("onboard_balance_hint")} />
                <p {...stylex.props(s.note)}><Icon name="shield" size={16} />{t("onboard_account_local")}</p>
              </>}</div>}
              {step === 3 && <div role="group" aria-label={t("onboard_start_label")} {...stylex.props(s.choices)}>{(["manual", "import", "sync"] as const).map((value, index) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} {...stylex.props(s.choice, mode === value && s.selected)}><span {...stylex.props(s.benefitIcon)}><Icon name={(["edit", "arrows", "bank"] as const)[index]!} size={21} /></span><span {...stylex.props(s.choiceText)}><strong>{t(`onboard_mode_${value}`)}</strong><span {...stylex.props(s.small)}>{t(`onboard_mode_${value}_body`)}</span></span><span {...stylex.props(s.radio, mode === value && s.radioSelected)}>{mode === value && <Icon name="check" size={12} />}</span></button>)}</div>}
              {step === 4 && <>
                <div {...stylex.props(s.summary)}><span {...stylex.props(s.benefitIcon)}><Icon name="wallet" size={24} /></span><div><strong>{savedAccount?.name || t("onboard_demo")}</strong><p {...stylex.props(s.small)}>{profileName} · {currency} · {t(`onboard_mode_${mode}`)}</p></div><Icon name="check" size={20} /></div>
                <div {...stylex.props(s.nextSteps)}><strong>{t("onboard_next")}</strong><p {...stylex.props(s.small)}>{t("onboard_next_body")}</p></div>
                <p {...stylex.props(s.note)}><Icon name="shield" size={16} />{t("onboard_ready_privacy")}</p>
              </>}
            </>}
            {error && <p role="alert" {...stylex.props(s.error)}>{t("save_error")}</p>}
          </div>
          <footer {...stylex.props(s.footer)}>
            {step > 0 ? <Button label={t("onboard_back")} variant="secondary" isDisabled={busy} onClick={() => { accountWrite.reset(); preferences.reset(); setStep(step - 1); }} /> : <span {...stylex.props(s.footerHint)}>{t("onboard_duration")}</span>}
            <Button label={t(step === 0 ? "onboard_begin" : step === 2 && !savedAccount ? "onboard_create_continue" : step === 4 ? mode === "import" ? "onboard_open_import" : mode === "sync" ? "onboard_open_sync" : "onboard_open_dashboard" : "onboard_continue")}
              type="submit" variant="primary" isLoading={busy} isDisabled={!canContinue} />
          </footer>
        </div>
      </form>
    </Dialog>
    <Confirmation {...demo.confirmation} />
  </>;
}
