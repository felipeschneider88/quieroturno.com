// This transform config was generated by Snaplet.
// Snaplet found fields that may contain personally identifiable information (PII)
// and used that to populate this file.
import { copycat as c } from "@snaplet/copycat";

import type { Transform } from "./structure";

function hasStringProp<T extends string>(x: unknown, key: T): x is { [key in T]: string } {
  return !!x && typeof x === "object" && key in x;
}

function replaceKeyIfExists<T extends string>(x: object, key: T) {
  if (hasStringProp(x, key)) {
    return { ...x, [key]: c.uuid(x[key]) };
  }
  return x;
}

function generateSlug(x: string) {
  return c.words(x, { max: 3 }).split(" ").join("-");
}

function replaceSensitiveKeys(record: object) {
  return {
    ...record,
    ...replaceKeyIfExists(record, "client_id"),
    ...replaceKeyIfExists(record, "client_secret"),
    ...replaceKeyIfExists(record, "public_key"),
    ...replaceKeyIfExists(record, "api_key"),
    ...replaceKeyIfExists(record, "signing_secret"),
    ...replaceKeyIfExists(record, "access_token"),
    ...replaceKeyIfExists(record, "refresh_token"),
    ...replaceKeyIfExists(record, "stripe_user_id"),
    ...replaceKeyIfExists(record, "stripe_publishable_key"),
    ...replaceKeyIfExists(record, "accessToken"),
    ...replaceKeyIfExists(record, "refreshToken"),
    ...replaceKeyIfExists(record, "bot_user_id"),
    ...replaceKeyIfExists(record, "app_id"),
  };
}

const generateUsername = (x: string) => `${c.firstName(x)}-${c.lastName(x)}${c.int(x, { min: 2, max: 99 })}`;

const config: Transform = () => ({
  public: {
    ApiKey: ({ row }) => ({
      hashedKey: c.uuid(row.hashedKey),
    }),
    App: ({ row }) => ({
      keys: replaceSensitiveKeys(row.keys),
    }),
    Attendee: ({ row }) => ({
      email: c.email(row.email),
      name: c.fullName(row.name),
      timeZone: c.timezone(row.timeZone),
    }),
    Credential: ({ row }) => ({
      key: typeof row.key === "string" ? c.uuid(row.key) : replaceSensitiveKeys(row.key),
    }),
    EventType: ({ row }) => ({
      slug: generateSlug(row.slug),
      timeZone: c.timezone(row.timeZone),
      eventName: c.words(row.eventName, { max: 3 }),
    }),
    ResetPasswordRequest: ({ row }) => ({
      email: c.email(row.email),
    }),
    Schedule: ({ row }) => ({
      timeZone: c.timezone(row.timeZone),
    }),
    Team: ({ row }) => ({
      bio: c.sentence(row.bio),
      name: c.words(row.name, { max: 2 }),
      slug: generateSlug(row.slug),
    }),
    users: ({ row }) =>
      row.role !== "ADMIN"
        ? {
            bio: c.sentence(row.bio),
            email: c.email(row.email),
            name: c.fullName(row.name),
            password: c.password(row.password),
            timeZone: c.timezone(row.timeZone),
            username: generateUsername(row.username),
          }
        : row,
    VerificationToken: ({ row }) => ({
      token: c.uuid(row.token),
    }),
    Account: ({ row }) => ({
      access_token: c.uuid(row.access_token),
      refresh_token: c.uuid(row.refresh_token),
    }),
  },
});

export default config;
