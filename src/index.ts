import PDFPreview from "./addon";

Zotero.PDFPreview = new PDFPreview();

window.addEventListener(
  "load",
  async function (e) {
    Zotero.PDFPreview.events.onInit();
  },
  false
);
