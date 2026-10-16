export const APP_NAME = "ClipDev";
export const APP_VERSION = "1.0.3";

export const MAX_CLIPS_COUNT = 150;
export const FEEDBACK_TIMEOUT_MS = 1500;
export const INITIAL_MOUNT_DELAY_MS = 120;
export const SCALE_TOAST_TIMEOUT_MS = 1300;
export const STORAGE_SAVE_DEBOUNCE_MS = 400;

export const STORAGE_KEYS = {
  LANG: "clipdev_lang",
  MODE: "clipdev_mode",
  FINISH: "clipdev_finish",
  FONT_SIZE: "clipdev_fontsize",
  THEME: "clipdev_theme",
  CLIPS: "clipdev_clips",
  NOTES: "clipdev_notes",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
