export type Money = number;
export type ISODate = string;
export type Period = string;

export type FlagType =
  | "MISSING_IN_2B"
  | "MISSING_IN_BOOKS"
  | "GSTIN_MISMATCH"
  | "AMOUNT_MISMATCH"
  | "DATE_PERIOD"
  | "DUPLICATE"
  | "SUPPLIER_NOT_FILED";

export type BankInfoKind =
  | "supplier_payment"
  | "receipt"
  | "charge"
  | "gst_payment"
  | "reversal"
  | "advance"
  | "interest"
  | "unknown";

export type FlagStatus = "open" | "fixed" | "follow_up" | "ignored";
export type Confidence = "high" | "medium" | "low";

export type ReasonCode =
  | "GSTIN_EQ"
  | "INVNO_EQ"
  | "INVNO_FUZZY"
  | "AMOUNT_EQ"
  | "AMOUNT_NEAR"
  | "DATE_NEAR"
  | "REF_HAS_INVNO"
  | "PAYEE_FUZZY";

export type DocType = "invoice" | "credit_note" | "debit_note";

export type Invoice = {
  id: string;
  vendorGstin: string;
  vendorName: string;
  invoiceNo: string;
  invoiceNoNorm: string;
  date: ISODate;
  docType: DocType;
  taxable: Money;
  cgst: Money;
  sgst: Money;
  igst: Money;
  total: Money;
  rate: number;
  period: Period;
};

export type TwoBEntry = {
  id: string;
  vendorGstin: string;
  vendorName: string;
  invoiceNo: string;
  invoiceNoNorm: string;
  date: ISODate;
  docType: DocType;
  returnPeriod: Period;
  taxable: Money;
  cgst: Money;
  sgst: Money;
  igst: Money;
  itcAvailable: boolean;
  filingStatus: "filed" | "not_filed" | "unknown";
};

export type BankTxn = {
  id: string;
  date: ISODate;
  narration: string;
  ref: string;
  debit: Money;
  credit: Money;
  balance: Money;
  channel: "NEFT" | "RTGS" | "UPI" | "IMPS" | "CHQ" | "CASH" | "CHARGE" | "GST" | "INT" | "OTHER";
  kind: BankInfoKind;
};

export type Diff = { field: string; books?: string; twoB?: string; bank?: string };

export type ActionKind =
  | "edit"
  | "link"
  | "unlink"
  | "follow_up"
  | "ignore"
  | "reopen"
  | "approve"
  | "bulk"
  | "reset";

export type Action = {
  id: string;
  at: string;
  actor: "owner" | "ca" | "system";
  kind: ActionKind;
  flagId?: string;
  before: unknown;
  after: unknown;
  undoneAt?: string;
  label: string;
};

export type Flag = {
  id: string;
  periodId: Period;
  type: FlagType;
  level: Confidence;
  invoiceId?: string;
  twoBId?: string;
  bankTxnIds: string[];
  duplicateOf?: string;
  diffs: Diff[];
  itcImpact: Money;
  reason: string;
  status: FlagStatus;
  ignoreReason?: string;
  note?: string;
  history: Action[];
};

export type Match = {
  id: string;
  invoiceId?: string;
  twoBId?: string;
  bankTxnIds: string[];
  confidence: number;
  level: Confidence;
  reasons: ReasonCode[];
  status: "auto" | "confirmed" | "rejected";
};

export type Vendor = {
  gstin: string;
  name: string;
  stateCode: string;
  filingStatus?: "filed" | "not_filed" | "unknown";
};

export type EngineResult = {
  matches: Match[];
  flags: Flag[];
  invoices: Invoice[];
  twoB: TwoBEntry[];
  bank: BankTxn[];
};
