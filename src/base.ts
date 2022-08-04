class AddonBase {
  protected _Addon: PDFPreview;
  constructor(parent: PDFPreview) {
    this._Addon = parent;
  }
}

enum PreviewType {
  info = 1,
  preview,
  attachment,
  null,
}

export { AddonBase, PreviewType };
