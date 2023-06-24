import { config, homepage } from "../../package.json";
import { getString } from "../utils/locale";

export function registerPrefPane() {
  ztoolkit.PreferencePane.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("pref-title"),
    image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    defaultXUL: true,
    // @ts-ignore
    helpURL: homepage,
  });
}
