import { AddonBase } from "./base";

class AddonEvents extends AddonBase {
  public async onInit() {
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

  private initPreviewInfoSplit() {
    const zitembox = document.querySelector("#zotero-editpane-item-box");
    zitembox.parentElement.setAttribute("orient", "vertical");
    const div = document.createElement("div");
    div.id = "pdf-preview-infosplit";
    zitembox.before(div);
    const splitter = document.createElement("splitter") as XUL.Splitter;
    splitter.id = "pdf-preview-infosplit-splitter";
    splitter.collapse = "before";
    div.after(splitter);
    // window.addEventListener("resize", (e) => {
    //   this.resizePreviewSplit(!Zotero.Prefs.get("pdfpreview.enableSplit"));
    // });
  }

  private updatePreviewInfoSplit() {
    const hidden = !Zotero.Prefs.get("pdfpreview.enableSplit");
    const splitContainer: HTMLDivElement = document.querySelector(
      "#pdf-preview-infosplit"
    );
    const splitSplitter: HTMLDivElement = document.querySelector(
      "#pdf-preview-infosplit-splitter"
    );
    if (hidden) {
      splitContainer.style.height = "0px";
      splitContainer.style.visibility = "hidden";
      splitSplitter.style.visibility = "hidden";
    } else {
      splitContainer.style.height = "400px";
      splitContainer.style.removeProperty("visibility");
      splitSplitter.style.removeProperty("visibility");
    }
  }
}

export default AddonEvents;
