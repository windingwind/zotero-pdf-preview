import { config } from "../package.json";
import { PreviewType, getPreviewType } from "./utils/type";
import { registerPrefPane } from "./modules/preference";
import { registerSplit, setSplitCollapsed, updateSplit } from "./modules/split";
import { registerPreviewTab, updatePreviewTab } from "./modules/tab";
import { initLocale } from "./utils/locale";
import { initContainer } from "./modules/container";
import {
  initItemSelectListener,
  initPreviewResizeListener,
  initTabSelectListener,
  initWindowResizeListener,
} from "./modules/listeners";
import { preview } from "./modules/preview";
import { waitUtilAsync } from "./utils/wait";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  );
  registerPrefPane();
  await waitUtilAsync(() => {
    const win = ztoolkit.getGlobal("window");
    return win && win.document.readyState === "complete";
  });
  await onMainWindowLoad(ztoolkit.getGlobal("window"));
}

async function onMainWindowLoad(win: Window): Promise<void> {
  try {
    const doc = win.document;
    registerPreviewTab();
    // Call `viewItem` to initialize #zotero-editpane-item-box
    ztoolkit.getGlobal("ZoteroItemPane").viewItem(null, null, 0);
    await registerSplit(doc, PreviewType.info);
    await registerSplit(doc, PreviewType.attachment);
    updatePreviewTab(doc);
    updateSplit(doc, PreviewType.info);
    updateSplit(doc, PreviewType.attachment);
    await initContainer(doc, PreviewType.preview, "after");
    await initContainer(doc, PreviewType.info, "before");
    await initContainer(doc, PreviewType.info, "after");
    await initContainer(doc, PreviewType.attachment, "before");
    await initContainer(doc, PreviewType.attachment, "after");
    initItemSelectListener(doc);
    initTabSelectListener(doc);
    initPreviewResizeListener(doc);
    initWindowResizeListener(win);
    onPreview(doc, true);
  } catch (e) {
    ztoolkit.log(e);
  }
}

function onMainWindowUnload(win: Window): void {}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Reset selected panel
  (
    ztoolkit
      .getGlobal("document")
      .querySelector("#zotero-view-tabbox") as XUL.TabBox
  ).selectedIndex = 0;
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

function onPreview(document: Document, forceUpdate = false) {
  updatePreviewTab(document);
  const previewType = getPreviewType(document);
  ztoolkit.log(previewType);
  updateSplit(document, PreviewType.info);
  if (previewType === PreviewType.null) {
    //
  } else if (previewType === PreviewType.preview) {
    //
  } else {
    updateSplit(document, previewType);
  }
  preview(document, previewType, forceUpdate);
}

const onInitContainer = initContainer;

const onCollapse = setSplitCollapsed;

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    return;
  } else {
    return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onMainWindowLoad,
  onMainWindowUnload,
  onShutdown,
  onNotify,
  onPreview,
  onInitContainer,
  onCollapse,
};
