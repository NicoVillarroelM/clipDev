import { useState, useEffect, useCallback } from "react";
import type { UpdateStatus } from "../types/electron";
import { APP_VERSION } from "../constants";

export function useAppSystem() {
  const [appVersion, setAppVersion] = useState<string>(APP_VERSION);
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [autoLaunchSupported, setAutoLaunchSupported] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: "idle" });

  useEffect(() => {
    let active = true;

    window.electronAPI?.getAppVersion?.().then((version) => {
      if (active && version) setAppVersion(version);
    });

    window.electronAPI?.getAutoLaunch?.().then((state) => {
      if (active && state) {
        setAutoLaunch(state.enabled);
        setAutoLaunchSupported(state.supported);
      }
    });

    window.electronAPI?.getUpdateStatus?.().then((status) => {
      if (active && status) setUpdateStatus(status);
    });

    const cleanupUpdate = window.electronAPI?.onUpdateStatus?.((status) => {
      setUpdateStatus(status);
    });

    const cleanupAutoLaunch = window.electronAPI?.onAutoLaunchChanged?.((enabled) => {
      setAutoLaunch(enabled);
    });

    return () => {
      active = false;
      cleanupUpdate?.();
      cleanupAutoLaunch?.();
    };
  }, []);

  const handleToggleAutoLaunch = useCallback(async () => {
    if (!window.electronAPI?.setAutoLaunch || !autoLaunchSupported) return;
    const next = !autoLaunch;
    const result = await window.electronAPI.setAutoLaunch(next);
    if (result) {
      setAutoLaunch(result.enabled);
      setAutoLaunchSupported(result.supported);
    }
  }, [autoLaunch, autoLaunchSupported]);

  const handleCheckForUpdates = useCallback(async () => {
    if (!window.electronAPI?.checkForUpdates) return;
    setUpdateStatus({ status: "checking" });
    const status = await window.electronAPI.checkForUpdates();
    if (status) setUpdateStatus(status);
  }, []);

  const handleRestartAndInstall = useCallback(() => {
    window.electronAPI?.restartAndInstallUpdate?.();
  }, []);

  const handleOpenExternal = useCallback((url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return {
    appVersion,
    autoLaunch,
    autoLaunchSupported,
    updateStatus,
    handleToggleAutoLaunch,
    handleCheckForUpdates,
    handleRestartAndInstall,
    handleOpenExternal,
  };
}
