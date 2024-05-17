import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: _package.name,
  description: _package.description,
  installed: true,
  category: "automatizacion",
  categories: ["automatizacion"],
  // If using static next public folder, can then be referenced from the base URL (/).
  logo: "icon-dark.svg",
  publisher: "quierturno.com",
  slug: "wipe-my-cal",
  title: "Liber mi día",
  type: "wipemycal_other",
  url: "https://cal.com/apps/wipe-my-cal",
  variant: "otros",
  email: "info@quieroturno.com",
  dirName: "wipemycalother",
} as AppMeta;

export default metadata;
