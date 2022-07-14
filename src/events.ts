import { AddonBase } from "./base";

class AddonEvents extends AddonBase {
  public async onInit() {
    Zotero.debug("PDFPreview: init called");
    await Zotero.uiReadyPromise;
    this.resetState();
    this.initItemSelectListener();
    this.initPreviewResizeListener();
    this.updateAutoPreview();
  }

  private initItemSelectListener() {
    ZoteroPane.itemsView.onSelect.addListener(() => {
      this._Addon.preview.preview();
    });
  }

  private initPreviewResizeListener() {
    const splitter = window.document.getElementById("zotero-items-splitter");
    splitter.addEventListener("mouseup", (e) => {
      this._Addon.preview.preview(true);
    });
  }

  public setAutoPreview() {
    let autoPreview = Zotero.Prefs.get("PDFPreview.autoPreview");
    autoPreview = !autoPreview;
    Zotero.Prefs.set("PDFPreview.autoPreview", autoPreview);
    this.updateAutoPreview(autoPreview);
  }

  private updateAutoPreview(autoPreview: boolean = undefined) {
    Zotero.debug("updateAutoPreview");

    if (typeof autoPreview === "undefined") {
      autoPreview = Zotero.Prefs.get("PDFPreview.autoPreview");
    }

    const menuitem: XUL.Element = window.document.getElementById(
      "menu_autopreview_pdfpreview"
    );
    if (autoPreview) {
      menuitem.setAttribute("checked", true);
    } else {
      menuitem.removeAttribute("checked");
    }
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

  private resetState(): void {
    // Reset preferrence state.
    let autoPreview = Zotero.Prefs.get("PDFPreview.autoPreview");
    // Init
    if (typeof autoPreview === "undefined") {
      autoPreview = true;
      Zotero.Prefs.set("PDFPreview.autoPreview", autoPreview);
    }
  }
}

export default AddonEvents;
