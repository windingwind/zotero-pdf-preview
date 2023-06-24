import { PreviewType, getContainerId } from "../utils/type";
import { getPref } from "../utils/prefs";
import { waitUtilAsync } from "../utils/wait";

export { registerSplit, updateSplit, setSplitCollapsed };

function getSplitterId(type: PreviewType, position: "before" | "after") {
  return `${getContainerId(type, position)}-splitter`;
}

async function registerSplit(type: PreviewType) {
  let zitembox: XUL.Box;
  switch (type) {
    case PreviewType.info: {
      await waitUtilAsync(() =>
        Boolean(document.querySelector("#zotero-editpane-item-box"))
      );
      zitembox = document.querySelector("#zotero-editpane-item-box") as XUL.Box;
      break;
    }
    case PreviewType.attachment: {
      await waitUtilAsync(() =>
        Boolean(document.querySelector("#zotero-attachment-box"))
      );
      zitembox = document.querySelector("#zotero-attachment-box") as XUL.Box;
      break;
    }
    default: {
      return;
    }
  }
  addon.data.env === "development" && ztoolkit.log(type, zitembox);
  zitembox.parentElement?.setAttribute("orient", "vertical");
  zitembox.parentElement!.style.display = "revert";
  zitembox.style.height = "100px";
  const boxBeforeId = getContainerId(type, "before");
  const splitterBeforeId = getSplitterId(type, "before");
  const boxAfterId = getContainerId(type, "after");
  const splitterAfterId = getSplitterId(type, "after");
  const doc = zitembox.ownerDocument;
  ztoolkit.UI.insertElementBefore(
    {
      tag: "fragment",
      children: [
        {
          tag: "box",
          id: boxBeforeId,
        },
        {
          tag: "splitter",
          id: splitterBeforeId,
          attributes: {
            collapse: "before",
          },
          styles: {
            height: "3px",
          },
          listeners: [
            {
              type: "command",
              listener: (e: Event) => {
                addon.data.state.splitHeight = parseFloat(
                  doc
                    .querySelector(`#${boxBeforeId}`)
                    ?.getAttribute("height") || "0"
                );
                setSplitCollapsed(
                  doc
                    .querySelector(`#${splitterBeforeId}`)
                    ?.getAttribute("state") === "collapsed"
                );
              },
            },
          ],
        },
      ],
    },
    zitembox
  );

  zitembox.after(
    ztoolkit.UI.createElement(doc, "fragment", {
      children: [
        {
          tag: "splitter",
          id: splitterAfterId,
          attributes: {
            collapse: "after",
          },
          styles: {
            height: "3px",
          },
          listeners: [
            {
              type: "command",
              listener: (e: Event) => {
                addon.data.state.splitHeight = parseFloat(
                  doc.querySelector(`#${boxAfterId}`)?.getAttribute("height") ||
                    "0"
                );
                setSplitCollapsed(
                  doc
                    .querySelector(`#${splitterAfterId}`)
                    ?.getAttribute("state") === "collapsed"
                );
              },
            },
          ],
        },
        {
          tag: "box",
          id: boxAfterId,
        },
      ],
    })
  );
}

function setSplitCollapsed(
  collapsed: boolean | undefined = undefined,
  quietly = false
) {
  if (typeof collapsed === "undefined") {
    collapsed = !addon.data.state.splitCollapsed;
  }
  if (!quietly) {
    const lastCollapsed = addon.data.state.splitCollapsed;
    addon.data.state.splitCollapsed = collapsed;
    if (lastCollapsed && !collapsed) {
      addon.hooks.onPreview();
    }
  }
  const toCollapseKeys = [PreviewType.info, PreviewType.attachment];
  toCollapseKeys.forEach((key) => {
    document
      .querySelector(`#${getSplitterId(key, "before")}`)
      ?.setAttribute("state", collapsed ? "collapsed" : "open");
    document
      .querySelector(`#${getSplitterId(key, "after")}`)
      ?.setAttribute("state", collapsed ? "collapsed" : "open");
  });
}

/**
 * Update split hidden status
 * @param type
 */
function updateSplit(type: PreviewType) {
  // Check BBT layout
  // const BBTBox = (
  //   document.getElementById("zotero-editpane-item-box") as Element
  // ).parentElement?.querySelector("#better-bibtex-editpane-item-box");
  // if (false) {
  // this.previewMode = "BBT";
  // const toRemove = [
  //   "pdf-preview-infosplit-before",
  //   "pdf-preview-infosplit-after",
  //   "pdf-preview-infosplit-splitter-before",
  //   "pdf-preview-infosplit-splitter-after",
  // ];
  // toRemove.forEach((_id) => {
  //   const ele = document.getElementById(_id);
  //   if (ele) {
  //     ele.remove();
  //   }
  // });
  // this._Addon.Utils.Tool.log("re-init preview for BBT");
  // this.initPreviewInfoSplit(BBTBox.parentElement as Element);
  // // Swith selected tab to trigger some re-render of splitter
  // // Otherwise the splitters are unvisible
  // const tabbox: any = document.querySelector("#zotero-view-tabbox");
  // const tabIndex = tabbox.selectedIndex;
  // tabbox.selectedIndex =
  //   tabIndex === tabbox.childNodes.length - 1 ? 1 : tabIndex + 1;
  // setTimeout(async () => {
  //   tabbox.selectedIndex = tabIndex;
  //   await this.initPreview(PreviewType.info);
  //   this.doPreview(true);
  // }, 1);
  // }

  const hidden = !getPref("enableSplit");
  const position = addon.data.state.splitPosition || "after";
  const splitContainer = document.querySelector(
    `#${getContainerId(type, position)}`
  ) as XUL.Box;
  const splitSplitter = document.querySelector(
    `#${getSplitterId(type, position)}`
  ) as XUL.Splitter;
  if (hidden) {
    splitContainer.setAttribute("height", "0");
    splitContainer.style.visibility = "collapse";
    splitSplitter.style.visibility = "collapse";
  } else {
    splitContainer.setAttribute(
      "height",
      addon.data.state.splitHeight.toString()
    );
    splitContainer.style.removeProperty("visibility");
    splitSplitter.style.removeProperty("visibility");
  }

  // Hide another preview
  const hiddenPosition: "before" | "after" =
    position === "before" ? "after" : "before";
  const hiddenContainer = document.querySelector(
    `#${getContainerId(type, hiddenPosition)}`
  ) as XUL.Box;
  const hiddenSplitter = document.querySelector(
    `#${getSplitterId(type, hiddenPosition)}`
  ) as XUL.Splitter;
  hiddenContainer.setAttribute("height", "0");
  hiddenContainer.style.visibility = "collapse";
  hiddenSplitter.style.visibility = "collapse";
}
