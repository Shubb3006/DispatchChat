import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Portal-based modal shell.
 *
 * Why a portal: the navbar carries `backdrop-filter`, and any element with a
 * backdrop-filter/filter/transform becomes the containing block for its
 * `position: fixed` descendants. Modals rendered inside the header therefore
 * sized and centred against the 64px header strip instead of the viewport --
 * the dialog appeared clipped off the top of the screen with the dim overlay
 * covering only the navbar. Rendering into document.body escapes that.
 *
 * Also provides the behaviour every dialog here was missing: Escape to close,
 * backdrop click to close, background scroll lock, and initial focus.
 */
const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconClass = "bg-primary/10 text-primary",
  size = "md",
  footer = null,
  children,
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock background scroll while the dialog is up.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog so keyboard users land in the right place.
    const focusTarget = cardRef.current?.querySelector(
      "input:not([type=hidden]), textarea, select, button"
    );
    focusTarget?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto
        bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        // Only dismiss on a genuine backdrop press, not a drag out of the card.
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        className={`rise-in my-auto flex w-full ${SIZES[size] || SIZES.md} max-h-[calc(100dvh-2rem)]
          flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 elevated`}
      >
        {(title || Icon) && (
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${iconClass}`}>
                  <Icon className="size-4.5" />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold tracking-tight">{title}</h3>
                {subtitle && (
                  <p className="mt-0.5 truncate text-[11px] text-base-content/55">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-square shrink-0 rounded-lg"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-base-300 bg-base-200/50 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
