import PDFPreview from "./addon";

// Global: bootstrap > ctx
if (!Zotero.PDFPreview) {
  Zotero.PDFPreview = new PDFPreview();
  // @ts-ignore
  Zotero.PDFPreview.events.onInit(rootURI);
}
