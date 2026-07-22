import { useCallback, useState } from 'react';
import { DEFAULT_BOOKMARKS } from '../utils/bookmarkHelpers';

export interface Bookmark {
  id: string;
  name: string;
  description?: string;
  category: string;

  latitude: number;
  longitude: number;
  altitude: number;

  heading: number;
  pitch: number;
  roll: number;

  selectedSatellite?: string;
  activeFilters?: string[];

  isFavorite: boolean;
  isDefault?: boolean;

  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}

const STORAGE_KEY = 'kepler-globe-bookmarks';
function mergeWithDefaultBookmarks(
  storedBookmarks: Bookmark[]
): Bookmark[] {
  const storedById = new Map(
    storedBookmarks.map((bookmark) => [
      bookmark.id,
      bookmark,
    ])
  );

  const defaultIds = new Set(
    DEFAULT_BOOKMARKS.map((bookmark) => bookmark.id)
  );

  const defaultsWithSavedPreferences = DEFAULT_BOOKMARKS.map(
    (preset) => ({
      ...preset,
      ...storedById.get(preset.id),
      isDefault: true,
    })
  );

  const customBookmarks = storedBookmarks.filter(
    (bookmark) => !defaultIds.has(bookmark.id)
  );

  return [
    ...defaultsWithSavedPreferences,
    ...customBookmarks,
  ];
}

function loadBookmarks(): Bookmark[] {
  try {
    const storedBookmarks =
      localStorage.getItem(STORAGE_KEY);

    if (!storedBookmarks) {
      return DEFAULT_BOOKMARKS;
    }

    const parsedBookmarks: unknown =
      JSON.parse(storedBookmarks);

    if (!Array.isArray(parsedBookmarks)) {
      return DEFAULT_BOOKMARKS;
    }

    return mergeWithDefaultBookmarks(
      parsedBookmarks as Bookmark[]
    );
  } catch (error) {
    console.error(
      'Failed to load bookmarks from localStorage:',
      error
    );

    return DEFAULT_BOOKMARKS;
  }
}

export function useBookmarkStorage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  
  

  /**
   * Save bookmarks to localStorage
   */
  const saveBookmarks = useCallback(
    (newBookmarks: Bookmark[]) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(newBookmarks)
        );

        setBookmarks(newBookmarks);
      } catch (error) {
        console.error(
          'Failed to save bookmarks to localStorage:',
          error
        );
      }
    },
    []
  );

  /**
   * Add a bookmark
   */
  const addBookmark = useCallback(
    (bookmark: Bookmark) => {
      setBookmarks((currentBookmarks) => {
        const updatedBookmarks = [
          ...currentBookmarks,
          bookmark,
        ];

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedBookmarks)
          );
        } catch (error) {
          console.error(
            'Failed to save bookmark:',
            error
          );
        }

        return updatedBookmarks;
      });
    },
    []
  );

  /**
   * Update a bookmark
   */
  const updateBookmark = useCallback(
    (
      id: string,
      updates: Partial<Bookmark>
    ) => {
      setBookmarks((currentBookmarks) => {
        const updatedBookmarks =
          currentBookmarks.map((bookmark) =>
            bookmark.id === id
              ? {
                  ...bookmark,
                  ...updates,
                  updatedAt:
                    new Date().toISOString(),
                }
              : bookmark
          );

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedBookmarks)
          );
        } catch (error) {
          console.error(
            'Failed to update bookmark:',
            error
          );
        }

        return updatedBookmarks;
      });
    },
    []
  );

  /**
   * Delete a bookmark
   */
  const deleteBookmark = useCallback(
    (id: string) => {
      setBookmarks((currentBookmarks) => {
        const updatedBookmarks =
          currentBookmarks.filter(
            (bookmark) => bookmark.id !== id
          );

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedBookmarks)
          );
        } catch (error) {
          console.error(
            'Failed to delete bookmark:',
            error
          );
        }

        return updatedBookmarks;
      });
    },
    []
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    (id: string) => {
      setBookmarks((currentBookmarks) => {
        const updatedBookmarks =
          currentBookmarks.map((bookmark) =>
            bookmark.id === id
              ? {
                  ...bookmark,
                  isFavorite:
                    !bookmark.isFavorite,
                  updatedAt:
                    new Date().toISOString(),
                }
              : bookmark
          );

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedBookmarks)
          );
        } catch (error) {
          console.error(
            'Failed to toggle bookmark favorite:',
            error
          );
        }

        return updatedBookmarks;
      });
    },
    []
  );

  /**
   * Mark bookmark as recently opened
   */
  const markAsOpened = useCallback(
    (id: string) => {
      setBookmarks((currentBookmarks) => {
        const updatedBookmarks =
          currentBookmarks.map((bookmark) =>
            bookmark.id === id
              ? {
                  ...bookmark,
                  lastOpenedAt:
                    new Date().toISOString(),
                  updatedAt:
                    new Date().toISOString(),
                }
              : bookmark
          );

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedBookmarks)
          );
        } catch (error) {
          console.error(
            'Failed to mark bookmark as opened:',
            error
          );
        }

        return updatedBookmarks;
      });
    },
    []
  );

  /**
   * Replace all bookmarks.
   * Used for importing bookmarks.
   */
  const replaceBookmarks = useCallback(
    (newBookmarks: Bookmark[]) => {
      saveBookmarks(newBookmarks);
    },
    [saveBookmarks]
  );

  /**
   * Clear all bookmarks
   */
 const clearBookmarks = useCallback(() => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    setBookmarks(DEFAULT_BOOKMARKS);
  } catch (error) {
    console.error(
      'Failed to clear bookmarks:',
      error
    );
  }
}, []);

  return {
    bookmarks,

    addBookmark,
    updateBookmark,
    deleteBookmark,

    toggleFavorite,
    markAsOpened,

    replaceBookmarks,
    clearBookmarks,
  };
}