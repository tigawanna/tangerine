export const settingsRouteID = "/_dashboard/$user/settings/" as const;

export const settingsSections = ["system", "logs"] as const;
export type SettingsSection = (typeof settingsSections)[number];
