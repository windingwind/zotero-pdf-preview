import { config } from "../package.json";
import { PreviewType, getPreviewType } from "./utils/type";
import { registerPrefPane } from "./modules/preference";
import { registerSplit, setSplitCollapsed, updateSplit } from "./modules/split";
import { registerPreviewTab, updatePreviewTab } from "./modules/tab";
import { getString, initLocale } from "./utils/locale";
import { initContainer } from "./modules/container";
import {
  initItemSelectListener,
  initPreviewResizeListener,
  initTabSelectListener,
} from "./modules/listeners";
import { preview } from "./modules/preview";

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
  registerPreviewTab();
  await registerSplit(PreviewType.info);
  await registerSplit(PreviewType.attachment);
  updatePreviewTab();
  updateSplit(PreviewType.info);
  updateSplit(PreviewType.attachment);
  await initContainer(PreviewType.preview, "after");
  await initContainer(PreviewType.info, "before");
  await initContainer(PreviewType.info, "after");
  await initContainer(PreviewType.attachment, "before");
  await initContainer(PreviewType.attachment, "after");
  initItemSelectListener();
  initTabSelectListener();
  initPreviewResizeListener();
  onPreview(true);
}

function onPreview(forceUpdate = false) {
  updatePreviewTab();
  const previewType = getPreviewType();
  ztoolkit.log(previewType);
  updateSplit(PreviewType.info);
  if (previewType === PreviewType.null) {
    //
  } else if (previewType === PreviewType.preview) {
    //
  } else {
    updateSplit(previewType);
  }
  preview(previewType, forceUpdate);
}

const onInitContainer = initContainer;

const onCollapse = setSplitCollapsed;

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Reset selected panel
  (
    document.querySelector("#zotero-view-tabbox") as XUL.TabBox
  ).selectedIndex = 0;
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

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
  onShutdown,
  onNotify,
  onPreview,
  onInitContainer,
  onCollapse,
};
