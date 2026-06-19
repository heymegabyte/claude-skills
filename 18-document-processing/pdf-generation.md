# PDF Generation on Cloudflare Workers

Source: anthropics/skills pdf pattern + CF Browser Rendering docs

Two methods. Choose based on layout complexity.

---

## Method A: CF Browser Rendering → PDF (complex layouts)

Best for: annual reports, branded invoices, full-layout donor receipts.

### Worker setup (wrangler.toml)

```toml
[[browser]]
binding = "BROWSER"
```

### Worker code

```typescript
import { launch } from "@cloudflare/puppeteer";

export interface Env {
  BROWSER: Fetcher;
  R2: R2Bucket;
}

export async function generatePDF(
  env: Env,
  html: string,
  filename: string
): Promise<string> {
  const browser = await launch(env.BROWSER);
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("print");

  const pdf = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
  });

  await browser.close();

  // Store in R2
  const key = `documents/${filename}`;
  await env.R2.put(key, pdf, {
    httpMetadata: { contentType: "application/pdf" },
  });

  // Return presigned URL (1-hour TTL)
  const url = await env.R2.createPresignedUrl(key, { expiresIn: 3600 });
  return url;
}
```

### HTML template pattern (for branded PDFs)

```typescript
function invoiceHTML(data: InvoiceData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; color: #060610; font-size: 14px; line-height: 1.6; }
  .header { background: #060610; color: #00E5FF; padding: 2rem; }
  .logo { font-size: 1.5rem; font-weight: 700; }
  .body { padding: 2rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th { background: #f5f5f7; text-align: left; padding: 0.5rem; }
  td { padding: 0.5rem; border-bottom: 1px solid #e5e5e5; }
  .total { font-weight: 700; font-size: 1.1rem; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">${data.companyName}</div>
    <div>Invoice #${data.invoiceNumber}</div>
  </div>
  <div class="body">
    <p>Bill to: ${data.customerName}</p>
    <p>Date: ${data.date} | Due: ${data.dueDate}</p>
    <table>
      <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
      ${data.lineItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.rate.toFixed(2)}</td>
          <td>$${(item.quantity * item.rate).toFixed(2)}</td>
        </tr>
      `).join("")}
      <tr class="total"><td colspan="3">Total</td><td>$${data.total.toFixed(2)}</td></tr>
    </table>
  </div>
</body>
</html>`;
}
```

### Route handler

```typescript
app.post("/api/documents/invoice", async (c) => {
  const data = InvoiceSchema.parse(await c.req.json());
  const html = invoiceHTML(data);
  const url = await generatePDF(c.env, html, `invoice-${data.invoiceNumber}.pdf`);
  return c.json({ url, expiresIn: 3600 });
});
```

---

## Method B: pdf-lib (programmatic, no layout)

Best for: tax receipts, simple certificates, data exports.

### Install

```bash
npm install pdf-lib
```

### Worker code

```typescript
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateReceiptPDF(
  env: Env,
  receipt: TaxReceiptData,
): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size in points

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();
  let y = height - 72;

  // Header
  page.drawText(receipt.orgName, { x: 72, y, font: bold, size: 20, color: rgb(0, 0.9, 1) });
  y -= 30;
  page.drawText("Official Tax Receipt", { x: 72, y, font, size: 14, color: rgb(0.4, 0.4, 0.4) });
  y -= 50;

  // Body
  const lines = [
    `Receipt #: ${receipt.receiptNumber}`,
    `Date: ${receipt.date}`,
    `Donor: ${receipt.donorName}`,
    `Amount: $${receipt.amount.toFixed(2)}`,
    `EIN: ${receipt.ein}`,
    "",
    "No goods or services were provided in exchange for this contribution.",
    "This receipt is your official record for tax purposes.",
  ];

  for (const line of lines) {
    page.drawText(line, { x: 72, y, font: line.startsWith("Amount") ? bold : font, size: 12 });
    y -= 20;
  }

  const pdfBytes = await doc.save();
  const key = `receipts/${receipt.receiptNumber}.pdf`;
  await env.R2.put(key, pdfBytes, { httpMetadata: { contentType: "application/pdf" } });

  return env.R2.createPresignedUrl(key, { expiresIn: 86400 }); // 24h for receipts
}
```

---

## Worker compatibility notes

- `pdf-lib` is pure JS — no Node built-ins, Worker-compatible out of the box
- `@cloudflare/puppeteer` requires `BROWSER` binding (available on paid plans)
- R2 presigned URLs require `R2Object.createPresignedUrl` — available in Workers runtime ≥2024-01
- Never return raw PDF bytes in the response body — always R2 + presigned URL
