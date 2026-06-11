/**
 * Tauri API types and utilities for the MedTrack desktop application
 */

import { invoke } from "@tauri-apps/api/tauri";

export interface SystemInfo {
  os: string;
  arch: string;
  version: string;
}

/**
 * Get system information from the Tauri backend
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  return await invoke<SystemInfo>("get_system_info");
}

/**
 * Log events from the frontend to the Tauri console
 */
export async function logEvent(event: string, data: string): Promise<void> {
  return await invoke("log_event", { event, data });
}

/**
 * Check if the app is running in Tauri context
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Detect if running in development mode
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}
