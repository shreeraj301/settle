# Settle

A client-only prototype. Nothing is uploaded to a server, and there is no account, database, or API.

Settle matches purchase bills, GSTR-2B, and a bank statement for one fictional business, Shree Ganesh Traders of Aurangabad, closing September 2026. The GSTINs, invoice numbers, and amounts are made up. Every mismatch explains itself, with the rows side by side.

## Run

```bash
npm install
npm run dev
```

Open the app and choose **Check September bills**, or **Open Shree Ganesh Traders** to skip straight to the matched month. Review a flag, correct a GSTIN, mark a vendor follow-up, approve the period, and export.
