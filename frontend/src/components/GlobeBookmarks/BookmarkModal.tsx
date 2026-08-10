import { useState } from 'react';
import type { Bookmark } from '../../hooks/useBookmarkStorage';

export interface BookmarkFormValues {
  name: string;
  description: string;
  category: string;
}

interface BookmarkModalProps {
  initialBookmark?: Bookmark | null;
  onClose: () => void;
  onSubmit: (values: BookmarkFormValues) => void;
}

function getInitialValues(
  bookmark?: Bookmark | null
): BookmarkFormValues {
  return {
    name: bookmark?.name ?? '',
    description: bookmark?.description ?? '',
    category: bookmark?.category ?? 'Custom',
  };
}

export function BookmarkModal({
  initialBookmark,
  onClose,
  onSubmit,
}: BookmarkModalProps) {
  const [values, setValues] = useState<BookmarkFormValues>(() =>
    getInitialValues(initialBookmark)
  );

  const isEditing = Boolean(initialBookmark);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = values.name.trim();

    if (!name) {
      return;
    }

    onSubmit({
      name,
      description: values.description.trim(),
      category: values.category.trim() || 'Custom',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-modal-title"
        className="w-full max-w-md border border-primary-container/40 bg-bg-deep-space/95 p-5 shadow-[0_0_40px_rgba(0,229,255,0.15)] backdrop-blur-xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-label-caps text-[10px] tracking-widest text-primary-container/80">
              GLOBE BOOKMARK
            </p>

            <h2
              id="bookmark-modal-title"
              className="mt-1 font-display-lg text-lg font-bold text-on-surface"
            >
              {isEditing
                ? 'Edit Saved View'
                : 'Save Current View'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close bookmark dialog"
            className="border border-border-panel px-2 py-1 text-on-surface-variant transition-ui hover:border-primary-container hover:text-primary-container"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="bookmark-name"
              className="mb-1.5 block font-technical-data text-xs text-on-surface"
            >
              Name <span className="text-status-emergency">*</span>
            </label>

            <input
              id="bookmark-name"
              autoFocus
              required
              maxLength={80}
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Example: India monitoring view"
              className="w-full border border-border-panel bg-surface-container/40 px-3 py-2 font-technical-data text-sm text-on-surface outline-none transition-ui placeholder:text-on-surface-variant/50 focus:border-primary-container"
            />
          </div>

          <div>
            <label
              htmlFor="bookmark-description"
              className="mb-1.5 block font-technical-data text-xs text-on-surface"
            >
              Description <span className="text-on-surface-variant/60">(optional)</span>
            </label>

            <textarea
              id="bookmark-description"
              rows={3}
              maxLength={240}
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Add context for this saved view."
              className="w-full resize-none border border-border-panel bg-surface-container/40 px-3 py-2 font-technical-data text-sm text-on-surface outline-none transition-ui placeholder:text-on-surface-variant/50 focus:border-primary-container"
            />
          </div>

          <div>
            <label
              htmlFor="bookmark-category"
              className="mb-1.5 block font-technical-data text-xs text-on-surface"
            >
              Category
            </label>

            <input
              id="bookmark-category"
              list="bookmark-category-options"
              maxLength={40}
              value={values.category}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="Custom"
              className="w-full border border-border-panel bg-surface-container/40 px-3 py-2 font-technical-data text-sm text-on-surface outline-none transition-ui placeholder:text-on-surface-variant/50 focus:border-primary-container"
            />

            <datalist id="bookmark-category-options">
              <option value="Custom" />
              <option value="Region" />
              <option value="Satellite" />
              <option value="Orbit" />
              <option value="Mission" />
            </datalist>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-panel/60 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="border border-border-panel px-4 py-2 font-technical-data text-xs font-bold text-on-surface-variant transition-ui hover:border-on-surface hover:text-on-surface"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="border border-primary-container bg-primary-container px-4 py-2 font-technical-data text-xs font-bold text-bg-deep-space transition-ui hover:brightness-110"
            >
              {isEditing ? 'SAVE CHANGES' : 'SAVE BOOKMARK'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}