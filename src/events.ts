import { PreviewType } from "./base";
import AddonModule from "./module";

class AddonEvents extends AddonModule {
  private previewMode: string;
  public previewSplitCollapsed: boolean;
  public async onInit() {
    this.previewMode = "normal";
    this.previewSplitCollapsed = false;
    Zotero.debug("PDFPreview: init called");
    await Zotero.uiReadyPromise;
    this.initItemSelectListener();
    this.initPreviewResizeListener();
    this.initTabSelectListener();
    this.initPreviewInfoSplit();
    this.initPreviewAttachmentSplit();
    this.updatePreviewInfoSplit();
    this.updatePreviewAttachmentSplit();
    this.updatePreviewTab();
    this.updatePreviewTabName();
  }

  private initItemSelectListener() {
    ZoteroPane.itemsView.onSelect.addListener(() => {
      console.log("Preview triggered by selection change");
      this.doPreview();
    });
  }

  private initPreviewResizeListener() {
    const splitter = document.getElementById(
      "zotero-items-splitter"
    ) as HTMLElement;
    splitter.addEventListener("mouseup", (e) => {
      console.log("Preview triggered by resize");
      this.doPreview(true);
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
      console.log("Preview triggered by tab change");
      this.doPreview();
    });
  }

  private doPreview(force: boolean = false) {
    this.updatePreviewTab();
    const previewType = this.getPreviewType();
    console.log(previewType);
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

  private updatePreviewTabName() {
    let label = "";

    label = Zotero.Prefs.get("pdfpreview.previewTabName") as string;
    const previewTab = document.querySelector(
      "#pdf-preview-tab"
    ) as HTMLElement;
    previewTab.setAttribute("label", label);
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
    console.log(zitembox, zitembox.parentElement);
    zitembox.parentElement?.setAttribute("orient", "vertical");
    const boxBefore = document.createElement("box");
    boxBefore.id = "pdf-preview-infosplit-before";
    const boxAfter = document.createElement("box");
    boxAfter.id = "pdf-preview-infosplit-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = document.createElement("splitter") as Element;
    splitterBefore.id = "pdf-preview-infosplit-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = document.createElement("grippy");
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
    const splitterAfter = document.createElement("splitter") as Element;
    splitterAfter.id = "pdf-preview-infosplit-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = document.createElement("grippy");
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
    console.log(zitembox, zitembox.parentElement);
    zitembox.parentElement?.setAttribute("orient", "vertical");
    const boxBefore = document.createElement("box");
    boxBefore.id = "pdf-preview-attachment-before";
    const boxAfter = document.createElement("box");
    boxAfter.id = "pdf-preview-attachment-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = document.createElement("splitter") as Element;
    splitterBefore.id = "pdf-preview-attachment-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = document.createElement("grippy");
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
    const splitterAfter = document.createElement("splitter") as Element;
    splitterAfter.id = "pdf-preview-attachment-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = document.createElement("grippy");
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
      console.log("re-init preview for BBT");
      this.initPreviewInfoSplit(BBTBox.parentElement as Element);
      // Swith selected tab to trigger some re-render of splitter
      // Otherwise the splitters are unvisible
      const tabbox: any = document.querySelector("#zotero-view-tabbox");
      const tabIndex = tabbox.selectedIndex;
      tabbox.selectedIndex =
        tabIndex === tabbox.childNodes.length - 1 ? 1 : tabIndex + 1;
      setTimeout(() => {
        tabbox.selectedIndex = tabIndex;
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
}

export default AddonEvents;
