import { config } from "../../package.json";

export {
  Annotation,
  PreviewType,
  InfoPaneMode,
  getPreviewType,
  getContainerId,
  isDev,
  RELOAD_COUNT,
};

const RELOAD_COUNT = 10;

enum PreviewType {
  info = 1,
  preview,
  attachment,
  null,
}

enum InfoPaneMode {
  default = 1,
  BBT,
}

class Annotation {
  type: string;
  position: any;
  color: string;
  pageLabel: string;
  constructor(type: string, position: any, color: string, pageLabel: string) {
    this.type = type;
    this.position = position;
    this.color = color;
    this.pageLabel = pageLabel;
  }
}

function getPreviewType(document: Document): PreviewType {
  const paneDeck: any = document.querySelector("#zotero-item-pane-content");
  const selectedPane = paneDeck.selectedPanel;
  if (selectedPane.id === "zotero-view-tabbox") {
    const tabbox = selectedPane;
    if (
      tabbox.selectedTab.id === "zotero-editpane-info-tab" &&
      !addon.data.state.splitCollapsed
    ) {
      return PreviewType.info;
    }
    if (
      tabbox.selectedTab.id ===
      `${getContainerId(PreviewType.preview, "after")}-tab`
    ) {
      return PreviewType.preview;
    }
  } else if (
    selectedPane.querySelector("#zotero-attachment-box") &&
    !addon.data.state.splitCollapsed
  ) {
    return PreviewType.attachment;
  }
  return PreviewType.null;
}

function getContainerId(type: PreviewType, position: "before" | "after") {
  if (type === PreviewType.preview) {
    position = "after";
  }
  return `${config.addonRef}-container-${PreviewType[type]}-${position}`;
}

function isDev() {
  return addon.data.env === "development";
}
