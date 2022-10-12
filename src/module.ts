import PDFPreview from "./addon";

class AddonModule {
  protected _Addon: PDFPreview;
  constructor(parent: PDFPreview) {
    this._Addon = parent;
  }
}

export default AddonModule;
