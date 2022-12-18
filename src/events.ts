import { PreviewType } from "./base";
import AddonModule from "./module";
const { addonRef, addonID, addonName } = require("../package.json");

class AddonEvents extends AddonModule {
  private previewMode: string;
  public previewSplitCollapsed: boolean;
  public async onInit(rootURI: string) {
    this._Addon.Zotero = Zotero;
    this._Addon.rootURI = rootURI;
    this.previewMode = "normal";
    this.previewSplitCollapsed = false;
    this._Addon.Utils.Tool.log(`${addonName}: init called`);
    await Zotero.uiReadyPromise;
    this.initOverlay();
    this.initItemSelectListener();
    this.initPreviewResizeListener();
    this.initTabSelectListener();
    this.initPreviewInfoSplit();
    this.initPreviewAttachmentSplit();
    this.updatePreviewInfoSplit();
    this.updatePreviewAttachmentSplit();
    this.updatePreviewTab();
    let type = PreviewType.info;
    while (type !== PreviewType.null) {
      await this.initPreview(type);
      type++;
    }
  }

  public onUnInit(): void {
    this._Addon.Utils.Tool.log(`${addonName}: uninit called`);
    //  Remove elements and do clean up
    this.unInitOverlay();
    // Remove addon object
    Zotero.PDFPreview = undefined;
  }

  private initOverlay() {
    const tab = this._Addon.Utils.UI.createElement(
      document,
      "tab",
      "xul"
    ) as XUL.Element;
    tab.id = "pdf-preview-tab";
    tab.setAttribute(
      "label",
      Zotero.Prefs.get("pdfpreview.previewTabName") as string
    );
    document.querySelector("#zotero-editpane-tabs")?.appendChild(tab);
    const tabpanel = this._Addon.Utils.UI.createElement(
      document,
      "tabpanel",
      "xul"
    ) as XUL.Element;
    tabpanel.id = "pdf-preview-tabpanel";
    tabpanel.style.overflow = "hidden";
    // Prefs
    document.querySelector("#zotero-view-item")?.appendChild(tabpanel);
    const prefOptions = {
      pluginID: addonID,
      src: this._Addon.rootURI + "chrome/content/preferences.xhtml",
      label: "PDF Preview",
      image: `chrome://${addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
    };
    if (this._Addon.Utils.Compat.isZotero7()) {
      Zotero.PreferencePanes.register(prefOptions);
    } else {
      this._Addon.Utils.Compat.registerPrefPane(prefOptions);
    }
  }

  private unInitOverlay() {
    this._Addon.Utils.UI.removeAddonElements();
    if (!this._Addon.Utils.Compat.isZotero7()) {
      this._Addon.Utils.Compat.unregisterPrefPane();
    }
  }

  private initItemSelectListener() {
    ZoteroPane.itemsView.onSelect.addListener(() => {
      this._Addon.Utils.Tool.log("Preview triggered by selection change");
      this.doPreview();
    });
  }

  private initPreviewResizeListener() {
    const splitter = document.getElementById(
      "zotero-items-splitter"
    ) as HTMLElement;
    const grippy = document.getElementById(
      "zotero-items-grippy"
    ) as HTMLElement;
    const onResize = (e) => {
      this._Addon.Utils.Tool.log("Preview triggered by resize");
      this.doPreview(true);
    };
    splitter.addEventListener("mouseup", onResize);
    grippy.addEventListener("mouseup", (e) => {
      setTimeout(onResize, 10);
    });
  }

  private initTabSelectListener() {
    const tabbox = document.querySelector("#zotero-view-tabbox") as HTMLElement;
    tabbox.addEventListener("command", (e) => {
      if (
        !["zotero-editpane-info-tab", "pdf-preview-tab"].includes(
          (e.target as Element).id
        )
      ) {
        return;
      }
      this._Addon.Utils.Tool.log("Preview triggered by tab change");
      this.doPreview();
    });
  }

  public doPreview(force: boolean = false) {
    this.updatePreviewTab();
    const previewType = this.getPreviewType();
    this._Addon.Utils.Tool.log(previewType);
    if (previewType === PreviewType.info) {
      this.updatePreviewInfoSplit();
    } else if (previewType === PreviewType.attachment) {
      this.updatePreviewAttachmentSplit();
    } else if (previewType === PreviewType.null) {
      return;
    }
    this._Addon.preview.preview(previewType, force);
  }

  public getPreviewType(): PreviewType {
    const paneDeck: any = document.getElementById("zotero-item-pane-content");
    const selectedPane = paneDeck.selectedPanel;
    if (selectedPane.id === "zotero-view-tabbox") {
      const tabbox: any = document.getElementById("zotero-view-tabbox");
      const infoTab = document.getElementById("zotero-editpane-info-tab");
      if (tabbox.selectedTab === infoTab && !this.previewSplitCollapsed) {
        return PreviewType.info;
      }
      const previewTab = document.getElementById("pdf-preview-tab");
      if (tabbox.selectedTab === previewTab) {
        return PreviewType.preview;
      }
    } else if (
      selectedPane.querySelector("#zotero-attachment-box") &&
      !this.previewSplitCollapsed
    ) {
      return PreviewType.attachment;
    }
    return PreviewType.null;
  }

  private updatePreviewTab() {
    const hidden = !Zotero.Prefs.get("pdfpreview.enableTab");
    const previewTab = document.querySelector(
      "#pdf-preview-tab"
    ) as HTMLElement;
    if (hidden) {
      previewTab.style.visibility = "hidden";
    } else {
      previewTab.style.removeProperty("visibility");
    }
  }

  private initPreviewInfoSplit(zitembox: Element | undefined = undefined) {
    zitembox =
      zitembox ||
      (document.querySelector("#zotero-editpane-item-box") as Element);
    this._Addon.Utils.Tool.log(zitembox, zitembox.parentElement);
    zitembox.parentElement?.setAttribute("orient", "vertical");
    const boxBefore = this._Addon.Utils.UI.createElement(
      document,
      "box",
      "xul"
    ) as XUL.Box;
    boxBefore.id = "pdf-preview-infosplit-before";
    const boxAfter = this._Addon.Utils.UI.createElement(
      document,
      "box",
      "xul"
    ) as XUL.Box;
    boxAfter.id = "pdf-preview-infosplit-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = this._Addon.Utils.UI.createElement(
      document,
      "splitter",
      "xul"
    ) as XUL.Element;
    splitterBefore.id = "pdf-preview-infosplit-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = this._Addon.Utils.UI.createElement(
      document,
      "grippy",
      "xul"
    ) as XUL.Element;
    splitterBefore.append(grippyBefore);
    splitterBefore.addEventListener("command", (e) => {
      this.setSplitHeight(
        (
          document.querySelector("#pdf-preview-infosplit-before") as Element
        ).getAttribute("height") as string
      );
      this.setSplitCollapsed(
        splitterBefore.getAttribute("state") === "collapsed"
      );
    });
    boxBefore.after(splitterBefore);
    const splitterAfter = this._Addon.Utils.UI.createElement(
      document,
      "splitter",
      "xul"
    ) as XUL.Element;
    splitterAfter.id = "pdf-preview-infosplit-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = this._Addon.Utils.UI.createElement(
      document,
      "grippy",
      "xul"
    ) as XUL.Element;
    splitterAfter.append(grippyAfter);
    splitterAfter.addEventListener("command", (e) => {
      this.setSplitHeight(
        (
          document.querySelector("#pdf-preview-infosplit-after") as Element
        ).getAttribute("height") as string
      );
      this.setSplitCollapsed(
        splitterAfter.getAttribute("state") === "collapsed"
      );
    });
    boxAfter.before(splitterAfter);
  }

  private initPreviewAttachmentSplit(
    zitembox: Element | undefined = undefined
  ) {
    zitembox =
      zitembox || (document.querySelector("#zotero-attachment-box") as Element);
    this._Addon.Utils.Tool.log(zitembox, zitembox.parentElement);
    zitembox.parentElement?.setAttribute("orient", "vertical");
    const boxBefore = this._Addon.Utils.UI.createElement(
      document,
      "box",
      "xul"
    ) as XUL.Box;
    boxBefore.id = "pdf-preview-attachment-before";
    const boxAfter = this._Addon.Utils.UI.createElement(
      document,
      "box",
      "xul"
    ) as XUL.Box;
    boxAfter.id = "pdf-preview-attachment-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = this._Addon.Utils.UI.createElement(
      document,
      "splitter",
      "xul"
    ) as XUL.Element;
    splitterBefore.id = "pdf-preview-attachment-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = this._Addon.Utils.UI.createElement(
      document,
      "grippy",
      "xul"
    ) as XUL.Element;
    splitterBefore.append(grippyBefore);
    splitterBefore.addEventListener("command", (e) => {
      this.setSplitHeight(
        (
          document.querySelector("#pdf-preview-attachment-before") as Element
        ).getAttribute("height") as string
      );
      this.setSplitCollapsed(
        splitterBefore.getAttribute("state") === "collapsed"
      );
    });
    boxBefore.after(splitterBefore);
    const splitterAfter = this._Addon.Utils.UI.createElement(
      document,
      "splitter",
      "xul"
    ) as XUL.Element;
    splitterAfter.id = "pdf-preview-attachment-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = this._Addon.Utils.UI.createElement(
      document,
      "grippy",
      "xul"
    ) as XUL.Element;
    splitterAfter.append(grippyAfter);
    splitterAfter.addEventListener("command", (e) => {
      this.setSplitHeight(
        (
          document.querySelector("#pdf-preview-attachment-after") as Element
        ).getAttribute("height") as string
      );
      this.setSplitCollapsed(
        splitterAfter.getAttribute("state") === "collapsed"
      );
    });
    boxAfter.before(splitterAfter);
  }

  private updatePreviewInfoSplit() {
    // Check BBT layout
    const BBTBox = (
      document.getElementById("zotero-editpane-item-box") as Element
    ).parentElement?.querySelector("#better-bibtex-editpane-item-box");
    if (BBTBox && this.previewMode !== "BBT") {
      this.previewMode = "BBT";
      const toRemove = [
        "pdf-preview-infosplit-before",
        "pdf-preview-infosplit-after",
        "pdf-preview-infosplit-splitter-before",
        "pdf-preview-infosplit-splitter-after",
      ];
      toRemove.forEach((_id) => {
        const ele = document.getElementById(_id);
        if (ele) {
          ele.remove();
        }
      });
      this._Addon.Utils.Tool.log("re-init preview for BBT");
      this.initPreviewInfoSplit(BBTBox.parentElement as Element);
      // Swith selected tab to trigger some re-render of splitter
      // Otherwise the splitters are unvisible
      const tabbox: any = document.querySelector("#zotero-view-tabbox");
      const tabIndex = tabbox.selectedIndex;
      tabbox.selectedIndex =
        tabIndex === tabbox.childNodes.length - 1 ? 1 : tabIndex + 1;
      setTimeout(async () => {
        tabbox.selectedIndex = tabIndex;
        await this.initPreview(PreviewType.info);
        this.doPreview(true);
      }, 1);
    }

    const hidden = !Zotero.Prefs.get("pdfpreview.enableSplit");
    const splitType: "before" | "after" = Zotero.Prefs.get(
      "pdfpreview.splitType"
    ) as "before" | "after";
    const splitContainer = document.querySelector(
      `#pdf-preview-infosplit-${splitType}`
    ) as HTMLDivElement;
    const splitSplitter = document.querySelector(
      `#pdf-preview-infosplit-splitter-${splitType}`
    ) as HTMLDivElement;
    if (hidden) {
      splitContainer.setAttribute("height", "0");
      splitContainer.style.visibility = "hidden";
      splitSplitter.style.visibility = "hidden";
    } else {
      splitContainer.setAttribute("height", this.getSplitHeight());
      splitContainer.style.removeProperty("visibility");
      splitSplitter.style.removeProperty("visibility");
    }

    // Hide another preview
    const hiddenType: "before" | "after" =
      splitType === "before" ? "after" : "before";
    const hiddenContainer = document.querySelector(
      `#pdf-preview-infosplit-${hiddenType}`
    ) as HTMLDivElement;
    const hiddenSplitter = document.querySelector(
      `#pdf-preview-infosplit-splitter-${hiddenType}`
    ) as HTMLDivElement;
    hiddenContainer.setAttribute("height", "0");
    hiddenContainer.style.visibility = "hidden";
    hiddenSplitter.style.visibility = "hidden";
  }

  private updatePreviewAttachmentSplit() {
    const hidden = !Zotero.Prefs.get("pdfpreview.enableSplit");
    const splitType: "before" | "after" = Zotero.Prefs.get(
      "pdfpreview.splitType"
    ) as "before" | "after";
    const splitContainer = document.querySelector(
      `#pdf-preview-attachment-${splitType}`
    ) as HTMLDivElement;
    const splitSplitter = document.querySelector(
      `#pdf-preview-attachment-splitter-${splitType}`
    ) as HTMLDivElement;
    if (hidden) {
      splitContainer.setAttribute("height", "0");
      splitContainer.style.visibility = "hidden";
      splitSplitter.style.visibility = "hidden";
    } else {
      splitContainer.setAttribute("height", this.getSplitHeight());
      splitContainer.style.removeProperty("visibility");
      splitSplitter.style.removeProperty("visibility");
    }

    // Hide another preview
    const hiddenType: "before" | "after" =
      splitType === "before" ? "after" : "before";
    const hiddenContainer = document.querySelector(
      `#pdf-preview-attachment-${hiddenType}`
    ) as HTMLDivElement;
    const hiddenSplitter = document.querySelector(
      `#pdf-preview-attachment-splitter-${hiddenType}`
    ) as HTMLDivElement;
    hiddenContainer.setAttribute("height", "0");
    hiddenContainer.style.visibility = "hidden";
    hiddenSplitter.style.visibility = "hidden";
  }

  private setSplitHeight(height: string) {
    Zotero.Prefs.set("pdfpreview.splitHeight", height);
  }

  private getSplitHeight(): string {
    return Zotero.Prefs.get("pdfpreview.splitHeight") as string;
  }

  public setSplitCollapsed(
    collapsed: boolean | undefined = undefined,
    quietly: boolean = false
  ) {
    if (typeof collapsed === "undefined") {
      collapsed = !this.previewSplitCollapsed;
    }
    if (!quietly) {
      const lastCollapsed = this.previewSplitCollapsed;
      this.previewSplitCollapsed = collapsed;
      if (lastCollapsed && !collapsed) {
        this.doPreview();
      }
    }
    const toCollapseIds = [
      "pdf-preview-infosplit-splitter-before",
      "pdf-preview-infosplit-splitter-after",
      "pdf-preview-attachment-splitter-before",
      "pdf-preview-attachment-splitter-after",
    ];
    toCollapseIds.forEach((_id) => {
      (document.getElementById(_id) as Element).setAttribute(
        "state",
        collapsed ? "collapsed" : "open"
      );
    });
  }

  public async initPreview(type: PreviewType) {
    this._Addon.Utils.Tool.log("init preview iframe");
    this._Addon.preview._initPromise = Zotero.Promise.defer();
    const { container } = this._Addon.preview.getPreviewElements(type);
    if (!container) {
      return;
    }
    const iframeId = this._Addon.preview.getPreviewIds(type).iframeId;
    document.getElementById(iframeId)?.remove();
    const iframe = this._Addon.Utils.UI.createElement(
      document,
      "iframe",
      "xul"
    ) as HTMLIFrameElement;
    iframe.setAttribute("id", iframeId);
    iframe.setAttribute("src", "chrome://PDFPreview/content/previewPDF.html");
    container.appendChild(iframe);
    await this._Addon.preview._initPromise;
    iframe.contentWindow.postMessage(
      {
        type: "updateToolbar",
        previewType: type,
      },
      "*"
    );
  }
}

export default AddonEvents;
