import { AddonBase } from "./base";

class AddonPreview extends AddonBase {
  item: ZoteroItem;
  _initPromise: any;
  _loadingPromise: any;

  public updatePreviewItem() {
    let items = ZoteroPane.getSelectedItems();
    if (!items.length) {
      return false;
    }
    items = items
      .filter((e) => e.isRegularItem())
      .map((e) =>
        (Zotero.Items.get(e.getAttachments()) as ZoteroItem[]).filter((att) =>
          att.isPDFAttachment()
        )
      )
      .find((e) => e.length);
    if (!items) {
      return false;
    }
    this.item = items[0];
    return this.item;
  }

  public async getBuffer() {
    console.log(this.item);
    let path: string = await this.item.getFilePathAsync();
    let buf: any = await OS.File.read(path, {});
    return new Uint8Array(buf).buffer;
  }

  public async preview() {
    const item = this.updatePreviewItem();
    console.log(item);
    if (item) {
      if (this._loadingPromise) {
        await this._loadingPromise.promise;
      }
      let previewIframe: HTMLIFrameElement = document.querySelector(
        "#pdf-preview-container"
      );
      if (!previewIframe) {
        console.log("init preview iframe");
        this._initPromise = Zotero.Promise.defer();
        previewIframe = window.document.createElement("iframe");
        previewIframe.setAttribute("id", "pdf-preview-container");
        previewIframe.setAttribute(
          "src",
          "chrome://PDFPreview/content/previewPDF.html"
        );

        const container = document.querySelector("#pdf-preview-tabpanel");
        if (!container) {
          return;
        }
        container.appendChild(previewIframe);
      }
      previewIframe.hidden = false;
      const width = previewIframe.parentElement.clientWidth;
      if (!width) {
        return;
      }
      previewIframe.style.width = `${width}px`;
      await this._initPromise.promise;

      if ((item as unknown as ZoteroItem).id !== this.item.id) {
        return;
      }
      console.log("do preview");
      previewIframe.contentWindow.postMessage(
        {
          type: "renderPreview",
          itemID: this.item.id,
          buffer: await this.getBuffer(),
          width: width - 40,
        },
        "*"
      );
      if (Zotero.Prefs.get("PDFPreview.autoPreview")) {
        this._Addon.events.updatePreviewTabSelection();
      }
    } else {
      console.log("hide preview");
      let previewIframe: HTMLIFrameElement = document.querySelector(
        "#pdf-preview-container"
      );
      if (previewIframe) {
        previewIframe.hidden = true;
      }
    }
  }
}

export default AddonPreview;
