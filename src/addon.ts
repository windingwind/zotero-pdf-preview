import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import hooks from "./hooks";
import { getPref, setPref } from "./utils/prefs";
import { createZToolkit } from "./utils/ztoolkit";
import { DialogHelper } from "zotero-plugin-toolkit/dist/helpers/dialog";
import { InfoPaneMode, PreviewType } from "./utils/type";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    // ztoolkit: MyToolkit;
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs?: {
      window: Window;
      columns: Array<ColumnOptions>;
      rows: Array<{ [dataKey: string]: string }>;
    };
    dialog?: DialogHelper;
    state: {
      splitCollapsed: boolean;
      splitPosition: "before" | "after";
      infoPaneMode: InfoPaneMode;
      splitHeight: number;
      item?: Zotero.Item;
      lastType?: PreviewType;
      initPromise: _ZoteroTypes.PromiseObject;
      loadingPromise: _ZoteroTypes.PromiseObject;
      skipRendering: boolean;
      previewCounts: Record<number, number>;
    };
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: object;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      // ztoolkit: new MyToolkit(),
      ztoolkit: createZToolkit(),
      state: {
        splitCollapsed: false,
        get splitPosition() {
          return getPref("splitType") as "before" | "after";
        },
        set splitPosition(value: "before" | "after") {
          setPref("splitType", value);
        },
        infoPaneMode: InfoPaneMode.default,
        get splitHeight() {
          return parseFloat(getPref("splitHeight") as string);
        },
        set splitHeight(value: number) {
          setPref("splitHeight", value);
        },
        initPromise: getResolvedPromise(),
        loadingPromise: getResolvedPromise(),
        skipRendering: false,
        previewCounts: {},
      },
    };
    this.hooks = hooks;
    this.api = {};
  }
}

export default Addon;

const getResolvedPromise = () => {
  const lock = Zotero.Promise.defer();
  lock.resolve();
  return lock;
};
