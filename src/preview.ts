import { AddonBase } from "./base";

class Annotation {
  type: string;
  position: any;
  color: string;
  pageLabel: string;
  constructor(type, position, color, pageLabel) {
    this.type = type;
    this.position = position;
    this.color = color;
    this.pageLabel = pageLabel;
  }
}
class AddonPreview extends AddonBase {
  item: ZoteroItem;
  _initPromise: any;
  _loadingPromise: any;

  public updatePreviewItem() {
    let items = ZoteroPane.getSelectedItems();
    if (!items.length) {
      return false;
    }
    let item: ZoteroItem;
    for (const _item of items) {
      if (false && _item.isPDFAttachment()) {
        // Disable for now. The PDF doesn't have a side bar
        item = _item;
        break;
      } else if (_item.isRegularItem()) {
        const attachment = (
          Zotero.Items.get(_item.getAttachments()) as ZoteroItem[]
        ).find((att) => att.isPDFAttachment());
        if (attachment) {
          item = attachment;
          break;
        }
      }
    }
    if (!item) {
      return false;
    }
    this.item = item;
    return this.item;
  }

  public async getBuffer() {
    console.log(this.item);
    let path: string = await this.item.getFilePathAsync();
    let buf: any = await OS.File.read(path, {});
    return new Uint8Array(buf).buffer;
  }

  public async preview(type: string = "preview", force: boolean = false) {
    if (
      Zotero.Prefs.get("pdfpreview.enable") === false ||
      Zotero.Prefs.get(
        `pdfpreview.${type === "preview" ? "enableTab" : "enableSplit"}`
      ) === false
    ) {
      return;
    }
    let item = this.updatePreviewItem();
    console.log(item);
    if (force && !item) {
      item = this.item;
    }
    const previewId = `pdf-preview-${type}-container`;
    let previewIframe = document.getElementById(previewId) as HTMLIFrameElement;
    if (item) {
      if (this._loadingPromise) {
        await this._loadingPromise.promise;
      }
      if (!previewIframe) {
        console.log("init preview iframe");
        this._initPromise = Zotero.Promise.defer();
        previewIframe = window.document.createElement("iframe");
        previewIframe.setAttribute("id", previewId);
        previewIframe.setAttribute(
          "src",
          "chrome://PDFPreview/content/previewPDF.html"
        );

        const container = document.querySelector(
          type === "preview" ? "#pdf-preview-tabpanel" : "#pdf-preview-infosplit"
        );
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
          annotations: Zotero.Prefs.get("pdfpreview.showAnnotations")
            ? item
                .getAnnotations()
                .map(
                  (i) =>
                    new Annotation(
                      i.annotationType,
                      JSON.parse(i.annotationPosition),
                      i.annotationColor,
                      i.annotationPageLabel
                    )
                )
            : [],
        },
        "*"
      );
      if (Zotero.Prefs.get("pdfpreview.autoPreview")) {
        this._Addon.events.updatePreviewTabSelection();
      }
      previewIframe.hidden = false;
    } else {
      console.log("hide preview");
      if (previewIframe) {
        previewIframe.hidden = true;
      }
    }
  }
}

export default AddonPreview;
