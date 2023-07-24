import { getPref } from "../utils/prefs";
import {
  Annotation,
  PreviewType,
  RELOAD_COUNT,
  getContainerId,
  isDev,
} from "../utils/type";
import { waitUtilAsync } from "../utils/wait";

export { preview };

/**
 * This function update item and decide whether to render preview
 * @param forceRender
 */
async function updatePreviewItem(document: Document, forceRender = false) {
  const items = ZoteroPane.getSelectedItems();
  if (items.length !== 1) {
    // Do not preview multiple selection
    return false;
  }
  let item: Zotero.Item | false = items[0];
  if (item.isRegularItem()) {
    item = await items[0].getBestAttachment();
  }
  isDev() && ztoolkit.log(items, item);
  if (!item || !item.isPDFAttachment()) {
    addon.hooks.onCollapse(document, true, true);
    // Do not preview non-pdf item
    return false;
  } else {
    if (!addon.data.state.splitCollapsed) {
      addon.hooks.onCollapse(document, false, true);
    }
  }
  if (!forceRender && addon.data.state.item?.id === item.id) {
    ztoolkit.log("Preview skipped for same item");
    addon.data.state.skipRendering = true;
  } else {
    addon.data.state.skipRendering = false;
  }
  addon.data.state.item = item;
  return true;
}

async function preview(document: Document, type: PreviewType, force = false) {
  if (
    getPref(type === PreviewType.preview ? "enableTab" : "enableSplit") ===
    false
  ) {
    return;
  }

  // Reload the preview container if it has been rendered for RELOAD_COUNT times
  if (addon.data.state.previewCounts[type] >= RELOAD_COUNT) {
    addon.data.state.previewCounts[type] = 0;
    await addon.hooks.onInitContainer(
      document,
      type,
      type === PreviewType.preview ? "after" : addon.data.state.splitPosition,
    );
    force = true;
  }
  await addon.data.state.initPromise.promise;
  const iframe = document.querySelector(
    `#${getContainerId(type, addon.data.state.splitPosition)}-iframe`,
  ) as HTMLIFrameElement | null;
  if (!iframe) {
    return;
  }

  await waitUtilAsync(() => iframe.contentDocument?.readyState === "complete");

  /*
  Force when:
  1. preview type change. user changed the container
  2. item change. user changed the item
  3. force. user clicked the preview button
  */
  await updatePreviewItem(
    document,
    type !== addon.data.state.lastType ||
      // @ts-ignore cachedData is not a standard property
      addon.data.state.item?.id !== iframe.contentWindow?.cachedData?.itemID ||
      force,
  );

  if (addon.data.state.item && !addon.data.state.skipRendering) {
    await addon.data.state.loadingPromise?.promise;

    iframe.hidden = false;
    // Reset the width to allow parentElement to shrink
    iframe.style.width = "100px";
    const width = iframe.parentElement?.clientWidth;
    if (!width) {
      return;
    }
    iframe.style.width = `${width}px`;

    ztoolkit.log("do preview");
    addon.data.state.lastType = type;
    iframe.contentWindow?.postMessage(
      {
        type: "renderPreview",
        itemID: addon.data.state.item.id,
        width: width - 40,
        annotations: getPref("showAnnotations")
          ? addon.data.state.item
              .getAnnotations()
              .map(
                (i) =>
                  new Annotation(
                    i.annotationType,
                    JSON.parse(i.annotationPosition),
                    i.annotationColor,
                    i.annotationPageLabel,
                  ),
              )
          : [],
        previewType: type,
      },
      "*",
    );
    iframe.hidden = false;
  } else {
    // ztoolkit.log("hide preview");
    // if (iframe) {
    //   iframe.hidden = true;
    // }
  }
}
