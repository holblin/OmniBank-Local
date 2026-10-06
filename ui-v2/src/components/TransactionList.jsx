import { TableRow, TableCell, TableHeaderCell } from "@astryxdesign/core/Table";
import { VirtualTable } from "./VirtualTable";
import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import React from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "./Icon";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "./Dashboard.stylex.js";
export function TransactionList({ transactions, accounts, loading, error }) {
  const { compact } = useAppTheme();
  const { t, money, date } = useLanguage();
  return (
    <section {...stylex.props(s.panel)}>
      <div {...stylex.props(s.panelHeading, compact && s.compactPanelHeading)}>
        <div>
          <h2 {...stylex.props(s.panelHeadingH2)}>
            {t("recent_transactions")}
          </h2>
          <p {...stylex.props(s.panelHeadingP)}>{t("recent_subtitle")}</p>
        </div>
        <Link to="/history" {...stylex.props(s.textLink)}>
          {t("see_all")}
          <Icon name="arrow" size={15} />
        </Link>
      </div>
      {loading ? (
        <p role="status" {...stylex.props(s.message)}>
          {t("loading")}
        </p>
      ) : error ? (
        <p role="alert" {...stylex.props(s.message)}>
          {t("transactions_error")}
        </p>
      ) : !transactions.length ? (
        <div {...stylex.props(s.empty)}>
          <Icon name="arrows" size={28} />
          <strong {...stylex.props(s.emptyStrong)}>
            {t("no_transactions")}
          </strong>
          <p {...stylex.props(s.emptyP)}>{t("no_transactions_body")}</p>
          <Link
            to="/history"
            search={{
              new: 1,
            }}
            {...stylex.props(s.emptyA)}
          >
            {t("new_transaction")}
            <Icon name="plus" size={14} />
          </Link>
        </div>
      ) : (
        <div {...stylex.props(s.tableScroll)}>
          <VirtualTable
            rows={transactions}
            renderRow={(tx) => {
              const income = tx.type === "income";
              const transfer = tx.type === "transfer";
              const account = accounts.find(
                (a) =>
                  a.id === (income ? tx.to_account_id : tx.from_account_id),
              );
              return (
                <TableRow key={tx.id}>
                  <TableCell
                    xstyle={[
                      s.transactionsTd,
                      compact && s.compactTransactionsTd,
                    ]}
                  >
                    <div {...stylex.props(s.transactionCell)}>
                      <span
                        {...stylex.props(
                          s.transactionIcon,
                          income && s.incomeIcon,
                          !income && transfer && s.transferIcon,
                        )}
                      >
                        <Icon
                          name={transfer ? "arrows" : income ? "down" : "up"}
                          size={17}
                        />
                      </span>
                      <div>
                        <strong {...stylex.props(s.transactionCellStrong)}>
                          {tx.description}
                        </strong>
                        <small {...stylex.props(s.transactionCellSmall)}>
                          {tx.category || t("uncategorised")}
                          {account ? ` · ${account.name}` : ""}
                        </small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    xstyle={[
                      s.transactionsTd,
                      compact && s.compactTransactionsTd,
                    ]}
                  >
                    {date(tx.date_operation)}
                  </TableCell>
                  <TableCell
                    xstyle={[
                      s.transactionsTd,
                      compact && s.compactTransactionsTd,
                    ]}
                  >
                    <Badge
                      label={t(
                        tx.reconciliation_date ? "reconciled" : "pending",
                      )}
                      variant={tx.reconciliation_date ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell
                    xstyle={[
                      s.transactionsTd,
                      s.amount,
                      income && s.income,
                      compact && s.compactTransactionsTd,
                    ]}
                  >
                    {transfer ? "" : income ? "+ " : "− "}
                    {money(Math.abs(tx.amount), account?.currency || "EUR")}
                  </TableCell>
                </TableRow>
              );
            }}
            header={
              <>
                <TableRow isHeaderRow>
                  <TableHeaderCell xstyle={[s.transactionsTh]} scope="col">
                    {t("transaction")}
                  </TableHeaderCell>
                  <TableHeaderCell xstyle={[s.transactionsTh]} scope="col">
                    {t("date")}
                  </TableHeaderCell>
                  <TableHeaderCell xstyle={[s.transactionsTh]} scope="col">
                    {t("status")}
                  </TableHeaderCell>
                  <TableHeaderCell xstyle={[s.transactionsTh]} scope="col">
                    {t("amount")}
                  </TableHeaderCell>
                </TableRow>
              </>
            }
            columnCount={4}
            xstyle={[s.transactions]}
            label={t("recent_transactions")}
          />
        </div>
      )}
    </section>
  );
}
