type SavedStyles = {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyPaddingRight: string;
  scrollY: number;
};

let lockCount = 0;
let saved: SavedStyles | null = null;

/** Reference-counted body scroll lock for overlays / drawers. */
export function lockDocumentScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    saved = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyPaddingRight: document.body.style.paddingRight,
      scrollY,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;

  return () => {
    if (lockCount <= 0) return;
    lockCount -= 1;
    if (lockCount !== 0 || !saved) return;

    const { scrollY, ...styles } = saved;
    document.documentElement.style.overflow = styles.htmlOverflow;
    document.body.style.overflow = styles.bodyOverflow;
    document.body.style.position = styles.bodyPosition;
    document.body.style.top = styles.bodyTop;
    document.body.style.left = styles.bodyLeft;
    document.body.style.right = styles.bodyRight;
    document.body.style.width = styles.bodyWidth;
    document.body.style.paddingRight = styles.bodyPaddingRight;
    window.scrollTo(0, scrollY);
    saved = null;
  };
}
