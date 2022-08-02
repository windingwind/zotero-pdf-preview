import { AddonBase } from "./base";

class AddonEvents extends AddonBase {
  private previewType: string;
  public async onInit() {
    this.previewType = "normal";
    Zotero.debug("PDFPreview: init called");
    await Zotero.uiReadyPromise;
    this.initItemSelectListener();
    this.initPreviewResizeListener();
    this.initTabSelectListener();
    this.initPreviewInfoSplit();
    this.updatePreviewInfoSplit();
    this.updatePreviewTab();
    this.updatePreviewTabName();
  }

  private initItemSelectListener() {
    ZoteroPane.itemsView.onSelect.addListener(() => {
      this.updatePreviewTab();
      if (this.isPreviewTabSelected()) {
        this._Addon.preview.preview();
      } else if (this.isInfoTabSelected()) {
        this.updatePreviewInfoSplit();
        this._Addon.preview.preview("info");
      }
    });
  }

  private initPreviewResizeListener() {
    const splitter = window.document.getElementById("zotero-items-splitter");
    splitter.addEventListener("mouseup", (e) => {
      if (this.isPreviewTabSelected()) {
        this._Addon.preview.preview("preview", true);
      } else if (this.isInfoTabSelected()) {
        this._Addon.preview.preview("info", true);
      }
    });
  }

  private initTabSelectListener() {
    const tabbox = window.document.querySelector("#zotero-view-tabbox");
    tabbox.addEventListener("command", (e) => {
      if (this.isPreviewTabSelected()) {
        this._Addon.preview.preview();
      } else if (this.isInfoTabSelected()) {
        this._Addon.preview.preview("info");
      }
    });
  }

  public isInfoTabSelected(): boolean {
    const tabbox = window.document.querySelector("#zotero-view-tabbox");
    const infoTab = window.document.querySelector("#zotero-editpane-info-tab");
    const tabIndex = Array.prototype.indexOf.call(
      infoTab.parentNode.childNodes,
      infoTab
    );
    return (tabbox as any).selectedIndex === tabIndex;
  }

  public isPreviewTabSelected(): boolean {
    const tabbox = window.document.querySelector("#zotero-view-tabbox");
    const previewTab = window.document.querySelector("#pdf-preview-tab");
    const tabIndex = Array.prototype.indexOf.call(
      previewTab.parentNode.childNodes,
      previewTab
    );
    return (tabbox as any).selectedIndex === tabIndex;
  }

  public updatePreviewTabSelection() {
    const tabbox = window.document.querySelector("#zotero-view-tabbox");
    const previewTab = window.document.querySelector("#pdf-preview-tab");
    const tabIndex = Array.prototype.indexOf.call(
      previewTab.parentNode.childNodes,
      previewTab
    );
    (tabbox as any).selectedIndex = tabIndex;
  }

  private updatePreviewTabName() {
    let label = "";

    label = Zotero.Prefs.get("pdfpreview.previewTabName");
    const previewTab = window.document.querySelector("#pdf-preview-tab");
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

  public initPreviewInfoSplit(zitembox: Element = undefined) {
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
    splitterBefore.collapse = "before";
    boxBefore.after(splitterBefore);
    const splitterAfter = document.createElement("splitter") as XUL.Splitter;
    splitterAfter.id = "pdf-preview-infosplit-splitter-after";
    splitterAfter.collapse = "after";
    boxAfter.before(splitterAfter);
    // window.addEventListener("resize", (e) => {
    //   this.resizePreviewSplit(!Zotero.Prefs.get("pdfpreview.enableSplit"));
    // });
  }

  private updatePreviewInfoSplit() {
    // Check BBT layout
    const BBTBox = document
      .getElementById("zotero-editpane-item-box")
      .parentElement.querySelector("#better-bibtex-editpane-item-box");
    if (BBTBox && this.previewType !== "BBT") {
      this.previewType = "BBT";
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
      const tabbox: any = window.document.querySelector("#zotero-view-tabbox");
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
      splitContainer.setAttribute("height", "400");
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
}

export default AddonEvents;
