# SuperAdmin Batch-wise Report PDF Implementation Plan

This plan details the implementation of a new feature for SuperAdmins to generate and download a comprehensive, multi-page PDF report per batch.

## User Review Required
> [!IMPORTANT]
> The PDF will be generated on the client-side using `html2pdf.js` to ensure the graphs (rendered with `Chart.js`) and tables are accurately captured and styled. I have chosen this over server-side generation (like `pdfkit`) because rendering complex CSS and Javascript charts server-side is significantly more difficult and fragile. Please confirm if client-side generation is acceptable!

> [!WARNING]
> You mentioned "week" for the intern data. In your `User` model, there is a `duration` field which usually represents weeks. I will use `duration` for the week column. If you meant something else, please let me know.

## Open Questions
> [!NOTE]
> 1. In the SuperAdmin dashboard, there are existing dropdowns/lists for batches. Where exactly do you want the "Download Batch Report" button? I plan to add a new "Batch Reports" card/section near the top of the dashboard.
> 2. For "External Expenditure", I assume this is the sum of `amountPaid` for all interns in the batch. Please confirm!

## Proposed Changes

---

### Backend Routes

#### [MODIFY] [superAdminRoute.js](file:///c:/Users/anuna/OneDrive/Desktop/RixiApp/routes/superAdminRoute.js)
- Add a new `GET /report/batch/:batch_no` route.
- This route will query the `User` model for all interns with the specified `batch_no`.
- It will calculate:
  - Total Interns count.
  - Total Projects (summing up `projectAssigned.length` for all found interns).
  - External Expenditure (summing up `amountPaid` for all found interns).
  - Array of intern details: `name`, `intern_id`, `domain`, `duration` (week), and `amountPaid` (defaulting to 0).
  - Domain distribution for the chart.
- It will render a new `batchReportPDF.ejs` view passing this data.

---

### Views (Frontend)

#### [MODIFY] [superAdmin.ejs](file:///c:/Users/anuna/OneDrive/Desktop/RixiApp/views/superAdmin.ejs)
- Add a UI section (e.g., a small card or modal) labeled "Download Reports".
- It will have a select dropdown of all available batches.
- A "Download Batch Report" button which opens the new `/superAdmin/report/batch/:batch_no` route in a new tab.

#### [NEW] [batchReportPDF.ejs](file:///c:/Users/anuna/OneDrive/Desktop/RixiApp/views/batchReportPDF.ejs)
- A completely new EJS view designed strictly for PDF export.
- **Styling**: Clean, professional, premium white/corporate theme suitable for a report.
- **Content**:
  1. Title: Batch Report - [Batch No].
  2. Stat Cards: Total Interns, Total Projects, Total Expenditure.
  3. Graph: A `Chart.js` bar/pie chart showing intern distribution by Domain.
  4. Table: A styled data table displaying `name`, `intern_id`, `domain`, `week`, and `amountPaid` (default to 0).
- **Scripts**: Include `Chart.js` for the graphs and `html2pdf.js`.
- On page load, it will render the chart, and then immediately trigger `html2pdf()` to generate and download the PDF.

## Verification Plan

### Manual Verification
- Log in as a SuperAdmin.
- Go to the new "Batch Reports" section and select a batch.
- Click "Download Batch Report".
- Verify that a new tab opens, renders the report beautifully, and automatically triggers a PDF download.
- Verify the PDF contains multiple pages (if the table is long), the chart, the correct stats, and that `amountPaid` shows 0 when null.
