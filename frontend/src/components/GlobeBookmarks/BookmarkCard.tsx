import type { Bookmark } from '../../hooks/useBookmarkStorage';
import { MaterialIcon } from '../MaterialIcon';

interface BookmarkCardProps {
    bookmark: Bookmark;
    onOpen: (bookmark: Bookmark) => void;
    onEdit: (bookmark: Bookmark) => void;
    onDelete: (bookmark: Bookmark) => void;
    onToggleFavorite: (bookmark: Bookmark) => void;
    onShare: (bookmark: Bookmark) => void;
}

export function BookmarkCard({
    bookmark,
    onOpen,
    onShare,
    onEdit,
    onDelete,
    onToggleFavorite,
}: BookmarkCardProps) {
    const lastOpenedLabel = bookmark.lastOpenedAt
        ? new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(bookmark.lastOpenedAt))
        : 'Not opened yet';

    return (
        <article className="border border-border-panel/70 bg-surface-container/35 p-3 transition-ui hover:border-primary-container/70 hover:bg-surface-container/60">
            <div className="flex items-start justify-between gap-3">
                <button
                    type="button"
                    onClick={() => onOpen(bookmark)}
                    className="min-w-0 flex-1 text-left"
                    aria-label={`Open bookmark: ${bookmark.name}`}
                >
                    <div className="flex items-center gap-2">
                        <MaterialIcon
                            name={bookmark.isFavorite ? 'star' : 'public'}
                            className={
                                bookmark.isFavorite
                                    ? 'text-status-warning text-sm'
                                    : 'text-primary-container text-sm'
                            }
                        />

                        <h3 className="truncate font-technical-data text-sm font-bold text-on-surface">
                            {bookmark.name}
                        </h3>
                    </div>

                    <p className="mt-1 font-label-caps text-[9px] tracking-wider text-primary-container/75">
                        {bookmark.category}
                        {bookmark.isDefault ? ' · DEFAULT VIEW' : ''}
                    </p>

                    {bookmark.description && (
                        <p className="mt-2 line-clamp-2 font-technical-data text-xs text-on-surface-variant">
                            {bookmark.description}
                        </p>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => onToggleFavorite(bookmark)}
                    aria-label={
                        bookmark.isFavorite
                            ? `Remove ${bookmark.name} from favorites`
                            : `Add ${bookmark.name} to favorites`
                    }
                    aria-pressed={bookmark.isFavorite}
                    className="shrink-0 border border-border-panel p-1.5 text-on-surface-variant transition-ui hover:border-status-warning hover:text-status-warning"
                >
                    <MaterialIcon
                        name={bookmark.isFavorite ? 'star' : 'star_outline'}
                        className="text-base"
                    />
                </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-panel/50 pt-3">
                <span className="font-technical-data text-[9px] text-on-surface-variant/70">
                    {lastOpenedLabel}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onOpen(bookmark)}
                        className="border border-primary-container/60 px-2 py-1 font-technical-data text-[10px] font-bold text-primary-container transition-ui hover:bg-primary-container hover:text-bg-deep-space"
                        aria-label={`Open ${bookmark.name}`}
                    >
                        OPEN
                    </button>

                    <button
                        type="button"
                        onClick={() => onShare(bookmark)}
                        className="border border-border-panel px-2 py-1 text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
                        aria-label={`Copy a share link for ${bookmark.name}`}
                    >
                        <MaterialIcon name="share" className="text-sm" />
                    </button>

                    {!bookmark.isDefault && (
                        <>

                            <button
                                type="button"
                                onClick={() => onEdit(bookmark)}
                                className="border border-border-panel px-2 py-1 text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
                                aria-label={`Edit ${bookmark.name}`}
                            >
                                <MaterialIcon name="edit" className="text-sm" />
                            </button>

                            <button
                                type="button"
                                onClick={() => onDelete(bookmark)}
                                className="border border-border-panel px-2 py-1 text-on-surface-variant transition-ui hover:border-status-emergency hover:text-status-emergency"
                                aria-label={`Delete ${bookmark.name}`}
                            >
                                <MaterialIcon name="delete" className="text-sm" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}