'use client';
// src/components/_internal/NexenInspector.tsx
// Maintained by the CodeBenders IDE. Overwritten by the "Patch inspector"
// action when the wire protocol bumps. Do not edit by hand.
import { useEffect } from 'react';

type ElementInfo = {
  locatorId: string;
  componentName: string;
  // Stable per-element marker (data-nexen-id) stamped by the IDE preflight.
  // When present the backend resolves the click EXACTLY; '' → heuristic.
  nexenId: string;
  bbox: { x: number; y: number; width: number; height: number };
  classList: string[];
  computedStyle: Record<string, string>;
  innerText: string;
  tag: string;
  // v26: where the element comes from when there is no React fiber to ask.
  // Vue, Svelte and Angular each leave their own trail in a dev build; these
  // carry it, so a click on a Vue page names its .vue file instead of arriving
  // as a bare <p> the agent can only grep the text of.
  framework?: string;
  sourceFile?: string;
  components?: string[];
  // Ancestors as selectors, nearest first: div.article-preview > a.preview-link.
  // A classless <p> is found by the classes around it.
  ancestry?: string[];
  // How many look-alike siblings the element (or a near ancestor) has. Above
  // one, the text is almost certainly rendered from data, not written in source.
  repeated?: number;
};

const PROBE_STYLE_KEYS = [
  'color', 'backgroundColor', 'borderColor', 'borderRadius',
  'padding', 'margin', 'fontSize', 'fontWeight', 'fontFamily',
  'lineHeight', 'display', 'flexDirection', 'justifyContent',
  'alignItems',
] as const;

function getFiber(el: Element): any | null {
  for (const k of Object.keys(el)) {
    if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) {
      return (el as any)[k];
    }
  }
  return null;
}

function pickSourceFrom(fiber: any): string {
  if (!fiber) return '';
  const candidates = [
    fiber._debugSource,
    fiber._source,
    fiber.__source,
    fiber.memoizedProps && fiber.memoizedProps.__source,
    fiber.pendingProps && fiber.pendingProps.__source,
    fiber.alternate && fiber.alternate._debugSource,
  ];
  for (const src of candidates) {
    if (src && typeof src.fileName === 'string') {
      const line = src.lineNumber ?? 1;
      const col = src.columnNumber ?? 0;
      return `${src.fileName}:${line}:${col}`;
    }
  }
  return '';
}

// Coerce React's varied source-stack carriers into a single newline-joined
// string of frames we can regex. React 18.3+/19 sets `_debugStack` and
// `_debugTask` to Error-like objects (`new Error()`) so the actual frames
// live on `.stack`. Some Task implementations are functions returning a
// string. Some are plain objects with a `frames` array.
function stackToString(stack: unknown): string {
  if (!stack) return '';
  if (typeof stack === 'string') return stack;
  if (typeof stack === 'function') {
    try { return stackToString((stack as () => unknown)()); } catch { return ''; }
  }
  if (typeof stack === 'object') {
    const obj = stack as any;
    if (typeof obj.stack === 'string') return obj.stack;
    if (typeof obj.stack === 'function') {
      try { return stackToString(obj.stack()); } catch { /* fall through */ }
    }
    if (Array.isArray(obj.frames)) {
      try {
        return obj.frames
          .map((f: any) => `    at ${f.functionName || ''} (${f.fileName || f.url || ''}:${f.lineNumber}:${f.columnNumber})`)
          .join('\n');
      } catch { /* fall through */ }
    }
    if (Array.isArray(obj)) {
      try { return obj.join('\n'); } catch { return ''; }
    }
  }
  return '';
}

// React 18.3 / 19 ship an "owner stack" — Error-like objects whose
// `.stack` looks like:
//   "Error\n    at AdminDashboardPage (webpack-internal:///(...)/src/app/admin/page.tsx:42:5)\n..."
// Parse out the first frame whose path is user code (not node_modules,
// not React internals). The fileName may be prefixed with
// `webpack-internal:///` or similar; strip the URL scheme so the backend
// sees a normal absolute / repo-relative path.
// A path is "user source" only if it lives under a typical project
// source root AND ends in a source extension. Reject anything that
// looks like compiled output (turbopack chunks, webpack bundles,
// Next.js's .next dir, react-dom internals). We're permissive about
// the SCHEME (webpack-internal://, file://, plain abs path) but
// strict about the PATH SHAPE.
function _looksLikeUserSource(path: string): boolean {
  if (!path) return false;
  // Compiled output / framework internals — always reject.
  if (/node_modules/.test(path)) return false;
  if (/\/_next\//.test(path)) return false;          // Next.js build output
  if (/\/\.next\//.test(path)) return false;
  if (/\/static\/chunks\//.test(path)) return false;
  if (/turbopack-/.test(path)) return false;       // turbopack chunk basenames
  if (/\/next\/dist\//.test(path)) return false;
  if (/\/react(?:-dom)?\//.test(path)) return false;
  // Must end in a source extension. Reject .js — almost always compiled
  // output in modern Next/Vite projects, and the false-negative rate on
  // legit user .js files is acceptably low (most users write .tsx/.jsx).
  if (!/\.(?:tsx|jsx|ts)$/.test(path)) return false;
  return true;
}

function parseSourceFromOwnerStack(stack: unknown): string {
  const s = stackToString(stack);
  if (!s) return '';
  // Match "at <Component> (<path>:<line>:<col>)". We capture the path,
  // run it through _looksLikeUserSource(), and skip any match that's
  // a compiled chunk URL (turbopack /_next/static/chunks/*, webpack
  // bundles, etc). On turbopack-built apps the fiber stack often points
  // ONLY at compiled chunks, in which case we return empty and the
  // caller falls back to the nexen-anchor scheme.
  const re = /\(?((?:webpack-internal:\/{2,3}[^()]*?)?[\/][^():\s]+?\.(?:tsx|jsx|ts|js)):(\d+):(\d+)\)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    let path = m[1];
    // Strip URL scheme and webpack group prefix BEFORE checking shape.
    path = path
      .replace(/^webpack-internal:\/{2,3}/, '')
      .replace(/^turbopack:\/{2,3}\[project\]\/?/, '')
      .replace(/^\([^)]*\)\/+/, '')
      .replace(/^(?:\/+\.{1,2}\/+)+/, '')
      .replace(/^\.{1,2}\/+/, '');
    path = path.replace(/\/\.\//g, '/');
    if (!_looksLikeUserSource(path)) continue;
    return `${path}:${m[2]}:${m[3]}`;
  }
  return '';
}

function readSourceLocator(el: Element): string {
  let fiber: any = getFiber(el);
  let depth = 0;
  const diag: any[] = [];
  while (fiber && depth < 60) {
    const hit = pickSourceFrom(fiber);
    if (hit) return hit;
    // _debugStack / _debugTask are the React 18.3+ replacements for
    // _debugSource. Try both at the fiber AND its owner.
    const stackHit = parseSourceFromOwnerStack(fiber._debugStack)
      || parseSourceFromOwnerStack(fiber._debugTask);
    if (stackHit) return stackHit;
    let owner = fiber._debugOwner;
    let ownerDepth = 0;
    while (owner && ownerDepth < 10) {
      const ownerHit = pickSourceFrom(owner);
      if (ownerHit) return ownerHit;
      const ownerStackHit = parseSourceFromOwnerStack(owner._debugStack)
        || parseSourceFromOwnerStack(owner._debugTask);
      if (ownerStackHit) return ownerStackHit;
      owner = owner._debugOwner;
      ownerDepth++;
    }
    // First few fibers: snapshot the actual key list + the values of
    // any source-related fields. Lets us see in the console what's
    // ACTUALLY populated so we know which field to read.
    if (depth < 5) {
      const allKeys = Object.keys(fiber);
      const sourceyKeys = allKeys.filter(k =>
        k.startsWith('_') || /source|debug|loc|line|file/i.test(k)
      );
      const sourceyValues: Record<string, any> = {};
      for (const k of sourceyKeys) {
        const v = fiber[k];
        if (v == null) {
          sourceyValues[k] = v;
        } else if (typeof v === 'object') {
          // Print a flat summary so it's readable in the console without
          // having to expand. Slice strings so we don't dump 10kB stacks.
          try {
            const flat: Record<string, any> = {};
            for (const ik of Object.keys(v).slice(0, 8)) {
              const iv = (v as any)[ik];
              flat[ik] = typeof iv === 'string' ? iv.slice(0, 120)
                : typeof iv === 'object' ? '[obj]' : iv;
            }
            sourceyValues[k] = flat;
          } catch {
            sourceyValues[k] = '[unreadable]';
          }
        } else if (typeof v === 'string') {
          sourceyValues[k] = v.slice(0, 200);
        } else if (typeof v === 'function') {
          // Maybe the value is a lazy getter; try calling it.
          try {
            const r = v();
            sourceyValues[k] = typeof r === 'string' ? r.slice(0, 200) : r;
          } catch {
            sourceyValues[k] = '[fn]';
          }
        } else {
          sourceyValues[k] = v;
        }
      }
      diag.push({
        depth,
        typeName: typeof fiber.type === 'function' ? (fiber.type.name || 'anon-fn') : String(fiber.type),
        sourceyKeys: sourceyKeys.join(','),
        sourceyValues,
      });
    }
    fiber = fiber.return;
    depth++;
  }
  // One line, and only when there is nothing ELSE to fall back on.
  //
  // React 19 strips `_debugSource`, so on this stack the walk finds nothing on
  // EVERY click — the expected path, previously reported as a failure with six
  // console lines and a stack trace each. In a log being read to debug something
  // else it was the single largest source of noise.
  //
  // It is still worth saying when the element ALSO carries no stamped
  // `data-nexen-id`: that combination is the one where resolution has nothing
  // exact to work with and falls back to guessing.
  if (diag.length > 0) {
    const stamped = el instanceof Element ? el.closest('[data-nexen-id]') : null;
    if (!stamped) {
      console.warn(
        `[NexenInspector] no source coords AND no stamped id (walked ${diag.length} fiber(s)) — ` +
        'this click will be resolved by heuristic. Re-boot the preview to stamp the app.',
      );
    }
  }
  return '';
}

function findComponentRoot(el: Element | null): HTMLElement | null {
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    if (cur instanceof HTMLElement && cur.dataset.nexenComponent) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

// Find the nearest `data-nexen-component` anchor walking UP from `el`.
// We rely on these wrappers being on every generated page (the generator
// stamps them on top-level routes + major sections), so this is a stable
// way to identify "the component the user clicked inside" without needing
// per-JSX-element source data.
function findNexenComponentAnchor(el: Element | null): { name: string; node: HTMLElement } | null {
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    if (cur instanceof HTMLElement && cur.dataset.nexenComponent) {
      return { name: cur.dataset.nexenComponent, node: cur };
    }
    cur = cur.parentElement;
  }
  return null;
}

// Build the locator the backend understands. Two-shape locator:
//   "nexen:<ComponentName>@<file.tsx>"
//     → backend greps for data-nexen-component="<ComponentName>" in the
//       file, applies the rewrite at that JSX opening tag. Robust against
//       bundle-coord vs source-coord drift in React 19 / Next 15.
//   "<file>:<line>:<col>"
//     → legacy file:line:col, used when we have reliable source coords
//       (older React / Babel + LocatorJS apps).
//
// We prefer the nexen-anchor form when a data-nexen-component ancestor
// exists, falling back to file:line:col only if there's no anchor (rare).
function buildLocator(el: HTMLElement): string {
  const anchor = findNexenComponentAnchor(el);
  const sourceCoord = readSourceLocator(el);
  if (anchor) {
    // Pull the file part out of the source coord. Only use it if it
    // looks like a real user-source path — on turbopack builds the
    // fiber stack sometimes points at compiled chunk URLs like
    // `/_next/static/chunks/turbopack-XXX.js`, which the backend would
    // (correctly) reject as "locator file escapes output_dir".
    const file = sourceCoord.replace(/:(\d+):(\d+)$/, '');
    if (file && _looksLikeUserSource(file)) {
      return `nexen:${anchor.name}@${file}`;
    }
    // No reliable file — send the anchor without one. Backend resolves
    // by greping the workspace for `data-nexen-component="Name"`.
    return `nexen:${anchor.name}`;
  }
  if (sourceCoord) return sourceCoord;
  // No component anchor AND no usable source coord — the common case on Vite /
  // React 19 (no `data-nexen-component` on pages, no `_debugSource`). Fall back
  // to the nearest stamped `data-nexen-id`: a NON-EMPTY locator so the IDE + backend
  // don't abort on "empty locator", and the backend resolves it EXACTLY by greping
  // the marker. Returns '' only when there's genuinely nothing to key on.
  const idEl = el.closest('[data-nexen-id]');
  const nid = idEl instanceof HTMLElement ? idEl.dataset.nexenId : '';
  if (nid) return `nexen-id:${nid}`;
  return '';
}

// ---- v26: framework trails -----------------------------------------------
// Each framework's dev build leaves a different mark on the DOM. None of them
// is an API and any of them can be absent, so every read is guarded and a miss
// just means one fewer hint.
function _projectRelative(file: string): string {
  const f = String(file || '').split('?')[0];
  if (!f) return '';
  const at = f.lastIndexOf('/src/');
  if (at >= 0) return f.slice(at + 1);
  return f.replace(/^\/+/, '');
}

function _customTags(el: Element): string[] {
  const out: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.body && out.length < 4) {
    const tag = cur.tagName.toLowerCase();
    if (tag.indexOf('-') > 0 && out.indexOf(tag) < 0) out.push(tag);
    cur = cur.parentElement;
  }
  return out;
}

function readFrameworkHints(el: Element): { framework: string; sourceFile: string; components: string[] } {
  const names: string[] = [];
  const push = (n: any) => { if (typeof n === 'string' && n && names.indexOf(n) < 0 && names.length < 4) names.push(n); };
  try {
    // Vue 3: every element knows the component instance that rendered it, and a
    // dev build's component type carries the .vue file it was compiled from.
    let v: any = (el as any).__vueParentComponent;
    if (!v) {
      let up: Element | null = el.parentElement;
      while (up && !v) { v = (up as any).__vueParentComponent; up = up.parentElement; }
    }
    if (v) {
      let file = '';
      let depth = 0;
      while (v && depth < 8) {
        const t = v.type || {};
        // Only the project's own components: a library one (RouterLink) has
        // no __file, and naming it first sends the agent into node_modules.
        const own = typeof t.__file === 'string' && t.__file.indexOf('node_modules') < 0;
        if (own && !file) file = t.__file;
        if (own) push(t.__name || t.name || t.__file.split('/').pop().replace('.vue', ''));
        v = v.parent;
        depth++;
      }
      return { framework: 'vue', sourceFile: _projectRelative(file), components: names };
    }
    // Vue 2: the instance hangs off its root element only, so walk up to it.
    let cur: Element | null = el;
    while (cur) {
      const vm: any = (cur as any).__vue__;
      if (vm) {
        let file = '';
        let inst = vm;
        let depth = 0;
        while (inst && depth < 8) {
          const o = inst.$options || {};
          const own = typeof o.__file === 'string' && o.__file.indexOf('node_modules') < 0;
          if (own && !file) file = o.__file;
          if (own) push(o.name || o._componentTag);
          inst = inst.$parent;
          depth++;
        }
        return { framework: 'vue', sourceFile: _projectRelative(file), components: names };
      }
      cur = cur.parentElement;
    }
    // Svelte (4 and 5, dev): the element records the file and line it came from.
    cur = el;
    while (cur) {
      const meta: any = (cur as any).__svelte_meta;
      if (meta && meta.loc && typeof meta.loc.file === 'string') {
        const file = _projectRelative(meta.loc.file);
        const line = typeof meta.loc.line === 'number' ? meta.loc.line + 1 : 0;
        return { framework: 'svelte', sourceFile: line ? file + ':' + line : file, components: names };
      }
      cur = cur.parentElement;
    }
    // Angular (dev): the global debugging API names the owning component, and
    // its host tag is the selector the component file declares -- greppable.
    const ng: any = (window as any).ng;
    if (ng && typeof ng.getOwningComponent === 'function') {
      const owner = ng.getOwningComponent(el);
      if (owner && owner.constructor) push(String(owner.constructor.name || '').replace(/^_+/, ''));
      for (const t of _customTags(el)) push(t);
      return { framework: 'angular', sourceFile: '', components: names };
    }
  } catch { /* a hint, never a failure */ }
  for (const t of _customTags(el)) push(t);
  return { framework: '', sourceFile: '', components: names };
}

function _selectorOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const cls = Array.from(el.classList).filter(c => c.indexOf(':') < 0).slice(0, 2);
  const id = el.id && el.id.length < 40 ? '#' + el.id : '';
  return tag + id + (cls.length ? '.' + cls.join('.') : '');
}

function readAncestry(el: Element): string[] {
  const out: string[] = [];
  let cur: Element | null = el.parentElement;
  while (cur && cur !== document.body && cur !== document.documentElement && out.length < 4) {
    const sel = _selectorOf(cur);
    // A bare <div> says nothing a reader could search for; skip it.
    if (sel !== cur.tagName.toLowerCase() || sel.indexOf('-') > 0) out.push(sel);
    cur = cur.parentElement;
  }
  return out;
}

function readRepeated(el: Element): number {
  let cur: Element | null = el;
  for (let depth = 0; cur && cur.parentElement && depth < 6; depth++) {
    const sig = cur.tagName + '|' + cur.className;
    let n = 0;
    for (const sib of Array.from(cur.parentElement.children)) {
      if (sib.tagName + '|' + sib.className === sig) n++;
    }
    if (n > 1) return n;
    cur = cur.parentElement;
  }
  return 1;
}

function describe(el: HTMLElement): ElementInfo {
  const rect = el.getBoundingClientRect();
  const computed = window.getComputedStyle(el);
  const computedStyle: Record<string, string> = {};
  for (const k of PROBE_STYLE_KEYS) computedStyle[k] = computed.getPropertyValue(k);
  // Nearest stamped ancestor (the clicked node is often a text/icon child of
  // the stamped element). '' when the app hasn't been stamped yet.
  const idEl = el.closest('[data-nexen-id]') as HTMLElement | null;
  const hints = readFrameworkHints(el);
  return {
    locatorId: buildLocator(el),
    componentName: el.dataset.nexenComponent ?? '',
    nexenId: idEl?.dataset.nexenId ?? '',
    bbox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    classList: Array.from(el.classList),
    computedStyle,
    innerText: (el.innerText ?? '').slice(0, 80),
    tag: el.tagName.toLowerCase(),
    framework: hints.framework,
    sourceFile: hints.sourceFile,
    components: hints.components,
    ancestry: readAncestry(el),
    repeated: readRepeated(el),
  };
}

// One-off style block: inserts the CSS keyframes used by the selected-
// outline marching-ants animation and the pending pulse. Idempotent —
// the inspector mounts at most once per page, but a re-mount would still
// be safe because we keyed it by id.
function ensureStyles() {
  if (document.getElementById('nexen-inspector-style')) return;
  const style = document.createElement('style');
  style.id = 'nexen-inspector-style';
  style.textContent = [
    '@keyframes nexen-marching-ants {',
    '  to { background-position: 24px 0, -24px 100%, 0 -24px, 100% 24px; }',
    '}',
    '@keyframes nexen-pulse {',
    '  0%, 100% { opacity: 1; transform: scale(1); }',
    '  50% { opacity: 0.55; transform: scale(1.18); }',
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

// Where the overlays live: the <html> element, not <body>. An app can own its
// body outright -- Angular with selector: 'body' does, as the echoes-player
// demo showed -- and rendering into it clears whatever else is there, which
// took the overlays with it: edit mode was on and nothing was ever drawn. No
// framework renders into <html> itself.
function overlayRoot(): HTMLElement {
  return document.documentElement;
}

function makeHoverOutline(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed', 'pointer-events:none', 'z-index:2147483646',
    'border:2px solid #2563eb', 'border-radius:4px',
    // Slight tint so the user sees the hovered region as a "highlight",
    // not just an outlined empty box. Low alpha keeps the underlying
    // content readable.
    'background:rgba(37, 99, 235, 0.08)',
    'transition:left 80ms ease, top 80ms ease, width 80ms ease, height 80ms ease',
    'display:none', 'box-sizing:border-box',
  ].join(';');
  overlayRoot().appendChild(div);
  return div;
}

function makeSelectedOutline(): HTMLDivElement {
  const div = document.createElement('div');
  // Marching-ants effect via background-image gradients on each side.
  // 4 linear-gradients form the border; `background-position` is
  // animated to give the dashes a perpetual "scrolling" motion. Pure
  // CSS, no JS tick.
  div.style.cssText = [
    'position:fixed', 'pointer-events:none', 'z-index:2147483647',
    'border-radius:4px',
    'background:rgba(16, 185, 129, 0.06)',
    `background-image:
       linear-gradient(90deg, #10b981 50%, transparent 50%),
       linear-gradient(90deg, #10b981 50%, transparent 50%),
       linear-gradient(0deg, #10b981 50%, transparent 50%),
       linear-gradient(0deg, #10b981 50%, transparent 50%)`,
    'background-repeat:repeat-x, repeat-x, repeat-y, repeat-y',
    'background-size:12px 2px, 12px 2px, 2px 12px, 2px 12px',
    'background-position:0 0, 0 100%, 0 0, 100% 0',
    'animation:nexen-marching-ants 600ms linear infinite',
    'display:none', 'box-sizing:border-box',
  ].join(';');
  overlayRoot().appendChild(div);
  return div;
}

// Pulsing dot pinned to the selected outline's top-right while an edit
// is in flight. Tells the user "your last click is still saving, hold
// on" without blocking the iframe.
function makePendingBadge(): HTMLDivElement {
  const div = document.createElement('div');
  div.style.cssText = [
    'position:fixed', 'pointer-events:none', 'z-index:2147483647',
    'width:10px', 'height:10px', 'border-radius:50%',
    'background:#f59e0b', 'box-shadow:0 0 0 2px rgba(245, 158, 11, 0.35)',
    'animation:nexen-pulse 900ms ease-in-out infinite',
    'display:none',
  ].join(';');
  overlayRoot().appendChild(div);
  return div;
}

export const NEXEN_INSPECTOR_VERSION = 27;

export function NexenInspector(): null {
  useEffect(() => {
    // Decide whether the element inspector should go live. TWO independent
    // signals, EITHER of which activates it:
    //
    //   1. A build-time flag the IDE-managed dev server sets
    //      (NEXT_PUBLIC_NEXEN_INSPECT / VITE_NEXEN_INSPECT, or the legacy
    //      MOCK_MODE pair). CRITICAL: Next.js only inlines *statically
    //      written* `process.env.NEXT_PUBLIC_FOO`. A dynamic
    //      `process.env['NEXT_PUBLIC_' + name]` is NOT replaced by the
    //      webpack DefinePlugin and reads `undefined` in the browser — so
    //      each key MUST be spelled out literally below. (v16 used the
    //      dynamic form → the flag was always false → click-to-edit was
    //      silently dead on every Next.js app.) Each read is wrapped because
    //      bare `process` throws in a Vite/browser bundle.
    //
    //   2. The app is embedded in a parent frame (the IDE guide panel drives
    //      edit mode over postMessage). This makes click-to-edit work even
    //      when the dev server was started manually WITHOUT the env flag.
    //      A top-level production app has `parent === window`, so this stays
    //      false there and the inspector never activates in prod.
    const readEnv = (): boolean => {
      try {
        // Read via globalThis: a BARE `process` identifier is a TypeScript error
        // (TS2591) in any project without @types/node — which is every Vite/Vue/
        // Angular app — and that single error fails `tsc --noEmit` for the whole
        // project. Next.js only tolerated it because it ships @types/node.
        const penv = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env;
        if (penv && (penv.NEXT_PUBLIC_NEXEN_INSPECT === 'true' || penv.NEXT_PUBLIC_MOCK_MODE === 'true')) return true;
      } catch (e) { /* no process */ }
      try {
        const ime = (import.meta as unknown as { env?: Record<string, string> }).env;
        if (ime && (ime.VITE_NEXEN_INSPECT === 'true' || ime.VITE_MOCK_MODE === 'true')) return true;
      } catch (e) { /* no import.meta.env */ }
      return false;
    };
    let embedded = false;
    try { embedded = !!window.parent && window.parent !== window; } catch (e) { embedded = false; }
    if (!readEnv() && !embedded) return;
    // One inspector per document. A project the guide built carries its own copy
    // in its source AND is served one by the preview proxy, which splices a
    // script tag into every HTML response. Two running means two overlays and
    // two postMessages per click, which the parent reads as a double selection.
    // Set synchronously, before anything else, so two copies racing on the same
    // tick cannot both pass.
    const runtime = window as unknown as { __NEXEN_INSPECTOR_ACTIVE__?: number };
    if (typeof runtime.__NEXEN_INSPECTOR_ACTIVE__ === 'number') return;
    runtime.__NEXEN_INSPECTOR_ACTIVE__ = NEXEN_INSPECTOR_VERSION;
    try {
      (document.documentElement as HTMLElement).dataset.nexenInspectorVersion = String(NEXEN_INSPECTOR_VERSION);
    } catch {}
    ensureStyles();
    const hoverOutline = makeHoverOutline();
    const selectedOutline = makeSelectedOutline();
    const pendingBadge = makePendingBadge();
    let selectedEl: HTMLElement | null = null;
    let editModeEnabled = false;
    // HTML-element granularity is the default and only mode. Component-snap
    // selected the nearest component boundary, so a click on a button targeted
    // the whole card and the edit rewrote far more than was pointed at.
    let fineGrained = true;
    // Restore edit-mode + fine-grained across iframe reloads (a successful
    // edit hard-reloads the iframe, which reset these to false → HTML-element
    // mode silently reverted to component mode). sessionStorage is per-origin
    // and survives the reload, so the mode sticks without a parent re-push.
    try {
      editModeEnabled = sessionStorage.getItem('nexen:editMode') === 'true';
      // Compared against 'false' (not 'true') so an ABSENT key means ON — the
      // new default — while an explicitly-stored false from an older session
      // is still honoured.
      fineGrained = sessionStorage.getItem('nexen:fineGrained') !== 'false';
    } catch (e) { /* storage blocked — fall back to defaults */ }
    // When the parent fires `nexen:edit-pending`, we block further clicks
    // until `nexen:edit-done` arrives. Prevents racing requests from
    // queueing identical-locator edits before the first one persists.
    let editPending = false;
    // The sign-in this page started with: "View as" reloads only a page that is not on it yet.
    let bootToken = '';
    try { bootToken = localStorage.getItem('auth_token') || ''; } catch (e) {}
    // Who this page is signed in as, for the toolbar's View as (it forgets on a reload; the
    // app keeps its sign-in). Asked of the app's own session route; '' when signed out.
    // Signing in and saying who is signed in are for OUR preview only: the dev server's
    // inspect flag, or the router's tag (data-nexen-preview). Not merely being framed -- a
    // published app that keeps this file can be framed by any site, which could then read
    // who is signed in or sign the visitor in as someone else.
    const isPreview = (): boolean => {
      if (readEnv()) return true;
      try { return !!document.querySelector('script[data-nexen-preview]'); } catch (e) { return false; }
    };
    function postWhoami() {
      if (!isPreview()) return;
      const reply = (email: string) => {
        try { window.parent.postMessage({ type: 'nexen:whoami', email: email }, '*'); } catch (e) {}
      };
      if (!bootToken) { reply(''); return; }
      // Only a clear answer: a 401 is signed out; anything unreadable (an app whose API is
      // elsewhere answers its own index.html) says nothing, so the toolbar keeps its role.
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + bootToken } })
        .then((r) => (r.status === 401 ? { signedOut: true } : r.ok ? r.json() : null))
        .then((b) => {
          if (!b) return;
          if (b.signedOut) { reply(''); return; }
          // { user }, { data: { user } }, { data: user } or the user itself.
          const u = b.user || (b.data && (b.data.user || b.data)) || b;
          if (u && u.email) reply(String(u.email));
        })
        .catch(() => { /* unknown: keep what the toolbar shows */ });
    }

    function paint(outline: HTMLDivElement, el: HTMLElement | null) {
      // Put back if something removed it: an app that rewrites the document
      // must not be able to switch the inspector off without anyone knowing.
      if (!outline.isConnected) { overlayRoot().appendChild(outline); }
      if (!el) { outline.style.display = 'none'; return; }
      const r = el.getBoundingClientRect();
      outline.style.display = 'block';
      outline.style.left = `${r.left}px`;
      outline.style.top = `${r.top}px`;
      outline.style.width = `${r.width}px`;
      outline.style.height = `${r.height}px`;
    }

    function paintPendingBadge() {
      if (!editPending || !selectedEl) {
        pendingBadge.style.display = 'none';
        return;
      }
      const r = selectedEl.getBoundingClientRect();
      pendingBadge.style.display = 'block';
      pendingBadge.style.left = `${r.right - 16}px`;
      pendingBadge.style.top = `${r.top + 6}px`;
    }

    function resolveTarget(el: Element | null): HTMLElement | null {
      if (!el) return null;
      if (el === hoverOutline || el === selectedOutline || el === pendingBadge) return null;
      if (fineGrained) {
        return el instanceof HTMLElement ? el : null;
      }
      // Component mode: snap to nearest data-nexen-component. If the app
      // doesn't tag any element (rare — pages are usually tagged), fall
      // back to the raw element so hover still shows SOMETHING and the
      // user can see the inspector is alive.
      return findComponentRoot(el) ?? (el instanceof HTMLElement ? el : null);
    }

    function onMove(e: MouseEvent) {
      if (!editModeEnabled) return;
      paint(hoverOutline, resolveTarget(e.target as Element | null));
    }
    function onClick(e: MouseEvent) {
      if (!editModeEnabled) return;
      if (editPending) {
        // Last edit still in flight — swallow the click so the user
        // can't fire a second request mid-save.
        e.preventDefault();
        e.stopPropagation();
        console.warn('[NexenInspector] click ignored — previous edit still pending');
        return;
      }
      const raw = e.target as Element | null;
      const target = resolveTarget(raw);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      selectedEl = target;
      paint(selectedOutline, target);
      paintPendingBadge();
      const info = describe(target);
      console.log('[NexenInspector] click', {
        fineGrained,
        rawTag: raw ? (raw as HTMLElement).tagName : null,
        resolvedTag: target.tagName,
        resolvedLocatorId: info.locatorId || '(empty)',
        // Fall back to the name carried in the locator. Reporting an empty
        // component while resolvedLocatorId said nexen:nx_app_page claimed none had
        // been found when one plainly had, which made a dense log misleading.
        // (No backticks in this file: it is one big template literal.)
        resolvedComponent: info.componentName
          || (/^nexen:([A-Za-z_][A-Za-z0-9_]*)/.exec(info.locatorId ?? '')?.[1] ?? '(empty)'),
      });
      if (!info.locatorId) {
        console.warn(
          '[NexenInspector] no React fiber _debugSource for this element. ' +
          'The dev server is probably running with JSX source-locations disabled. ' +
          'For Next.js, dev mode emits __source by default; verify the app is in dev (not prod) build.',
        );
      }
      window.parent.postMessage(
        { type: 'nexen:element-selected', payload: info },
        '*',
      );
    }
    // If the selected node was removed from the DOM (HMR swapped the component
    // subtree after an edit / file save), the selection + its outline are stale
    // and point at a detached node — a subsequent edit would target the wrong
    // element. Detect that and deselect, notifying the parent so its panel and
    // overlay clear too. Returns true when it deselected.
    function deselectIfStale() {
      if (selectedEl && !selectedEl.isConnected) {
        selectedEl = null;
        paint(selectedOutline, null);
        editPending = false;
        paintPendingBadge();
        try { window.parent.postMessage({ type: 'nexen:element-deselected' }, '*'); } catch (e) {}
        return true;
      }
      return false;
    }
    function onScrollOrResize() {
      if (deselectIfStale()) return;
      paint(selectedOutline, selectedEl);
      paintPendingBadge();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        selectedEl = null;
        paint(selectedOutline, null);
        paintPendingBadge();
        window.parent.postMessage({ type: 'nexen:element-deselected' }, '*');
      }
    }
    function onParentMessage(e: MessageEvent) {
      // Only the window that embedded us may drive the inspector.
      //
      // Until the preview was served from a container this was same-origin, so
      // the only reachable poster WAS the guide's webview. Cross-origin that is
      // no longer true: a generated app can embed third-party content, and any
      // frame with a handle to this window could post nexen:reload to force
      // reloads, or nexen:apply-style-preview to inject styles into the page
      // the user is reviewing. (No backticks in this comment: it sits INSIDE
      // the template literal that carries the inspector, and one would end it.)
      //
      // Checked by SOURCE IDENTITY rather than origin string, because the
      // parent's origin is the IDE webview's (a vscode-webview:// URL that
      // varies per session) and pinning it would break the local path. This is
      // the same guard the receiving side already applies -- see
      // isTrustedPreviewMessage in the webview.
      if (e.source !== window.parent) { return; }
      const data = e.data as { type?: string; style?: Record<string, string>; enabled?: boolean; token?: string };
      if (data?.type === 'nexen:set-edit-mode') {
        editModeEnabled = !!data.enabled;
        try { sessionStorage.setItem('nexen:editMode', String(editModeEnabled)); } catch (e) {}
        if (!editModeEnabled) {
          paint(hoverOutline, null);
          paint(selectedOutline, null);
          selectedEl = null;
          editPending = false;
          paintPendingBadge();
        }
        return;
      }
      if (data?.type === 'nexen:set-fine-grained') {
        fineGrained = !!data.enabled;
        try { sessionStorage.setItem('nexen:fineGrained', String(fineGrained)); } catch (e) {}
        paint(hoverOutline, null);
        paint(selectedOutline, null);
        selectedEl = null;
        editPending = false;
        paintPendingBadge();
        return;
      }
      if (data?.type === 'nexen:edit-pending') {
        editPending = true;
        paintPendingBadge();
        return;
      }
      if (data?.type === 'nexen:edit-done') {
        editPending = false;
        paintPendingBadge();
        return;
      }
      if (data?.type === 'nexen:request-whoami') {
        postWhoami();
        return;
      }
      if (data?.type === 'nexen:request-version') {
        window.parent.postMessage(
          { type: 'nexen:inspector-version', version: NEXEN_INSPECTOR_VERSION },
          '*',
        );
        return;
      }
      if (data?.type === 'nexen:sign-in') {
        // View as, from the preview toolbar: the host signed in as that role's seeded
        // account, and the app's client sends whatever token it keeps under auth_token.
        // Compared with the token this PAGE started with, not the stored one: a page that
        // loaded before another frame stored it is still signed out. "applied" tells the
        // toolbar to stop resending; otherwise this page stores it and reloads.
        if (!isPreview()) return;
        const token = String(data.token || '');
        let stored = '';
        try { stored = localStorage.getItem('auth_token') || ''; } catch (e) {}
        // On it already only when the page started with it AND it is still stored (signing
        // out inside the app clears it without a reload).
        let applied = !token || (token === bootToken && token === stored);
        if (!applied) {
          try { localStorage.setItem('auth_token', token); stored = localStorage.getItem('auth_token') || ''; } catch (e) {}
          // Storage blocked: a reload would start without it again, and reload forever.
          if (stored !== token) applied = true;
        }
        try { window.parent.postMessage({ type: 'nexen:signed-in', applied }, '*'); } catch (e) {}
        if (!applied) {
          try { window.location.reload(); } catch (e) {}
        }
        return;
      }
      if (data?.type === 'nexen:reload') {
        // In-place reload after an element edit — reloads the iframe's CURRENT
        // document, so the SPA route the user is editing on is PRESERVED (a
        // cross-origin key-bump remount would snap back to the IDE's tracked
        // route and hide the edit). A full document reload re-fetches every
        // module fresh from the dev server (re-transformed from disk), so the
        // just-written edit always shows — the reflect that "just works" on Next
        // now works identically on Vite/Vue/Angular SPAs. We ACK first (with the
        // current path) so the parent can (a) keep its page rail in sync and
        // (b) cancel its fallback remount.
        try {
          window.parent.postMessage(
            { type: 'nexen:reloading', path: location.pathname + location.search },
            '*',
          );
        } catch (e) {}
        try { window.location.reload(); } catch (e) {}
        return;
      }
      if (data?.type === 'nexen:element-deselected') {
        selectedEl = null;
        paint(selectedOutline, null);
        editPending = false;
        paintPendingBadge();
        return;
      }
      if (data?.type === 'nexen:apply-style-preview' && selectedEl && data.style) {
        for (const [k, v] of Object.entries(data.style)) {
          selectedEl.style.setProperty(k, v);
        }
      }
      if (data?.type === 'nexen:clear-style-preview' && selectedEl) {
        selectedEl.removeAttribute('style');
      }
    }

    // Watch for DOM mutations (HMR replaces the selected component's nodes
    // WITHOUT a scroll/resize) and re-validate the selection immediately.
    let mutationObserver = null;
    try {
      mutationObserver = new MutationObserver(() => { deselectIfStale(); });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* MutationObserver unavailable — scroll/resize guard still covers it */ }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('keydown', onKey);
    window.addEventListener('message', onParentMessage);
    // Where we are, whenever it changes.
    //
    // The parent is CROSS-ORIGIN -- the preview is served from its own session
    // hostname -- so it cannot read this frame's location at all. Without this,
    // a screen rail beside the preview can navigate the app but can never show
    // which screen the app is actually on once the user clicks a link inside it.
    const postRoute = () => {
      try {
        window.parent.postMessage(
          { type: 'nexen:route', path: location.pathname + location.search },
          '*',
        );
      } catch {}
    };
    const origPush: any = history.pushState;
    const origReplace: any = history.replaceState;
    (history as any).pushState = function (this: History, ...a: any[]) {
      origPush.apply(this, a); postRoute();
    };
    (history as any).replaceState = function (this: History, ...a: any[]) {
      origReplace.apply(this, a); postRoute();
    };
    window.addEventListener('popstate', postRoute);
    try {
      window.parent.postMessage(
        { type: 'nexen:inspector-ready', version: NEXEN_INSPECTOR_VERSION },
        '*',
      );
      postRoute();
      postWhoami();
    } catch {}
    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('message', onParentMessage);
      window.removeEventListener('popstate', postRoute);
      (history as any).pushState = origPush;
      (history as any).replaceState = origReplace;
      delete runtime.__NEXEN_INSPECTOR_ACTIVE__;
      if (mutationObserver) mutationObserver.disconnect();
      hoverOutline.remove();
      selectedOutline.remove();
      pendingBadge.remove();
    };
  }, []);
  return null;
}

export default NexenInspector;
