# DOCX + XLSX Generation on Cloudflare Workers

Source: anthropics/skills docx/xlsx patterns

Both `docx` and `exceljs` are pure-JS, Worker-compatible. No native dependencies.

---

## DOCX Generation (docx library)

Best for: grant applications, donor letters, mail merge, contracts, proposals.

### Install

```bash
npm install docx
```

### Worker-compatible check

`docx` uses no Node built-ins — pure JS, zero native deps, Worker-compatible out of the box.

### Basic DOCX generation

```typescript
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  Packer,
} from "docx";

export interface GrantApplicationData {
  orgName: string;
  programName: string;
  requestAmount: number;
  narrative: string;
  budget: Array<{ category: string; amount: number; description: string }>;
  contactName: string;
  contactEmail: string;
}

export async function generateGrantApplication(
  env: Env,
  data: GrantApplicationData,
): Promise<string> {
  const doc = new Document({
    styles: {
      default: {
        heading1: {
          run: { font: "Calibri", size: 32, bold: true, color: "060610" },
        },
      },
    },
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            text: data.orgName,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `Grant Application — ${data.programName}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "" }),

          // Request amount
          new Paragraph({
            children: [
              new TextRun({ text: "Requested Amount: ", bold: true }),
              new TextRun({ text: `$${data.requestAmount.toLocaleString()}` }),
            ],
          }),
          new Paragraph({ text: "" }),

          // Narrative
          new Paragraph({ text: "Program Narrative", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: data.narrative }),
          new Paragraph({ text: "" }),

          // Budget table
          new Paragraph({ text: "Budget Summary", heading: HeadingLevel.HEADING_2 }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Category", run: { bold: true } } as any)] }),
                  new TableCell({ children: [new Paragraph({ text: "Amount", run: { bold: true } } as any)] }),
                  new TableCell({ children: [new Paragraph({ text: "Description", run: { bold: true } } as any)] }),
                ],
              }),
              ...data.budget.map(
                (line) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(line.category)] }),
                      new TableCell({ children: [new Paragraph(`$${line.amount.toLocaleString()}`)] }),
                      new TableCell({ children: [new Paragraph(line.description)] }),
                    ],
                  }),
              ),
            ],
          }),
          new Paragraph({ text: "" }),

          // Contact
          new Paragraph({ text: "Contact Information", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `${data.contactName} — ${data.contactEmail}` }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const key = `documents/grants/${data.orgName.replace(/\s+/g, "-")}-application.docx`;

  await env.R2.put(key, buffer, {
    httpMetadata: {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  });

  return env.R2.createPresignedUrl(key, { expiresIn: 3600 });
}
```

---

## XLSX Generation (exceljs)

Best for: financial reports, donor lists, data exports, pivot-ready datasets.

### Install

```bash
npm install exceljs
```

### Worker compatibility

`exceljs` has no native deps and works in Workers with `nodejs_compat` flag. Avoid `fs` module — use Buffer/ArrayBuffer directly.

### Financial report generation

```typescript
import ExcelJS from "exceljs";

export interface FinancialReportData {
  orgName: string;
  period: string;
  revenue: Array<{ category: string; amount: number }>;
  expenses: Array<{ category: string; amount: number }>;
}

export async function generateFinancialReport(
  env: Env,
  data: FinancialReportData,
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.orgName;
  workbook.created = new Date();

  // ---- Sheet 1: Summary ----
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Amount", key: "amount", width: 15 },
  ];

  // Style header row
  const headerRow = summary.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF060610" } };

  // Revenue section
  summary.addRow({ category: `Revenue — ${data.period}`, amount: "" }).font = { bold: true };
  let totalRevenue = 0;
  for (const line of data.revenue) {
    summary.addRow({ category: `  ${line.category}`, amount: line.amount });
    totalRevenue += line.amount;
  }
  summary.addRow({ category: "Total Revenue", amount: totalRevenue }).font = { bold: true };
  summary.addRow({});

  // Expense section
  summary.addRow({ category: "Expenses", amount: "" }).font = { bold: true };
  let totalExpenses = 0;
  for (const line of data.expenses) {
    summary.addRow({ category: `  ${line.category}`, amount: line.amount });
    totalExpenses += line.amount;
  }
  summary.addRow({ category: "Total Expenses", amount: totalExpenses }).font = { bold: true };
  summary.addRow({});

  // Net
  const net = totalRevenue - totalExpenses;
  const netRow = summary.addRow({ category: "Net Income / (Deficit)", amount: net });
  netRow.font = { bold: true, color: { argb: net >= 0 ? "FF00A86B" : "FFDC143C" } };

  // Format currency column
  summary.getColumn("amount").numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';

  // ---- Sheet 2: Raw data ----
  const raw = workbook.addWorksheet("Detail");
  raw.addRow(["Type", "Category", "Amount"]);
  for (const r of data.revenue) raw.addRow(["Revenue", r.category, r.amount]);
  for (const e of data.expenses) raw.addRow(["Expense", e.category, e.amount]);

  // Export to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const key = `documents/reports/${data.orgName.replace(/\s+/g, "-")}-${data.period}.xlsx`;

  await env.R2.put(key, buffer, {
    httpMetadata: {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  return env.R2.createPresignedUrl(key, { expiresIn: 86400 });
}
```

---

## Route handlers

```typescript
app.post("/api/documents/grant", async (c) => {
  const data = GrantApplicationSchema.parse(await c.req.json());
  const url = await generateGrantApplication(c.env, data);
  return c.json({ url });
});

app.post("/api/documents/financial-report", async (c) => {
  const data = FinancialReportSchema.parse(await c.req.json());
  const url = await generateFinancialReport(c.env, data);
  return c.json({ url });
});
```

## Worker compatibility notes

- Add `compatibility_flags = ["nodejs_compat"]` to `wrangler.toml`
- `exceljs` uses `Buffer` — covered by `nodejs_compat`
- Both libraries write to in-memory buffers — no `fs.writeFile` calls needed
- Output always routes to R2 + presigned URL — never stream raw binary in response
