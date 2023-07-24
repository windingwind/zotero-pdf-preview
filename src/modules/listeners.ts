import { PreviewType, getContainerId, getPreviewType } from "../utils/type";

export {
  initItemSelectListener,
  initPreviewResizeListener,
  initTabSelectListener,
  initWindowResizeListener,
};

// Use a global variable to prevent multiple resize events from triggering
let resizing = 0;

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
    "#zotero-items-splitter",
  ) as HTMLElement;
  splitter.addEventListener("mouseup", getOnItemBoxResize());
}

function initWindowResizeListener() {
  const onWindowResize = getOnWindowResize();
  window.addEventListener("resize", onWindowResize);
  onWindowResize();
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

function getOnItemBoxResize() {
  function onItemBoxResize() {
    const splitter = document.querySelector(
      "#zotero-items-splitter",
    ) as HTMLElement;
    if (!addon.data.alive) {
      splitter.removeEventListener("mouseup", onItemBoxResize);
    }

    const iframeList = document.querySelectorAll(
      ".pdf-preview-iframe",
    ) as NodeListOf<HTMLIFrameElement>;

    iframeList.forEach((iframe) => {
      // Reset the width to allow parentElement to shrink
      iframe.style.width = "100px";
    });
    iframeList.forEach((iframe) => {
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
        "*",
      );
    });
    resizing += 1;
    ztoolkit.getGlobal("setTimeout")(() => {
      resizing -= 1;
      if (resizing === 0) {
        ztoolkit.log("Preview triggered by resize");
        addon.hooks.onPreview(true);
      }
    }, 100);
  }
  return onItemBoxResize;
}

function getOnWindowResize() {
  const onItemBoxResize = getOnItemBoxResize();
  function onWindowResize(e?: UIEvent) {
    if (!addon.data.alive) {
      window.removeEventListener("resize", onWindowResize);
    }
    if (e && e.target !== window) {
      return;
    }
    // Set splitHeight very large to force take all available space
    addon.data.state.splitHeight = 65535;
    onItemBoxResize();
  }
  return onWindowResize;
}
