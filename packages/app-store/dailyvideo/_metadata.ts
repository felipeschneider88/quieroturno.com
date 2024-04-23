import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "QuieroTurno Video",
  description: _package.description,
  installed: !!process.env.DAILY_API_KEY,
  type: "daily_video",
  variant: "conferencing",
  url: "https://daily.co",
  categories: ["conferencing"],
  logo: "icon.svg",
  publisher: "Cal.com",
  category: "conferencing",
  slug: "daily-video",
  title: "QuieroTurno Video",
  isGlobal: true,
  email: "hola@quieroturno.com",
  appData: {
    location: {
      linkType: "dynamic",
      type: "integrations:daily",
      label: "QuieroTurno Video",
    },
  },
  key: { apikey: process.env.DAILY_API_KEY },
  dirName: "dailyvideo",
} as AppMeta;

export default metadata;
