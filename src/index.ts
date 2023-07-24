import { BasicTool } from "zotero-plugin-toolkit/dist/basic";
import Addon from "./addon";
import { config } from "../package.json";

const basicTool = new BasicTool();

if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
  // Set global variables
  _globalThis.Zotero = basicTool.getGlobal("Zotero");
  defineGlobal("window");
  defineGlobal("document");
  defineGlobal("ZoteroPane");
  defineGlobal("Zotero_Tabs");
  _globalThis.addon = new Addon();
  _globalThis.ztoolkit = addon.data.ztoolkit;
  ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
  ztoolkit.basicOptions.log.disableConsole = addon.data.env === "production";
  ztoolkit.UI.basicOptions.ui.enableElementJSONLog =
    addon.data.env === "development";
  ztoolkit.UI.basicOptions.ui.enableElementDOMLog =
    addon.data.env === "development";
  ztoolkit.basicOptions.debug.disableDebugBridgePassword =
    addon.data.env === "development";
  Zotero[config.addonInstance] = addon;
  // Trigger addon hook for initialization
  addon.hooks.onStartup();
}

function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]) {
  Object.defineProperty(_globalThis, name, {
    get() {
      return basicTool.getGlobal(name);
    },
  });
}
