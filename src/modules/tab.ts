import { getPref } from "../utils/prefs";
import { PreviewType, getContainerId } from "../utils/type";

export { registerPreviewTab, updatePreviewTab };

const panelId = getContainerId(PreviewType.preview, "after");
const tabId = `${panelId}-tab`;

function registerPreviewTab() {
  ztoolkit.LibraryTabPanel.register(
    getPref("previewTabName") as string,
    (panel, win) => {
      return void 0;
    },
    {
      panelId,
      tabId,
    },
  );
}

function updatePreviewTab() {
  const hidden = !getPref("enableTab");
  const previewTab = document.querySelector(`#${tabId}`) as XUL.Tab;
  if (hidden) {
    previewTab.style.visibility = "hidden";
  } else {
    previewTab.style.removeProperty("visibility");
  }
}
