// Loads liblouis (the standard open-source braille translation engine)
// in the browser and exposes Grade 1 / Grade 2 (UEB) translation.
//
// Files are served from public/liblouis/ (copied there by
// scripts/copy-liblouis.mjs). The app keeps working if loading fails:
// Grade 1 uses the built-in engine in braille.js.
import { useCallback, useEffect, useState } from "react";

const ROOT = `${import.meta.env.BASE_URL}liblouis/`;

// "unicode.dis" makes liblouis output Unicode braille characters.
export const TABLES = {
  1: "tables/unicode.dis,tables/en-ueb-g1.ctb",
  2: "tables/unicode.dis,tables/en-ueb-g2.ctb",
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(el);
  });
}

let loadPromise = null;

export function loadLiblouis() {
  if (!loadPromise) {
    loadPromise = (async () => {
      await loadScript(`${ROOT}capi.js`);
      await loadScript(`${ROOT}easy-api.js`);
      const lib = window.liblouis;
      if (!lib) throw new Error("liblouis scripts loaded but the liblouis object is missing.");
      lib.enableOnDemandTableLoading(`${ROOT}tables/`);
      // Self-check: if the tables can't be fetched this returns nothing.
      const probe = lib.translateString(TABLES[2], "the");
      if (!probe) {
        throw new Error(
          "liblouis loaded but Grade 2 tables could not be read. Check the Network tab for 404s under /liblouis/tables/."
        );
      }
      return lib;
    })();
    // Allow a retry after a failure.
    loadPromise.catch(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

// React hook. Pass enabled=true when the user first needs liblouis.
export function useLiblouis(enabled) {
  const [state, setState] = useState({ status: "idle", lib: null, error: null });

  useEffect(() => {
    if (!enabled || state.status !== "idle") return undefined;
    let cancelled = false;
    setState({ status: "loading", lib: null, error: null });
    loadLiblouis()
      .then((lib) => !cancelled && setState({ status: "ready", lib, error: null }))
      .catch((error) => !cancelled && setState({ status: "failed", lib: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const translate = useCallback(
    (grade, text) => (state.lib && text ? state.lib.translateString(TABLES[grade], text) || "" : ""),
    [state.lib]
  );
  const backTranslate = useCallback(
    (grade, braille) => (state.lib && braille ? state.lib.backTranslateString(TABLES[grade], braille) || "" : ""),
    [state.lib]
  );

  return { status: state.status, error: state.error, translate, backTranslate };
}
