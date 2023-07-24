import { PreviewType, getContainerId } from "../utils/type";

export { initContainer };

/**
 * Init container for preview
 * @param type
 * @param position
 */
async function initContainer(
  document: Document,
  type: PreviewType,
  position: "before" | "after",
) {
  addon.data.state.initPromise = Zotero.Promise.defer();
  const containerId = getContainerId(type, position);
  const container = document.querySelector(`#${containerId}`);
  if (!container) {
    ztoolkit.log(`Container ${containerId} not found`);
    return;
  }
  ztoolkit.UI.appendElement(
    {
      tag: "iframe",
      id: `${containerId}-iframe`,
      classList: ["pdf-preview-iframe"],
      properties: {
        src: "chrome://PDFPreview/content/previewPDF.html",
      },
      styles: {
        border: "none",
      },
      removeIfExists: true,
    },
    container,
  );

  const iframe = container.querySelector("iframe");

  await addon.data.state.initPromise.promise;
  iframe?.contentWindow?.postMessage(
    {
      type: "updateToolbar",
      previewType: type,
    },
    "*",
  );
}
