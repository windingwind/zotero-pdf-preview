import AddonEvents from "./events";
import AddonPreview from "./preview";
import AddonUtils from "./utils";

class PDFPreview {
  public Zotero: _ZoteroConstructable;
  public rootURI: string;
  public events: AddonEvents;
  public preview: AddonPreview;
  public Utils: AddonUtils;

  constructor() {
    this.events = new AddonEvents(this);
    this.preview = new AddonPreview(this);
    this.Utils = new AddonUtils(this);
  }
}

export default PDFPreview;
