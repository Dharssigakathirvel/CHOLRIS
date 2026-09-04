/**
 * CHLORIS Language Persistence Storage Helper
 * ============================================
 * Manages loading and saving the user's preferred language ('en' | 'ta')
 * using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../constants/translations';

const LANGUAGE_KEY = 'CHLORIS_PREFERRED_LANGUAGE';

/**
 * Retrieves saved language preference from local storage.
 * Defaults to 'en' if not set.
 */
export async function getSavedLanguage(): Promise<Language> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lang === 'ta' || lang === 'en') {
      return lang;
    }
  } catch (error) {
    console.log('[LanguageStorage] Error reading saved language:', error);
  }
  return 'en';
}

/**
 * Saves language preference ('en' | 'ta') to local storage.
 */
export async function saveLanguage(lang: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    console.log('[LanguageStorage] Saved language preference:', lang);
  } catch (error) {
    console.log('[LanguageStorage] Error saving language preference:', error);
  }
}
