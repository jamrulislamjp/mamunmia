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

// PDF Download - always a single A4 (210 x 297 mm) page
document
  .getElementById("downloadButton")
  .addEventListener("click", async function () {
    const btn = this;
    const label = btn.textContent;
    btn.textContent = " Preparing PDF... ";
    btn.style.pointerEvents = "none";

    try {
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
      pdf.save("newspaper-" + new Date().toISOString().slice(0, 10) + ".pdf");
    } catch (err) {
      alert("PDF could not be created. Please try again.");
    } finally {
      btn.textContent = label;
      btn.style.pointerEvents = "";
    }
  });
