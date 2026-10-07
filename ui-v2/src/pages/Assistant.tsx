import type { ChatSession, Conversation } from "../lib/server/workspaces";
import type { Proposal } from "../lib/server/workflow-models";
import React, { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Markdown } from "@astryxdesign/core/Markdown";
import {
  ChatLayout,
  ChatMessageList,
  ChatMessage,
  ChatMessageBubble,
} from "@astryxdesign/core/Chat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, Field } from "../components/Page";
import { Editor } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useWorkspace, resource } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { readEventStream } from "../lib/stream";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
import { Link } from "@tanstack/react-router";
import { AssistantTools } from "./AssistantTools";
export function Assistant() {
  const r = useWorkspace<ChatSession[]>("chat", "/api/chat/sessions");
  const a = useRecordActions("chat", r.profile?.id);
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [streamText, setStreamText] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<{
    id: number;
    session?: boolean;
    title?: string;
    content?: string;
  } | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const abort = useRef<AbortController | null>(null);
  const client = useQueryClient();
  const id = Number(
    r.data?.items.some((row) => String(row.id) === selected)
      ? selected
      : r.data?.items[0]?.id || 0,
  );
  const conversation = useQuery({
    ...resource<Conversation>(
      "chat",
      r.profile?.id || "",
      `messages-${id}`,
      `/api/chat/sessions/${id}/messages`,
    ),
    enabled: Boolean(r.data && id),
  });
  useEffect(() => () => abort.current?.abort(), []);
  const stream = useMutation({
    mutationKey: ["chat", r.profile?.id, id, "send"],
    mutationFn: async (content: string) => {
      if (!r.data || !id) throw new Error("Session indisponible");
      abort.current = new AbortController();
      setStreamText("");
      setStatus("");
      await readEventStream(
        `/api/chat/sessions/${id}/message`,
        {
          content,
          lang: language,
          user_name: sessionStorage.getItem("omni_current_user"),
        },
        abort.current.signal,
        (event) => {
          if (event.clear_text) setStreamText("");
          if (event.content) setStreamText((text) => text + event.content);
          if (event.status) setStatus(event.status);
        },
      );
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: ["chat", r.profile?.id] });
      setStatus("");
    },
    onSuccess: () => {
      setDraft("");
      setStreamText("");
    },
  });
  return (
    <Page
      title="assistant"
      subtitle="assistant_body"
      resource={r}
      actions={
        <Button
          label={t("new_conversation")}
          isDisabled={stream.isPending}
          onClick={async () => {
            const result = await a.save({
              path: "/api/chat/sessions",
              body: { role: "advisor" },
            });
            if (result) setSelected(String((result as ChatSession).id));
          }}
        />
      }
    >
      <VStack gap={4}>
        <Link to="/settings">{t("configure_ollama")}</Link>
        <Field label={t("conversation")}>
          <select
            value={id || ""}
            disabled={stream.isPending}
            onChange={(e) => {
              setSelected(e.target.value);
              setStreamText("");
              stream.reset();
            }}
            {...stylex.props(s.fieldSelect)}
          >
            {r.data?.items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title || t("conversation")}
              </option>
            ))}
          </select>
        </Field>
        {id > 0 && (
          <HStack gap={1}>
            <ActionButton
              label={t("edit")}
              icon="edit"
              isDisabled={stream.isPending}
              onClick={() =>
                setEdit({
                  session: true,
                  id,
                  title:
                    r.data?.items.find((row) => row.id === id)?.title || "",
                })
              }
            />
            <ActionButton
              label={t("delete")}
              icon="delete"
              isDisabled={stream.isPending}
              onClick={() =>
                a.confirm({
                  path: `/api/chat/sessions/${id}`,
                  method: "DELETE",
                })
              }
            />
          </HStack>
        )}
        {conversation.isError && (
          <p role="alert">
            {t(conversation.data ? "stale_data" : "connection_error")}
          </p>
        )}
        {id > 0 && (
          <AssistantTools
            id={id}
            profileId={r.profile?.id}
            role={r.data?.items.find((row) => row.id === id)?.role || "advisor"}
            busy={stream.isPending}
          />
        )}
        <ChatLayout composer={null}>
          <ChatMessageList>
            {(conversation.data?.messages || []).map((message) => (
              <ChatMessage
                key={message.id}
                sender={message.role === "user" ? "user" : "assistant"}
              >
                <ChatMessageBubble
                  name={message.role === "user" ? t("you") : t("assistant")}
                >
                  <MessageContent
                    content={message.content}
                    disabled={stream.isPending}
                    applied={applied}
                    onReview={(action) =>
                      setProposal({ ...action, messageId: message.id })
                    }
                  />
                  {message.entity_snapshots && (
                    <details>
                      <summary>{t("tool_result")}</summary>
                      <dl>
                        {Object.entries(message.entity_snapshots).map(
                          ([key, value]) => (
                            <React.Fragment key={key}>
                              <dt>{t(key)}</dt>
                              <dd>
                                {typeof value === "object" && value !== null
                                  ? Object.values(value)
                                      .filter(
                                        (v) =>
                                          typeof v === "string" ||
                                          typeof v === "number",
                                      )
                                      .join(" · ")
                                  : String(value ?? "")}
                              </dd>
                            </React.Fragment>
                          ),
                        )}
                      </dl>
                    </details>
                  )}
                  <ActionButton
                    label={t("edit")}
                    icon="edit"
                    isDisabled={stream.isPending}
                    onClick={() => setEdit(message)}
                  />
                  <ActionButton
                    label={t("delete")}
                    icon="delete"
                    isDisabled={stream.isPending}
                    onClick={() =>
                      a.confirm({
                        path: `/api/chat/messages/${message.id}`,
                        method: "DELETE",
                      })
                    }
                  />
                </ChatMessageBubble>
              </ChatMessage>
            ))}
            {streamText && (
              <ChatMessage sender="assistant">
                <ChatMessageBubble name={t("assistant")}>
                  <Markdown components={{ image: LocalImage }}>
                    {streamText}
                  </Markdown>
                </ChatMessageBubble>
              </ChatMessage>
            )}
            {!id && <p>{t("assistant_empty")}</p>}
          </ChatMessageList>
        </ChatLayout>
        {status && <p role="status">{status}</p>}
        {stream.isError && <p role="alert">{t("assistant_error")}</p>}
        {conversation.data?.token_usage && (
          <p>
            {t("context_usage")}: {conversation.data.token_usage.used} /{" "}
            {conversation.data.token_usage.limit}
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim() && !stream.isPending) stream.mutate(draft.trim());
          }}
        >
          <Field label={t("message")}>
            <textarea
              required
              rows={3}
              value={draft}
              disabled={stream.isPending || !id}
              onChange={(e) => setDraft(e.target.value)}
              {...stylex.props(s.fieldTextarea)}
            />
          </Field>
          <Button
            label={t("send")}
            type="submit"
            isDisabled={!id || !draft.trim()}
            isLoading={stream.isPending}
          />
          {stream.isPending && (
            <Button
              label={t("stop")}
              variant="secondary"
              onClick={() => abort.current?.abort()}
            />
          )}
        </form>
      </VStack>
      {edit && (
        <RecordEditor
          title={t("edit")}
          fields={[
            {
              name: edit.session ? "title" : "content",
              type: edit.session ? "text" : "textarea",
              required: true,
            },
          ]}
          initial={edit}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setEdit(null)}
          onSave={async (body) => {
            const result = await a.save({
              path: edit.session
                ? `/api/chat/sessions/${edit.id}`
                : `/api/chat/messages/${edit.id}`,
              method: "PUT",
              body,
            });
            if (result) setEdit(null);
          }}
        />
      )}
      <Confirmation
        {...a.confirmation}
        onConfirm={async () => {
          if (!a.pending) return;
          const write = a.pending.write;
          const result = await a.save(write);
          if (result && write.path === "/api/chat/apply-action") {
            setApplied((values) => [...values, JSON.stringify(write.body)]);
            setProposal(null);
            await Promise.all(
              [
                "accounts",
                "transactions",
                "categories",
                "recurrences",
                "budgets",
                "statistics",
                "journal",
              ].map((domain) =>
                client.invalidateQueries({ queryKey: [domain, r.profile?.id] }),
              ),
            );
          }
        }}
      />
      {proposal && (
        <Editor
          title={t("review_ai_action")}
          onClose={() => setProposal(null)}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
        >
          <VStack gap={4}>
            <p>{t("ai_action_warning")}</p>
            <h3>{proposal.action}</h3>
            <Records
              title="proposed_changes"
              rows={Object.entries(proposal.params || {}).map(
                ([key, value]) => ({
                  id: key,
                  name: t(key),
                  value:
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value),
                }),
              )}
              columns={[{ key: "name" }, { key: "value" }]}
            />
            <Button
              label={t("confirm")}
              isLoading={a.mutation.isPending}
              onClick={() =>
                a.confirm(
                  {
                    path: "/api/chat/apply-action",
                    body: { action: proposal.action, params: proposal.params },
                  },
                  t("confirm"),
                  t("financial_write_warning"),
                )
              }
            />
          </VStack>
        </Editor>
      )}
    </Page>
  );
}
function MessageContent({
  content,
  onReview,
  disabled,
  applied,
}: {
  content: string;
  onReview: (action: Proposal) => void;
  disabled: boolean;
  applied: string[];
}) {
  const { t } = useLanguage();
  const actions: Proposal[] = [];
  const text = content.replace(
    /```action\s*\n([\s\S]*?)```/g,
    (block: string, json: string) => {
      try {
        const action = JSON.parse(json);
        if (
          typeof action.action === "string" &&
          action.params &&
          typeof action.params === "object"
        ) {
          actions.push(action);
          return "";
        }
      } catch {}
      return block;
    },
  );
  return (
    <>
      <Markdown components={{ image: LocalImage }}>{text}</Markdown>
      {actions.map((action, index) => {
        const done = applied.includes(
          JSON.stringify({ action: action.action, params: action.params }),
        );
        return (
          <Button
            key={index}
            label={t(done ? "applied" : "review_ai_action")}
            variant="secondary"
            isDisabled={disabled || done}
            onClick={() => onReview(action)}
          />
        );
      })}
    </>
  );
}
function LocalImage({ alt }: { alt?: string }) {
  return <span>{alt || ""}</span>;
}
