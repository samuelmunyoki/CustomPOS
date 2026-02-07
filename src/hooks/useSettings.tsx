import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import type { AppSettings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from database
  const loadSettings = async () => {
    try {
      setLoading(true);
      const appSettings = db.getSettings();
      
      // Parse themeConfig if it's a string
      if (appSettings.themeConfig && typeof appSettings.themeConfig === 'string') {
        appSettings.themeConfig = JSON.parse(appSettings.themeConfig);
      }
      
      setSettings(appSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Update settings in database
  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      // If themeConfig is provided, ensure it's stringified for storage
      if (updates.themeConfig) {
        updates = {
          ...updates,
          themeConfig: JSON.stringify(updates.themeConfig)
        };
      }
      
      db.updateSettings(updates);
      
      // Reload settings to get the updated values
      await loadSettings();
      
      return { success: true };
    } catch (err) {
      console.error('Failed to update settings:', err);
      return { success: false, error: 'Failed to update settings' };
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  };
}