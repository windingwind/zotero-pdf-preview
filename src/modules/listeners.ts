import { PreviewType, getContainerId, getPreviewType } from "../utils/type";

export {
  initItemSelectListener,
  initPreviewResizeListener,
  initTabSelectListener,
};

function initItemSelectListener() {
  const listener = () => {
    if (!addon.data.alive) {
      ZoteroPane.itemsView.onSelect.removeListener(listener);
    }
    ztoolkit.log("Preview triggered by selection change");
    addon.hooks.onPreview();
  };
  ZoteroPane.itemsView.onSelect.addListener(listener);
}

function initPreviewResizeListener() {
  const splitter = document.querySelector(
    "#zotero-items-splitter"
  ) as HTMLElement;
  const onResize = (e: MouseEvent) => {
    if (!addon.data.alive) {
      splitter.removeEventListener("mouseup", onResize);
    }
    ztoolkit.log("Preview triggered by resize");

    const iframe = document.querySelector(
      `#${getContainerId(
        getPreviewType(),
        addon.data.state.splitPosition
      )}-iframe`
    ) as HTMLIFrameElement | null;
    if (!iframe) {
      return;
    }
    // Reset the width to allow parentElement to shrink
    iframe.style.width = "100px";
    const width = iframe.parentElement?.clientWidth;
    if (!width) {
      return;
    }
    iframe.style.width = `${width}px`;
    iframe.contentWindow?.postMessage(
      {
        type: "updateWidth",
        width: width - 40,
      },
      "*"
    );
    addon.hooks.onPreview(true);
  };
  splitter.addEventListener("mouseup", onResize);
}

function initTabSelectListener() {
  const tabbox = document.querySelector("#zotero-view-tabbox") as XUL.TabBox;
  const triggeredIds = [
    "item-box-container",
    getContainerId(PreviewType.preview, "after"),
  ];
  const listener = (e: Event) => {
    if (!addon.data.alive) {
      tabbox.removeEventListener("select", listener);
    }
    if (triggeredIds.includes(tabbox.selectedPanel?.id)) {
      ztoolkit.log("Preview triggered by tab change");
      addon.hooks.onPreview(true);
    }
  };
  tabbox.addEventListener("select", listener);
}
