import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Outlook Calendar",
  description: _package.description,
  type: "office365_calendar",
  title: "Outlook Calendar",
  variant: "calendar",
  category: "calendar",
  categories: ["calendar"],
  logo: "icon.svg",
  publisher: "quieroturno.com",
  slug: "office365-calendar",
  dirName: "office365calendar",
  url: "https://quieroturno.com/",
  email: "info@quieroturno.com",
} as AppMeta;

export default metadata;
