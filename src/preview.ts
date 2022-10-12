import { PreviewType } from "./base";
import AddonModule from "./module";

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
class AddonPreview extends AddonModule {
  item: Zotero.Item;
  lastType: PreviewType;
  _initPromise: any;
  _loadingPromise: any;
  _skipRendering: boolean;

  public async updatePreviewItem(alwaysUpdate: boolean = false) {
    let items = ZoteroPane.getSelectedItems();
    if (items.length !== 1) {
      return false;
    }
    let item: Zotero.Item = items[0];
    if (item.isRegularItem()) {
      item = await items[0].getBestAttachment();
    }
    console.log(items, item);
    if (!item || !item.isPDFAttachment()) {
      this._Addon.events.setSplitCollapsed(true, true);
      return false;
    } else {
      if (!this._Addon.events.previewSplitCollapsed) {
        this._Addon.events.setSplitCollapsed(false, true);
      }
    }
    if (!alwaysUpdate && this.item && item.id === this.item.id) {
      console.log("Preview skipped for same item");
      this._skipRendering = true;
    } else {
      this._skipRendering = false;
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

  private getPreviewIds(type: PreviewType) {
    let iframeId = "";
    let containerId = "";
    const splitType: "before" | "after" = Zotero.Prefs.get(
      "pdfpreview.splitType"
    ) as "before" | "after";
    if (type === PreviewType.info) {
      iframeId = `pdf-preview-info-${splitType}-container`;
      containerId = `pdf-preview-infosplit-${splitType}`;
    } else if (type === PreviewType.preview) {
      iframeId = `pdf-preview-preview-container`;
      containerId = "pdf-preview-tabpanel";
    } else if (type === PreviewType.attachment) {
      iframeId = `pdf-preview-attachment-${splitType}-container`;
      containerId = `pdf-preview-attachment-${splitType}`;
    }
    return { iframeId, containerId };
  }

  private getPreviewElements(type: PreviewType) {
    const { iframeId, containerId } = this.getPreviewIds(type);
    return {
      iframe: document.getElementById(iframeId) as HTMLIFrameElement,
      container: document.getElementById(containerId),
    };
  }

  public updateWidth(type: PreviewType) {
    const iframe = this.getPreviewElements(type).iframe;
    // Reset the width to allow parentElement to shrink
    iframe.style.width = "100px";
    const width = iframe.parentElement?.clientWidth;
    if (!width) {
      return;
    }
    iframe.style.width = `${width}px`;
    iframe.contentWindow?.postMessage(
      {
        type: "updateWidth",
        width: width - 40,
      },
      "*"
    );
  }

  public async preview(type: PreviewType, force: boolean = false) {
    if (
      Zotero.Prefs.get("pdfpreview.enable") === false ||
      Zotero.Prefs.get(
        `pdfpreview.${
          type === PreviewType.preview ? "enableTab" : "enableSplit"
        }`
      ) === false
    ) {
      return;
    }
    let item = await this.updatePreviewItem(type !== this.lastType || force);
    console.log(item);
    if (force && !item) {
      item = this.item;
    }

    let { iframe: iframe, container } = this.getPreviewElements(type);
    if (item) {
      if (this._loadingPromise) {
        await this._loadingPromise.promise;
      }
      if (!iframe) {
        console.log("init preview iframe");
        this._initPromise = Zotero.Promise.defer();
        iframe = window.document.createElement("iframe");
        iframe.setAttribute("id", this.getPreviewIds(type).iframeId);
        iframe.setAttribute(
          "src",
          "chrome://PDFPreview/content/previewPDF.html"
        );

        if (!container) {
          return;
        }
        container.appendChild(iframe);
      }
      iframe.hidden = false;
      // Reset the width to allow parentElement to shrink
      iframe.style.width = "100px";
      const width = iframe.parentElement?.clientWidth;
      if (!width) {
        return;
      }
      iframe.style.width = `${width}px`;
      await this._initPromise.promise;

      if ((item as unknown as Zotero.Item).id !== this.item.id) {
        // New preview triggered. Stop current one.
        return;
      }
      if (this._skipRendering) {
        iframe.hidden = false;
        return;
      }
      console.log("do preview");
      this.lastType = type;
      iframe.contentWindow?.postMessage(
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
      iframe.hidden = false;
    } else {
      console.log("hide preview");
      if (iframe) {
        iframe.hidden = true;
      }
    }
  }
}

export default AddonPreview;
