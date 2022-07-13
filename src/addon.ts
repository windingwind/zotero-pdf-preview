import AddonEvents from "./events";
import AddonPreview from "./preview";

class PDFPreview {
  public events: AddonEvents;
  public preview: AddonPreview;

  constructor() {
    this.events = new AddonEvents(this);
    this.preview = new AddonPreview(this);
  }
}

export default PDFPreview;
