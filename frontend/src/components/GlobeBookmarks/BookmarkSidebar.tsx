import { useRef, useState } from 'react';
import type { Bookmark } from '../../hooks/useBookmarkStorage';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkSearch } from './BookmarkSearch';


interface ImportResult {
    success: boolean;
    count: number;
    error?: string;
}

interface BookmarkSidebarProps {
    bookmarks: Bookmark[];
    filteredBookmarks: Bookmark[];
    favoriteBookmarks: Bookmark[];
    recentBookmarks: Bookmark[];
    categories: string[];

    searchQuery: string;
    selectedCategory: string;

    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onShareBookmark: (bookmark: Bookmark) => void;
    onOpenBookmark: (bookmark: Bookmark) => void;
    onCreateBookmark: () => void;
    onEditBookmark: (bookmark: Bookmark) => void;
    onDeleteBookmark: (bookmarkId: string) => void;
    onToggleFavorite: (bookmarkId: string) => void;

    onExportBookmarks: () => string;
    onImportBookmarks: (json: string) => ImportResult;

    onClose: () => void;
}

export function BookmarkSidebar({
    bookmarks,
    filteredBookmarks,
    favoriteBookmarks,
    recentBookmarks,
    categories,
    searchQuery,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
    onShareBookmark,
    onOpenBookmark,
    onCreateBookmark,
    onEditBookmark,
    onDeleteBookmark,
    onToggleFavorite,
    onExportBookmarks,
    onImportBookmarks,
    onClose,
}: BookmarkSidebarProps) {
    const importInputRef = useRef<HTMLInputElement>(null);

    const [bookmarkToDelete, setBookmarkToDelete] =
        useState<Bookmark | null>(null);

    const [importMessage, setImportMessage] =
        useState<string | null>(null);

    const showExtraSections =
        searchQuery.trim().length === 0 &&
        selectedCategory === 'all';

    const handleExport = () => {
        const content = onExportBookmarks();

        const blob = new Blob([content], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'kepler-globe-bookmarks.json';

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const handleImport = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const json = await file.text();
            const result = onImportBookmarks(json);

            setImportMessage(
                result.success
                    ? `${result.count} bookmark${result.count === 1 ? '' : 's'
                    } imported.`
                    : result.error ?? 'Unable to import bookmarks.'
            );
        } catch {
            setImportMessage(
                'Unable to read the selected bookmark file.'
            );
        } finally {
            event.target.value = '';
        }
    };

    return (
        <>
            <aside
                aria-label="Globe bookmarks"
                className="absolute right-3 top-3 z-30 flex max-h-[calc(100%-1.5rem)] w-[min(24rem,calc(100%-1.5rem))] flex-col border border-primary-container/35 bg-bg-deep-space/95 shadow-[0_0_35px_rgba(0,229,255,0.12)] backdrop-blur-xl md:right-6 md:top-6"
            >
                <header className="flex items-center justify-between border-b border-border-panel/70 p-4">
                    <div>
                        <p className="font-label-caps text-[9px] tracking-[0.18em] text-primary-container/75">
                            NAVIGATION
                        </p>
                        <h2 className="font-display-lg text-base font-bold text-on-surface">
                            SAVED VIEWS
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close bookmark sidebar"
                        className="border border-border-panel px-2 py-1 text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
                    >
                        ×
                    </button>
                </header>

                <div className="space-y-3 border-b border-border-panel/70 p-4">
                    <BookmarkSearch
                        value={searchQuery}
                        onChange={onSearchChange}
                    />

                    <select
                        value={selectedCategory}
                        onChange={(event) =>
                            onCategoryChange(event.target.value)
                        }
                        aria-label="Filter bookmarks by category"
                        className="w-full border border-border-panel bg-surface-container/40 px-3 py-2 font-technical-data text-xs text-on-surface outline-none focus:border-primary-container"
                    >
                        <option value="all">All categories</option>

                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={onCreateBookmark}
                        className="w-full border border-primary-container bg-primary-container px-3 py-2 font-technical-data text-xs font-bold text-bg-deep-space transition-ui hover:brightness-110"
                    >
                        + CREATE BOOKMARK
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                    {showExtraSections &&
                        favoriteBookmarks.length > 0 && (
                            <section aria-labelledby="favorite-bookmarks-title">
                                <h3
                                    id="favorite-bookmarks-title"
                                    className="mb-2 font-label-caps text-[10px] tracking-widest text-status-warning"
                                >
                                    ★ FAVORITES
                                </h3>

                                <div className="space-y-2">
                                    {favoriteBookmarks.map((bookmark) => (
                                        <BookmarkCard
                                            key={bookmark.id}
                                            bookmark={bookmark}
                                            onOpen={onOpenBookmark}
                                            onShare={onShareBookmark}
                                            onEdit={onEditBookmark}
                                            onDelete={setBookmarkToDelete}
                                            onToggleFavorite={(item) =>
                                                onToggleFavorite(item.id)
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                    {showExtraSections &&
                        recentBookmarks.length > 0 && (
                            <section aria-labelledby="recent-bookmarks-title">
                                <h3
                                    id="recent-bookmarks-title"
                                    className="mb-2 font-label-caps text-[10px] tracking-widest text-primary-container/80"
                                >
                                    RECENT
                                </h3>

                                <div className="space-y-2">
                                    {recentBookmarks.map((bookmark) => (
                                        <BookmarkCard
                                            key={bookmark.id}
                                            bookmark={bookmark}
                                            onOpen={onOpenBookmark}
                                            onShare={onShareBookmark}
                                            onEdit={onEditBookmark}
                                            onDelete={setBookmarkToDelete}
                                            onToggleFavorite={(item) =>
                                                onToggleFavorite(item.id)
                                            }
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                    <section aria-labelledby="all-bookmarks-title">
                        <div className="mb-2 flex items-center justify-between">
                            <h3
                                id="all-bookmarks-title"
                                className="font-label-caps text-[10px] tracking-widest text-primary-container/80"
                            >
                                SAVED VIEWS
                            </h3>

                            <span className="font-technical-data text-[10px] text-on-surface-variant">
                                {bookmarks.length}
                            </span>
                        </div>

                        {filteredBookmarks.length > 0 ? (
                            <div className="space-y-2">
                                {filteredBookmarks.map((bookmark) => (
                                    <BookmarkCard
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        onOpen={onOpenBookmark}
                                        onShare={onShareBookmark}
                                        onEdit={onEditBookmark}
                                        onDelete={setBookmarkToDelete}
                                        onToggleFavorite={(item) =>
                                            onToggleFavorite(item.id)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="border border-dashed border-border-panel p-4 text-center font-technical-data text-xs text-on-surface-variant">
                                No bookmarks match this search.
                            </p>
                        )}
                    </section>
                </div>

                <footer className="border-t border-border-panel/70 p-4">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImport}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => importInputRef.current?.click()}
                            className="border border-border-panel px-3 py-2 font-technical-data text-xs font-bold text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
                        >
                            IMPORT
                        </button>

                        <button
                            type="button"
                            onClick={handleExport}
                            className="border border-border-panel px-3 py-2 font-technical-data text-xs font-bold text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
                        >
                            EXPORT
                        </button>
                    </div>

                    {importMessage && (
                        <p
                            role="status"
                            className="mt-2 font-technical-data text-[10px] text-primary-container"
                        >
                            {importMessage}
                        </p>
                    )}
                </footer>
            </aside>

            {bookmarkToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-bookmark-title"
                        className="w-full max-w-sm border border-status-emergency/50 bg-bg-deep-space p-5 shadow-[0_0_35px_rgba(255,59,48,0.15)]"
                    >
                        <h2
                            id="delete-bookmark-title"
                            className="font-display-lg text-lg font-bold text-on-surface"
                        >
                            Delete Bookmark?
                        </h2>

                        <p className="mt-2 font-technical-data text-sm text-on-surface-variant">
                            Delete “{bookmarkToDelete.name}”? This action cannot
                            be undone.
                        </p>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setBookmarkToDelete(null)}
                                className="border border-border-panel px-4 py-2 font-technical-data text-xs font-bold text-on-surface-variant"
                            >
                                CANCEL
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteBookmark(bookmarkToDelete.id);
                                    setBookmarkToDelete(null);
                                }}
                                className="border border-status-emergency bg-status-emergency px-4 py-2 font-technical-data text-xs font-bold text-white"
                            >
                                DELETE
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}