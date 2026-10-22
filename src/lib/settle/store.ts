import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildWorkspace, BUSINESS } from "./dataset";
import { FLAG_LABEL, runMatch } from "./engine";
import { cleanGstin, formatDate, formatInr, taxOf } from "./format";
import type { Action, BankTxn, Flag, FlagStatus, FlagType, Invoice, Match, TwoBEntry, Vendor } from "./types";

export type Mode = "owner" | "ca";
export type Theme = "light" | "dark";

type Client = {
  id: string;
  name: string;
  city: string;
  gstin: string;
  period: string;
};

export const CLIENTS: Client[] = [
  { id: "sgt", name: BUSINESS.name, city: BUSINESS.city, gstin: BUSINESS.gstin, period: BUSINESS.period },
  { id: "patil", name: "Patil Hardware Mart", city: "Jalna", gstin: "27PTHXM4412H1ZQ", period: "2026-09" },
  { id: "deshmukh", name: "Deshmukh Kirana", city: "Beed", gstin: "27DSMKH2201P1ZA", period: "2026-09" },
];

type Snapshot = {
  invoices: Invoice[];
  twoB: TwoBEntry[];
  bank: BankTxn[];
  flags: Flag[];
  matches: Match[];
  vendors: Vendor[];
  status: "review" | "approved";
  approvedAt?: string;
};

function fresh(): Snapshot {
  const data = buildWorkspace();
  const result = runMatch({
    invoices: data.invoices,
    twoB: data.twoB,
    bank: data.bank,
    period: BUSINESS.period,
  });
  return {
    invoices: result.invoices,
    twoB: result.twoB,
    bank: result.bank,
    flags: result.flags,
    matches: result.matches,
    vendors: data.vendors,
    status: "review",
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

type PeriodSnap = Snapshot & {
  clientId: string;
  businessName: string;
  gstin: string;
  city: string;
  actions: Action[];
  matchedSeen: boolean;
};

function takeSnap(s: PeriodSnap): PeriodSnap {
  return {
    invoices: s.invoices,
    twoB: s.twoB,
    bank: s.bank,
    flags: s.flags,
    matches: s.matches,
    vendors: s.vendors,
    status: s.status,
    approvedAt: s.approvedAt,
    clientId: s.clientId,
    businessName: s.businessName,
    gstin: s.gstin,
    city: s.city,
    actions: s.actions,
    matchedSeen: s.matchedSeen,
  };
}

export type Toast = { id: string; text: string; undo?: boolean };

type State = Snapshot & {
  period: string;
  businessName: string;
  gstin: string;
  city: string;
  clientId: string;
  mode: Mode;
  theme: Theme;
  haptics: boolean;
  hydrated: boolean;
  toasts: Toast[];
  actions: Action[];
  matchedSeen: boolean;
  periodSnapshots: Record<string, PeriodSnap>;
  touched: boolean;
  pushToast: (text: string, undo?: boolean) => void;
  dismissToast: (id: string) => void;
  setMode: (m: Mode) => void;
  setTheme: (t: Theme) => void;
  setClient: (id: string) => void;
  setPeriod: (period: string) => void;
  setHaptics: (v: boolean) => void;
  markMatchedSeen: () => void;
  applyFlag: (flagId: string, patch: Partial<Flag>, label: string, kind: Action["kind"]) => void;
  fixGstin: (flagId: string, gstin: string) => void;
  addFrom2b: (flagId: string) => void;
  followUp: (flagIds: string[]) => string;
  ignore: (flagIds: string[], reason: string, note: string) => void;
  acceptDate: (flagId: string) => void;
  undo: () => void;
  approve: () => void;
  reopen: () => void;
  reset: () => void;
};

function withStatus(flags: Flag[], id: string, patch: Partial<Flag>): Flag[] {
  return flags.map((f) => (f.id === id ? { ...f, ...patch } : f));
}

export const useSettle = create<State>()(
  persist(
    (set, get) => ({
      ...fresh(),
      period: BUSINESS.period,
      businessName: BUSINESS.name,
      gstin: BUSINESS.gstin,
      city: BUSINESS.city,
      clientId: "sgt",
      mode: "owner",
      theme: "light",
      haptics: false,
      hydrated: false,
      toasts: [],
      actions: [],
      matchedSeen: false,
      periodSnapshots: {},
      touched: false,
      pushToast: (text, undo) => {
        const id = uid("t");
        set((s) => ({ toasts: [...s.toasts.slice(-1), { id, text, undo }], touched: true }));
        window.setTimeout(() => get().dismissToast(id), undo ? 10000 : 6000);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = theme;
        }
      },
      setClient: (id) => {
        const c = CLIENTS.find((x) => x.id === id) ?? CLIENTS[0];
        const cur = get();
        if (cur.clientId === id) return;
        let periodSnapshots = cur.periodSnapshots;
        if (cur.clientId === "sgt" && cur.period === BUSINESS.period && cur.invoices.length) {
          periodSnapshots = { ...periodSnapshots, [cur.period]: takeSnap(cur) };
        }
        const keep = { periodSnapshots, touched: true, period: cur.period, mode: cur.mode, theme: cur.theme, haptics: cur.haptics };
        if (id === "sgt" && cur.period === BUSINESS.period) {
          const saved = periodSnapshots[cur.period];
          if (saved?.clientId === "sgt" && saved.invoices.length) {
            set({ ...saved, ...keep, clientId: c.id, businessName: c.name, gstin: c.gstin, city: c.city });
            return;
          }
          set({ ...fresh(), ...keep, clientId: c.id, businessName: c.name, gstin: c.gstin, city: c.city, actions: [], matchedSeen: false });
          return;
        }
        set({
          invoices: [],
          twoB: [],
          bank: [],
          flags: [],
          matches: [],
          vendors: [],
          status: "review",
          approvedAt: undefined,
          actions: [],
          matchedSeen: true,
          clientId: id,
          businessName: c.name,
          gstin: c.gstin,
          city: c.city,
          ...keep,
        });
      },
      setPeriod: (period) => {
        if (!/^\d{4}-\d{2}$/.test(period)) return;
        const cur = get();
        if (period === cur.period) return;
        const periodSnapshots = { ...cur.periodSnapshots, [cur.period]: takeSnap(cur) };
        const saved = periodSnapshots[period];
        const keep = {
          mode: cur.mode,
          theme: cur.theme,
          haptics: cur.haptics,
          touched: true,
          toasts: cur.toasts,
          periodSnapshots,
          period,
        };
        if (saved) {
          set({ ...saved, ...keep });
          return;
        }
        if (period === BUSINESS.period && cur.clientId === "sgt") {
          set({
            ...fresh(),
            ...keep,
            clientId: "sgt",
            businessName: BUSINESS.name,
            gstin: BUSINESS.gstin,
            city: BUSINESS.city,
            actions: [],
            matchedSeen: false,
          });
          return;
        }
        set({
          invoices: [],
          twoB: [],
          bank: [],
          flags: [],
          matches: [],
          vendors: [],
          status: "review",
          approvedAt: undefined,
          actions: [],
          matchedSeen: true,
          clientId: cur.clientId,
          businessName: cur.businessName,
          gstin: cur.gstin,
          city: cur.city,
          ...keep,
        });
      },
      setHaptics: (haptics) => set({ haptics }),
      markMatchedSeen: () => set({ matchedSeen: true }),
      applyFlag: (flagId, patch, label, kind) => {
        const before = get().flags.find((f) => f.id === flagId);
        if (!before) return;
        const action: Action = {
          id: uid("a"),
          at: new Date().toISOString(),
          actor: get().mode === "ca" ? "ca" : "owner",
          kind,
          flagId,
          before: { status: before.status, ignoreReason: before.ignoreReason, note: before.note },
          after: patch,
          label,
        };
        set((s) => ({
          flags: withStatus(s.flags, flagId, patch),
          actions: [...s.actions, action],
        }));
        get().pushToast(label, true);
      },
      fixGstin: (flagId, gstin) => {
        const flag = get().flags.find((f) => f.id === flagId);
        if (!flag?.invoiceId) return;
        const next = cleanGstin(gstin);
        const two = get().twoB.find((t) => t.id === flag.twoBId);
        if (two && next !== two.vendorGstin) {
          get().pushToast("GSTIN still does not match the 2B row.");
          return;
        }
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === flag.invoiceId ? { ...i, vendorGstin: next } : i)),
        }));
        get().applyFlag(flagId, { status: "fixed" }, "GSTIN updated. Credit can be claimed.", "edit");
      },
      addFrom2b: (flagId) => {
        const flag = get().flags.find((f) => f.id === flagId);
        const row = get().twoB.find((t) => t.id === flag?.twoBId);
        if (!flag || !row) return;
        const inv: Invoice = {
          id: uid("inv"),
          vendorGstin: row.vendorGstin,
          vendorName: row.vendorName,
          invoiceNo: row.invoiceNo,
          invoiceNoNorm: row.invoiceNoNorm,
          date: row.date,
          docType: row.docType,
          taxable: row.taxable,
          cgst: row.cgst,
          sgst: row.sgst,
          igst: row.igst,
          total: row.taxable + taxOf(row),
          rate: row.igst ? 5 : row.taxable ? Math.round((taxOf(row) / Math.abs(row.taxable)) * 100) : 18,
          period: row.returnPeriod,
        };
        set((s) => ({ invoices: [...s.invoices, inv] }));
        get().applyFlag(flagId, { status: "fixed", invoiceId: inv.id }, "Added to your books from 2B.", "link");
      },
      followUp: (flagIds) => {
        const first = get().flags.find((f) => f.id === flagIds[0]);
        const inv = get().invoices.find((i) => i.id === first?.invoiceId);
        const two = get().twoB.find((t) => t.id === first?.twoBId);
        const vendor = inv?.vendorName ?? two?.vendorName ?? "vendor";
        const no = inv?.invoiceNo ?? two?.invoiceNo ?? "";
        const date = formatDate(inv?.date || two?.date);
        const total = formatInr(inv?.total ?? (two ? two.taxable + taxOf(two) : 0));
        const msg = `Hi ${vendor}, bill ${no} dated ${date} for ${total} is not in our GSTR-2B for 09-2026. Could you check your GSTR-1? Thanks, ${get().businessName}`;
        const label = flagIds.length > 1 ? `Follow-up marked on ${flagIds.length} bills.` : "Marked for vendor follow-up.";
        for (const id of flagIds) {
          const before = get().flags.find((f) => f.id === id);
          if (!before) continue;
          set((s) => ({
            flags: withStatus(s.flags, id, { status: "follow_up", note: msg }),
          }));
        }
        const action: Action = {
          id: uid("a"),
          at: new Date().toISOString(),
          actor: get().mode === "ca" ? "ca" : "owner",
          kind: flagIds.length > 1 ? "bulk" : "follow_up",
          before: flagIds,
          after: "follow_up",
          label,
        };
        set((s) => ({ actions: [...s.actions, action] }));
        get().pushToast(label, true);
        return msg;
      },
      ignore: (flagIds, reason, note) => {
        const why = reason.trim();
        if (!why || flagIds.length === 0) return;
        const label = flagIds.length > 1 ? `Ignored ${flagIds.length} flags.` : "Flag ignored.";
        for (const id of flagIds) {
          set((s) => ({ flags: withStatus(s.flags, id, { status: "ignored", ignoreReason: why, note }) }));
        }
        set((s) => ({
          actions: [
            ...s.actions,
            {
              id: uid("a"),
              at: new Date().toISOString(),
              actor: s.mode === "ca" ? "ca" : "owner",
              kind: flagIds.length > 1 ? "bulk" : "ignore",
              before: flagIds,
              after: { reason: why, note },
              label,
            },
          ],
        }));
        get().pushToast(label, true);
      },
      acceptDate: (flagId) => {
        get().applyFlag(flagId, { status: "fixed", note: "Date difference accepted." }, "Date difference accepted.", "edit");
      },
      undo: () => {
        const actions = [...get().actions];
        const last = [...actions].reverse().find((a) => !a.undoneAt);
        if (!last) return;
        last.undoneAt = new Date().toISOString();
        if (last.kind === "approve") {
          set({ status: "review", approvedAt: undefined, actions });
          get().pushToast("Approval undone.");
          return;
        }
        if (last.kind === "reset") {
          const snap = last.before as Snapshot;
          set({ ...snap, actions });
          get().pushToast("Workspace restored.");
          return;
        }
        if ((last.kind === "bulk" || last.kind === "ignore" || last.kind === "follow_up") && Array.isArray(last.before)) {
          const ids = last.before as string[];
          set((s) => ({
            flags: s.flags.map((f) => (ids.includes(f.id) ? { ...f, status: "open" as FlagStatus, ignoreReason: undefined } : f)),
            actions,
          }));
          get().pushToast("Undone.");
          return;
        }
        if (last.flagId && last.before && typeof last.before === "object") {
          const before = last.before as Partial<Flag>;
          set((s) => ({
            flags: s.flags.map((f) => (f.id === last.flagId ? { ...f, ...before, status: (before.status as FlagStatus) ?? "open" } : f)),
            actions,
          }));
        }
        get().pushToast("Undone.");
      },
      approve: () => {
        const action: Action = {
          id: uid("a"),
          at: new Date().toISOString(),
          actor: get().mode === "ca" ? "ca" : "owner",
          kind: "approve",
          before: "review",
          after: "approved",
          label: "Period approved",
        };
        set({ status: "approved", approvedAt: new Date().toISOString(), actions: [...get().actions, action] });
        get().pushToast("September approved.");
      },
      reopen: () => {
        set({ status: "review", approvedAt: undefined });
        get().pushToast("Period reopened. You can edit again.");
      },
      reset: () => {
        const snap: Snapshot = {
          invoices: get().invoices,
          twoB: get().twoB,
          bank: get().bank,
          flags: get().flags,
          matches: get().matches,
          vendors: get().vendors,
          status: get().status,
          approvedAt: get().approvedAt,
        };
        const next = fresh();
        const action: Action = {
          id: uid("a"),
          at: new Date().toISOString(),
          actor: "owner",
          kind: "reset",
          before: snap,
          after: "fresh",
          label: "Workspace reset",
        };
        set({ ...next, actions: [action], clientId: "sgt", businessName: BUSINESS.name, gstin: BUSINESS.gstin, city: BUSINESS.city, period: BUSINESS.period, periodSnapshots: {}, touched: true });
        get().pushToast("Workspace reset. Undo if this was a mistake.", true);
      },
    }),
    {
      name: "settle-shree-ganesh",
      version: 4,
      migrate: (persisted, version) => {
        const base = (persisted ?? {}) as Record<string, unknown>;
        if (version < 3) {
          const next = fresh();
          return { ...base, ...next, actions: [], status: "review", approvedAt: undefined, touched: true, periodSnapshots: {} };
        }
        if (version < 4) return { ...base, touched: true, periodSnapshots: base.periodSnapshots ?? {} };
        return base;
      },
      partialize: (s) => ({
        invoices: s.invoices,
        twoB: s.twoB,
        bank: s.bank,
        flags: s.flags,
        matches: s.matches,
        vendors: s.vendors,
        status: s.status,
        approvedAt: s.approvedAt,
        period: s.period,
        businessName: s.businessName,
        gstin: s.gstin,
        city: s.city,
        clientId: s.clientId,
        mode: s.mode,
        theme: s.theme,
        haptics: s.haptics,
        actions: s.actions,
        matchedSeen: s.matchedSeen,
        periodSnapshots: s.periodSnapshots,
        touched: s.touched,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setTheme(state.theme);
        useSettle.setState({ hydrated: true });
      },
    },
  ),
);

export function booksLoaded(invoices: readonly unknown[], twoB: readonly unknown[]) {
  return invoices.length > 0 || twoB.length > 0;
}

export function septemberSaved(s: {
  hydrated: boolean;
  touched: boolean;
  period: string;
  invoices: readonly unknown[];
  periodSnapshots: Record<string, { invoices: readonly unknown[] } | undefined>;
}) {
  if (!s.hydrated || !s.touched) return false;
  if (s.period === "2026-09" && s.invoices.length > 0) return true;
  return (s.periodSnapshots["2026-09"]?.invoices.length ?? 0) > 0;
}

export function openFlags(flags: Flag[]) {
  return flags.filter((f) => f.status === "open");
}

export function itcSplit(flags: Flag[], matches: Match[], invoices: Invoice[], twoB: TwoBEntry[]) {
  const invById = new Map(invoices.map((i) => [i.id, i]));
  const twoById = new Map(twoB.map((i) => [i.id, i]));
  let claimable = 0;
  for (const m of matches) {
    const inv = m.invoiceId ? invById.get(m.invoiceId) : undefined;
    if (inv) claimable += taxOf(inv);
  }
  let atRisk = 0;
  let follow = 0;
  const fixedIds = new Set<string>();
  for (const f of flags) {
    if (f.status === "fixed" && f.invoiceId) {
      const inv = invById.get(f.invoiceId);
      if (inv && !fixedIds.has(f.invoiceId) && f.type !== "DUPLICATE") {
        claimable += f.type === "MISSING_IN_BOOKS" ? f.itcImpact : taxOf(inv);
        fixedIds.add(f.invoiceId);
      } else if (f.type === "MISSING_IN_BOOKS") {
        claimable += f.itcImpact;
      }
    }
    if (f.status === "open") {
      if (f.type === "DATE_PERIOD" && f.level === "low") continue;
      if (f.type === "DUPLICATE" && f.itcImpact === 0) continue;
      atRisk += f.itcImpact;
    }
    if (f.status === "follow_up") follow += f.itcImpact;
  }
  void twoById;
  return { claimable, atRisk, follow };
}

export function followUpMessage(flag: Flag, invoices: Invoice[], twoB: TwoBEntry[], business: string) {
  const inv = invoices.find((i) => i.id === flag.invoiceId);
  const row = twoB.find((t) => t.id === flag.twoBId);
  const vendor = inv?.vendorName ?? row?.vendorName ?? "there";
  const no = inv?.invoiceNo ?? row?.invoiceNo ?? "the bill";
  const date = formatDate(inv?.date || row?.date);
  const total = formatInr(inv?.total ?? (row ? row.taxable + taxOf(row) : 0));
  return `Hi ${vendor}, bill ${no} dated ${date} for ${total} needs a look for GSTR-2B 09-2026. Could you check your GSTR-1? Thanks, ${business}`;
}

export function countsByType(flags: Flag[]): Record<FlagType, number> {
  const out = {} as Record<FlagType, number>;
  for (const k of Object.keys(FLAG_LABEL) as FlagType[]) out[k] = 0;
  for (const f of flags) if (f.status === "open") out[f.type]++;
  return out;
}
