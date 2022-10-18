import PDFPreview from "./addon";
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

const RELOAD_COUNT = 10;

class AddonPreview extends AddonModule {
  item: Zotero.Item;
  lastType: PreviewType;
  _initPromise: any;
  _loadingPromise: any;
  _skipRendering: boolean;
  _previewCounts: any;

  constructor(parent: PDFPreview) {
    super(parent);
    this._previewCounts = {};
    let type = PreviewType.info;
    while (type !== PreviewType.null) {
      this._previewCounts[type] = 0;
      type++;
    }
  }

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

  public getPreviewIds(type: PreviewType) {
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

  public getPreviewElements(type: PreviewType) {
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

    if (this._previewCounts[type] >= RELOAD_COUNT) {
      this._previewCounts[type] = 0;
      await this._Addon.events.initPreview(type);
      this._Addon.events.doPreview(true);
      return;
    }
    await this._Addon.preview._initPromise;
    let { iframe } = this.getPreviewElements(type);

    let t = 0;
    while (t < 500 && iframe.contentDocument.readyState !== "complete") {
      await Zotero.Promise.delay(10);
      t += 10;
    }

    let item = await this.updatePreviewItem(
      type !== this.lastType ||
        // @ts-ignore
        this.item?.id !== iframe.contentWindow.cachedData.itemID ||
        force
    );
    console.log(item);
    if (force && !item) {
      item = this.item;
    }

    if (item) {
      if (this._loadingPromise) {
        await this._loadingPromise.promise;
      }
      if (!iframe) {
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
          previewType: type,
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
