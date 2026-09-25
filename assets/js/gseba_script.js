// Apply settings from config.js
document.title = website_title;
if (print_area_border) {
  document.querySelector(".container").classList.add("print-area-border");
}

// Date Setup
const options = { day: "numeric", month: "short", year: "numeric" };
let currentDate = new Date().toLocaleDateString("en-GB", options);
currentDate = currentDate.replace(/(\d+)\s(\w+)\s(\d+)/, "$1 $2, $3");
document.getElementById("date").textContent = currentDate;

// PDF - always a single A4 (210 x 297 mm) page
const downloadBtn = document.getElementById("downloadButton");
const shareBtn = document.getElementById("shareButton");
const downloadLabel = downloadBtn.textContent; // original "Device Memory" text
const shareLabel = shareBtn.textContent; // original "Share" text
const OPEN_PDF_SECONDS = 5; // how long the "open PDF" text stays after a download
let openPdfUrl = null; // blob URL of the last PDF while the "open PDF" text is showing
let openPdfTimer = null;

// Renders .container into an A4 PDF and returns { pdf, fileName }
async function buildPdf() {
  await document.fonts.ready;

  const page = document.querySelector(".container");
  const canvas = await html2canvas(page, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: -window.scrollY,
    ignoreElements: (el) => el.classList.contains("no-print"),
    onclone: (doc) => {
      const area = doc.querySelector(".container");
      area.style.boxShadow = "none";
      area.classList.remove("print-area-border"); // guide border must not appear in the PDF
    },
  });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);

  // Local date + time so every file gets a unique name (no ":" - not allowed in file names)
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return { pdf, fileName: `newspaper-${stamp}.pdf` };
}

function showOpenPdf(url) {
  clearTimeout(openPdfTimer);
  if (openPdfUrl) URL.revokeObjectURL(openPdfUrl);
  openPdfUrl = url;
  downloadBtn.textContent = " ✓ PDF Saved - Tap to Open ";
  openPdfTimer = setTimeout(() => {
    URL.revokeObjectURL(openPdfUrl);
    openPdfUrl = null;
    downloadBtn.textContent = downloadLabel;
  }, OPEN_PDF_SECONDS * 1000);
}

// Download
downloadBtn.addEventListener("click", async function () {
  // While the "open PDF" text is showing, a click opens the PDF instead of creating a new one
  if (openPdfUrl) {
    window.open(openPdfUrl, "_blank");
    return;
  }

  downloadBtn.textContent = " Preparing PDF... ";
  downloadBtn.style.pointerEvents = "none";

  try {
    const { pdf, fileName } = await buildPdf();
    pdf.save(fileName);
    showOpenPdf(URL.createObjectURL(pdf.output("blob")));
  } catch (err) {
    downloadBtn.textContent = downloadLabel;
    alert("PDF could not be created. Please try again.");
  } finally {
    downloadBtn.style.pointerEvents = "";
  }
});

// Share (Web Share API) - lets the user send the PDF to a printer app, WhatsApp, Drive, etc.
shareBtn.addEventListener("click", async function () {
  if (!navigator.share) {
    alert("Sharing is not supported here. Use Chrome on Android over HTTPS.");
    return;
  }

  shareBtn.textContent = " Preparing... ";
  shareBtn.style.pointerEvents = "none";

  try {
    const { pdf, fileName } = await buildPdf();
    const file = new File([pdf.output("blob")], fileName, {
      type: "application/pdf",
    });

    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      alert("This browser cannot share PDF files.");
      return;
    }
    await navigator.share({ files: [file], title: fileName });
  } catch (err) {
    // AbortError = the user closed the share sheet, not a real error
    if (err.name !== "AbortError") {
      alert("Share failed: " + err.name + ". Try again or use Device Memory to download.");
    }
  } finally {
    shareBtn.textContent = shareLabel;
    shareBtn.style.pointerEvents = "";
  }
});
