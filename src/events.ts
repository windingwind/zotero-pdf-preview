import { AddonBase, PreviewType } from "./base";

class AddonEvents extends AddonBase {
  private previewMode: string;
  public async onInit() {
    this.previewMode = "normal";
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
    const splitter = document.getElementById("zotero-items-splitter");
    splitter.addEventListener("mouseup", (e) => {
      console.log("Preview triggered by resize");
      this.doPreview();
    });
  }

  private initTabSelectListener() {
    const tabbox = document.querySelector("#zotero-view-tabbox");
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

  private doPreview() {
    this.updatePreviewTab();
    const previewType = this.getPreviewType();
    if (previewType === PreviewType.info) {
      this.updatePreviewInfoSplit();
    } else if (previewType === PreviewType.attachment) {
      this.updatePreviewAttachmentSplit();
    }
    this._Addon.preview.preview(previewType);
  }

  public getPreviewType(): PreviewType {
    const paneDeck: any = document.getElementById("zotero-item-pane-content");
    const selectedPane = paneDeck.selectedPanel;
    if (selectedPane.id === "zotero-view-tabbox") {
      const tabbox: any = document.getElementById("zotero-view-tabbox");
      const infoTab = document.getElementById("zotero-editpane-info-tab");
      const infoIndex = Array.prototype.indexOf.call(
        infoTab.parentNode.childNodes,
        infoTab
      );
      if (tabbox.selectedIndex === infoIndex) {
        return PreviewType.info;
      }
      const previewTab = document.getElementById("pdf-preview-tab");
      const previewIndex = Array.prototype.indexOf.call(
        previewTab.parentNode.childNodes,
        previewTab
      );
      if (tabbox.selectedIndex === previewIndex) {
        return PreviewType.preview;
      }
    } else if (selectedPane.querySelector("#zotero-attachment-box")) {
      return PreviewType.attachment;
    }
    return PreviewType.null;
  }

  public updatePreviewTabSelection() {
    const tabbox = document.querySelector("#zotero-view-tabbox");
    const previewTab = document.querySelector("#pdf-preview-tab");
    const tabIndex = Array.prototype.indexOf.call(
      previewTab.parentNode.childNodes,
      previewTab
    );
    (tabbox as any).selectedIndex = tabIndex;
  }

  private updatePreviewTabName() {
    let label = "";

    label = Zotero.Prefs.get("pdfpreview.previewTabName");
    const previewTab = document.querySelector("#pdf-preview-tab");
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

  private initPreviewInfoSplit(zitembox: Element = undefined) {
    zitembox = zitembox || document.querySelector("#zotero-editpane-item-box");
    console.log(zitembox, zitembox.parentElement);
    zitembox.parentElement.setAttribute("orient", "vertical");
    const boxBefore = document.createElement("box");
    boxBefore.id = "pdf-preview-infosplit-before";
    const boxAfter = document.createElement("box");
    boxAfter.id = "pdf-preview-infosplit-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = document.createElement("splitter") as XUL.Splitter;
    splitterBefore.id = "pdf-preview-infosplit-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = document.createElement("grippy");
    splitterBefore.append(grippyBefore);
    splitterBefore.addEventListener("command", (e) => {
      this.setSplitHeight(
        document
          .querySelector("#pdf-preview-infosplit-before")
          .getAttribute("height")
      );
    });
    boxBefore.after(splitterBefore);
    const splitterAfter = document.createElement("splitter") as XUL.Splitter;
    splitterAfter.id = "pdf-preview-infosplit-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = document.createElement("grippy");
    splitterAfter.append(grippyAfter);
    splitterAfter.addEventListener("command", (e) => {
      this.setSplitHeight(
        document
          .querySelector("#pdf-preview-infosplit-after")
          .getAttribute("height")
      );
    });
    boxAfter.before(splitterAfter);
  }

  private initPreviewAttachmentSplit(zitembox: Element = undefined) {
    zitembox = zitembox || document.querySelector("#zotero-attachment-box");
    console.log(zitembox, zitembox.parentElement);
    zitembox.parentElement.setAttribute("orient", "vertical");
    const boxBefore = document.createElement("box");
    boxBefore.id = "pdf-preview-attachment-before";
    const boxAfter = document.createElement("box");
    boxAfter.id = "pdf-preview-attachment-after";
    zitembox.before(boxBefore);
    zitembox.after(boxAfter);
    const splitterBefore = document.createElement("splitter") as XUL.Splitter;
    splitterBefore.id = "pdf-preview-attachment-splitter-before";
    splitterBefore.setAttribute("collapse", "before");
    const grippyBefore = document.createElement("grippy");
    splitterBefore.append(grippyBefore);
    splitterBefore.addEventListener("command", (e) => {
      this.setSplitHeight(
        document
          .querySelector("#pdf-preview-attachment-before")
          .getAttribute("height")
      );
    });
    boxBefore.after(splitterBefore);
    const splitterAfter = document.createElement("splitter") as XUL.Splitter;
    splitterAfter.id = "pdf-preview-attachment-splitter-after";
    splitterAfter.setAttribute("collapse", "after");
    const grippyAfter = document.createElement("grippy");
    splitterAfter.append(grippyAfter);
    splitterAfter.addEventListener("command", (e) => {
      this.setSplitHeight(
        document
          .querySelector("#pdf-preview-attachment-after")
          .getAttribute("height")
      );
    });
    boxAfter.before(splitterAfter);
  }

  private updatePreviewInfoSplit() {
    // Check BBT layout
    const BBTBox = document
      .getElementById("zotero-editpane-item-box")
      .parentElement.querySelector("#better-bibtex-editpane-item-box");
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
      this.initPreviewInfoSplit(BBTBox.parentElement);
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
    );
    const splitContainer: HTMLDivElement = document.querySelector(
      `#pdf-preview-infosplit-${splitType}`
    );
    const splitSplitter: HTMLDivElement = document.querySelector(
      `#pdf-preview-infosplit-splitter-${splitType}`
    );
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
    const hiddenContainer: HTMLDivElement = document.querySelector(
      `#pdf-preview-infosplit-${hiddenType}`
    );
    const hiddenSplitter: HTMLDivElement = document.querySelector(
      `#pdf-preview-infosplit-splitter-${hiddenType}`
    );
    hiddenContainer.setAttribute("height", "0");
    hiddenContainer.style.visibility = "hidden";
    hiddenSplitter.style.visibility = "hidden";
  }

  private updatePreviewAttachmentSplit() {
    const hidden = !Zotero.Prefs.get("pdfpreview.enableSplit");
    const splitType: "before" | "after" = Zotero.Prefs.get(
      "pdfpreview.splitType"
    );
    const splitContainer: HTMLDivElement = document.querySelector(
      `#pdf-preview-attachment-${splitType}`
    );
    const splitSplitter: HTMLDivElement = document.querySelector(
      `#pdf-preview-attachment-splitter-${splitType}`
    );
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
    const hiddenContainer: HTMLDivElement = document.querySelector(
      `#pdf-preview-attachment-${hiddenType}`
    );
    const hiddenSplitter: HTMLDivElement = document.querySelector(
      `#pdf-preview-attachment-splitter-${hiddenType}`
    );
    hiddenContainer.setAttribute("height", "0");
    hiddenContainer.style.visibility = "hidden";
    hiddenSplitter.style.visibility = "hidden";
  }

  private setSplitHeight(height: string) {
    Zotero.Prefs.set("pdfpreview.splitHeight", height);
  }

  private getSplitHeight(): string {
    return Zotero.Prefs.get("pdfpreview.splitHeight");
  }
}

export default AddonEvents;
