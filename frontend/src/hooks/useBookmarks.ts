import {
    useCallback,
    useMemo,
    useState,
} from 'react';

import {
    useBookmarkStorage,
    type Bookmark,
} from './useBookmarkStorage';

interface CreateBookmarkInput {
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
}

interface UpdateBookmarkInput {
    name?: string;
    description?: string;
    category?: string;

    latitude?: number;
    longitude?: number;
    altitude?: number;

    heading?: number;
    pitch?: number;
    roll?: number;

    selectedSatellite?: string;
    activeFilters?: string[];
}

export function useBookmarks() {
    const {
        bookmarks,
        addBookmark: addBookmarkToStorage,
        updateBookmark: updateBookmarkInStorage,
        deleteBookmark: deleteBookmarkFromStorage,

        markAsOpened,
        replaceBookmarks,
    } = useBookmarkStorage();

    const [searchQuery, setSearchQuery] =
        useState('');

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState<string>('all');

    /**
     * Create a new bookmark
     */
    const addBookmark = useCallback(
        (input: CreateBookmarkInput) => {
            const now =
                new Date().toISOString();

            const newBookmark: Bookmark = {
                id: crypto.randomUUID(),

                name: input.name.trim(),

                description:
                    input.description?.trim() || '',

                category:
                    input.category.trim() || 'Custom',

                latitude: input.latitude,
                longitude: input.longitude,
                altitude: input.altitude,

                heading: input.heading,
                pitch: input.pitch,
                roll: input.roll,

                selectedSatellite:
                    input.selectedSatellite,

                activeFilters:
                    input.activeFilters,

                isFavorite: false,
                isDefault: false,

                createdAt: now,
                updatedAt: now,
            };

            addBookmarkToStorage(
                newBookmark
            );

            return newBookmark;
        },
        [addBookmarkToStorage]
    );

    /**
     * Update an existing bookmark
     */
    const updateBookmark = useCallback(
        (id: string, updates: UpdateBookmarkInput) => {
            const existingBookmark = bookmarks.find(
                (bookmark) => bookmark.id === id
            );

            if (!existingBookmark || existingBookmark.isDefault) {
                return;
            }

            const cleanedUpdates = {
                ...updates,
                ...(updates.name !== undefined && {
                    name: updates.name.trim(),
                }),
                ...(updates.description !== undefined && {
                    description: updates.description.trim(),
                }),
                ...(updates.category !== undefined && {
                    category: updates.category.trim(),
                }),
            };

            updateBookmarkInStorage(id, cleanedUpdates);
        },
        [bookmarks, updateBookmarkInStorage]
    );

    /**
     * Delete a bookmark
     *
     * The UI should show the confirmation dialog
     * before calling this function.
     */
    const deleteBookmark = useCallback(
        (id: string) => {
            const bookmark =
                bookmarks.find(
                    (item) => item.id === id
                );

            // Prevent deletion of default bookmarks
            if (bookmark?.isDefault) {
                return false;
            }

            deleteBookmarkFromStorage(id);

            return true;
        },
        [
            bookmarks,
            deleteBookmarkFromStorage,
        ]
    );

    /**
     * Toggle favorite status
     */
    const toggleFavorite = useCallback(
        (id: string) => {
            const bookmark =
                bookmarks.find(
                    (item) => item.id === id
                );

            if (!bookmark) {
                return;
            }

            updateBookmarkInStorage(id, {
                isFavorite:
                    !bookmark.isFavorite,
            });
        },
        [
            bookmarks,
            updateBookmarkInStorage,
        ]
    );

    /**
     * Mark bookmark as recently opened
     */
    const markAsRecent = useCallback(
        (id: string) => {
            markAsOpened(id);
        },
        [markAsOpened]
    );

    /**
     * Get bookmark by ID
     */
    const getBookmark = useCallback(
        (id: string) => {
            return bookmarks.find(
                (bookmark) =>
                    bookmark.id === id
            );
        },
        [bookmarks]
    );

    /**
     * Get unique categories
     */
    const categories = useMemo(() => {
        const uniqueCategories =
            new Set(
                bookmarks.map(
                    (bookmark) =>
                        bookmark.category
                )
            );

        return Array.from(
            uniqueCategories
        ).sort();
    }, [bookmarks]);

    /**
     * Filter bookmarks
     */
    const filteredBookmarks = useMemo(() => {
        const query =
            searchQuery
                .trim()
                .toLowerCase();

        return bookmarks
            .filter((bookmark) => {
                const matchesSearch =
                    query.length === 0 ||
                    bookmark.name
                        .toLowerCase()
                        .includes(query) ||
                    (
                        bookmark.description ??
                        ''
                    )
                        .toLowerCase()
                        .includes(query) ||
                    bookmark.category
                        .toLowerCase()
                        .includes(query);

                const matchesCategory =
                    selectedCategory === 'all' ||
                    bookmark.category ===
                    selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            })
            .sort((a, b) => {
                // Favorites first
                if (
                    a.isFavorite !==
                    b.isFavorite
                ) {
                    return a.isFavorite
                        ? -1
                        : 1;
                }

                // Recently opened first
                const aDate = new Date(
                    a.lastOpenedAt ??
                    a.updatedAt
                ).getTime();

                const bDate = new Date(
                    b.lastOpenedAt ??
                    b.updatedAt
                ).getTime();

                return bDate - aDate;
            });
    }, [
        bookmarks,
        searchQuery,
        selectedCategory,
    ]);

    /**
     * Favorite bookmarks
     */
    const favoriteBookmarks =
        useMemo(
            () =>
                bookmarks
                    .filter(
                        (bookmark) =>
                            bookmark.isFavorite
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                b.lastOpenedAt ??
                                b.updatedAt
                            ).getTime() -
                            new Date(
                                a.lastOpenedAt ??
                                a.updatedAt
                            ).getTime()
                    ),
            [bookmarks]
        );

    /**
     * Recent bookmarks
     */
    const recentBookmarks =
        useMemo(
            () =>
                [...bookmarks]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.lastOpenedAt ??
                                b.updatedAt
                            ).getTime() -
                            new Date(
                                a.lastOpenedAt ??
                                a.updatedAt
                            ).getTime()
                    )
                    .slice(0, 5),
            [bookmarks]
        );

    /**
     * Export bookmarks as JSON
     */
    const exportBookmarks =
        useCallback(() => {
            return JSON.stringify(
                bookmarks,
                null,
                2
            );
        }, [bookmarks]);

    /**
     * Import bookmarks from JSON
     */
    const importBookmarks =
        useCallback(
            (json: string) => {
                try {
                    const parsed: unknown =
                        JSON.parse(json);

                    if (
                        !Array.isArray(parsed)
                    ) {
                        throw new Error(
                            'Invalid bookmark file format.'
                        );
                    }

                    const importedBookmarks: Bookmark[] =
                        parsed
                            .filter(
                                (
                                    item
                                ): item is Bookmark => {
                                    if (
                                        !item ||
                                        typeof item !==
                                        'object'
                                    ) {
                                        return false;
                                    }

                                    const bookmark =
                                        item as Partial<Bookmark>;

                                    return (
                                        typeof bookmark.name ===
                                        'string' &&
                                        typeof bookmark.category ===
                                        'string' &&
                                        typeof bookmark.latitude ===
                                        'number' &&
                                        typeof bookmark.longitude ===
                                        'number' &&
                                        typeof bookmark.altitude ===
                                        'number' &&
                                        typeof bookmark.heading ===
                                        'number' &&
                                        typeof bookmark.pitch ===
                                        'number' &&
                                        typeof bookmark.roll ===
                                        'number'
                                    );
                                }
                            )
                            .map(
                                (bookmark) => {
                                    const now =
                                        new Date().toISOString();

                                    return {
                                        ...bookmark,

                                        id: crypto.randomUUID(),

                                        isDefault: false,

                                        isFavorite:
                                            Boolean(
                                                bookmark.isFavorite
                                            ),

                                        createdAt:
                                            bookmark.createdAt ??
                                            now,

                                        updatedAt: now,
                                    };
                                }
                            );

                    if (
                        importedBookmarks.length ===
                        0
                    ) {
                        throw new Error(
                            'No valid bookmarks found in the imported file.'
                        );
                    }

                    // Add imported bookmarks
                    // to existing bookmarks
                    replaceBookmarks([
                        ...bookmarks,
                        ...importedBookmarks,
                    ]);

                    return {
                        success: true,
                        count:
                            importedBookmarks.length,
                    };
                } catch (error) {
                    console.error(
                        'Failed to import bookmarks:',
                        error
                    );

                    return {
                        success: false,
                        count: 0,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Failed to import bookmarks.',
                    };
                }
            },
            [
                bookmarks,
                replaceBookmarks,
            ]
        );

    return {
        // Data
        bookmarks,
        filteredBookmarks,
        favoriteBookmarks,
        recentBookmarks,
        categories,

        // State
        searchQuery,
        selectedCategory,

        // Search
        setSearchQuery,
        setSelectedCategory,

        // CRUD
        addBookmark,
        updateBookmark,
        deleteBookmark,
        getBookmark,

        // Bookmark actions
        toggleFavorite,
        markAsRecent,

        // Import / Export
        exportBookmarks,
        importBookmarks,
    };
}