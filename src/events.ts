import { AddonBase } from "./base";

class AddonEvents extends AddonBase {
  public async onInit() {
    Zotero.debug("PDFPreview: init called");
    await Zotero.uiReadyPromise;
    this.initItemSelectListener();
    this.initPreviewResizeListener();
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

  public updatePreviewTabSelection() {
    const tabbox = window.document.querySelector("#zotero-view-tabbox");
    const previewTab = window.document.querySelector("#pdf-preview-tab");
    const tabIndex = Array.prototype.indexOf.call(
      previewTab.parentNode.childNodes,
      previewTab
    );
    (tabbox as any).selectedIndex = tabIndex;
  }
}

export default AddonEvents;
