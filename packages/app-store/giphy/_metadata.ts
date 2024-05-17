import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Giphy",
  description: _package.description,
  installed: true,
  categories: ["otros"],
  logo: "icon.svg",
  publisher: "quieroturno.com",
  slug: "giphy",
  title: "Giphy",
  type: "giphy_other",
  url: "https://apps.quieroturno.com.com/apps/giphy",
  variant: "other",
  extendsFeature: "EventType",
  email: "hola@quieroturno.com",
  dirName: "giphy",
} as AppMeta;

export default metadata;
