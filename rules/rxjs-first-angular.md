# RxJS-First Angular (***SUPREME — every Angular project, every backend call***)

Every backend interaction in an Angular project lives as an **RxJS observable stream**, never as a one-shot promise. Polling is the floor; SSE/WebSockets are the ceiling. Signals only bridge at the template boundary via `toSignal()`. Calling `firstValueFrom()` to "just await the result" is the failure mode this rule kills.

Different from "use RxJS where it's natural" — this rule says **every HTTP/WS/SSE call is observable-shaped end-to-end**, so retry / debounce / multiplex / poll / cache-bust / cancel-on-route-leave / interleave-with-WS are all available without refactor.

## The principle
- HTTP / WebSocket / SSE / postMessage / IndexedDB queries → `Observable<T>`.
- Component state that derives from those streams → `Signal<T>` via `toSignal(stream$, { initialValue })`.
- Template reads the signal.
- The stream stays observable inside the service so it composes with `retry`, `debounceTime`, `switchMap`, `combineLatest`, `merge`, `share`, `takeUntilDestroyed`, `repeat`, `interval`.
- "Just a one-shot fetch" gets the same treatment — wrap it in a stream so adding polling / retry / cancel later is one operator, not a refactor.

## Why
- **Real-time by default** — even when the backend doesn't push, an observable lets the service `repeat({ delay: 5000 })` for polling without touching the consumer. The UI feels live; the contract didn't change.
- **Cancellation is free** — `takeUntilDestroyed()` kills inflight HTTP when the component unmounts. Promises leak; observables don't.
- **Retry is one operator** — `retry({ count: 3, delay: (err, n) => timer(2 ** n * 250) })` beats hand-rolled try/catch loops.
- **Multi-source compose** — when a feature needs HTTP + WebSocket + localStorage merged into one view (typical for the dashboard), observables compose; promises can't.
- **Search is debounced for free** — `valueChanges.pipe(debounceTime(200), switchMap(q => api.search(q)))` is the canonical pattern. With promises you wrote your own debounce.
- **HMR / dev-mode resilience** — observables survive route remounts cleanly; pending promises orphan.
- **Tests are deterministic** — `TestScheduler` + marble syntax beats `await flushMicrotasks()` for any time-based logic.

## The mandate (every service that talks to a backend)

### Do
- **HTTP** → `HttpClient` returns `Observable`. Keep it. NEVER `firstValueFrom(this.http.get(...))` inside the service.
- **WebSocket** → `webSocket()` from `rxjs/webSocket`, NOT a hand-rolled `new WebSocket()` with event listeners.
- **SSE** → `new EventSource(url)` wrapped via `fromEventSource()` (custom helper at `libs/util-rxjs/src/from-event-source.ts`) or `fromEvent(source, 'message')` for the simplest case.
- **Polling fallback** → when the backend doesn't expose SSE/WS, wrap the HTTP call: `source$ = http.get(url).pipe(repeat({ delay: 5000 }), shareReplay(1))`. Same observable, now polling.
- **Template binding** → `toSignal(source$, { initialValue: ... })` at the boundary. Component reads the signal.
- **Reactive forms** → `formControl.valueChanges` is already an observable. Pipe it through `debounceTime + distinctUntilChanged + switchMap`.
- **Compose** → when a feature needs sites + WS log tail + user signal, `combineLatest([sites$, logs$])` + signal at template.
- **Cancel** → `takeUntilDestroyed(this.destroyRef)` at the END of every observable chain that's not exposed as a service-level stream.
- **Retry** → `retry({ count: 3, delay: (err, attempt) => timer(Math.min(2 ** attempt * 250, 30_000)) })` on every HTTP call. Service-level helper at `libs/util-rxjs/src/retry-with-backoff.ts`.

### Don't
- ❌ `await firstValueFrom(this.api.foo())` inside an async function — you've thrown away every operator above.
- ❌ Convert observables to promises via `lastValueFrom()` "for simplicity" — there is no simplicity, only deferred refactor pain.
- ❌ Hand-roll `setInterval(() => this.refresh(), 5000)` in a component — that's polling without RxJS, no retry, no cancel, no compose.
- ❌ Subscribe in a component without `takeUntilDestroyed()` or `| async` pipe — leak.
- ❌ `effect(() => doHttp(this.someSignal()))` to drive HTTP from a signal — backwards. The HTTP is the source; the signal is the sink. Use `toObservable(signal$).pipe(switchMap(v => this.http.get(...)))` if you genuinely need a signal-driven trigger.
- ❌ Hand-rolled `Subject` for one-direction service streams — use `BehaviorSubject` only when there's a meaningful initial value, otherwise use `share({ connector: () => new ReplaySubject(1) })` on the source.

## Canonical service shape

```ts
import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { webSocket } from 'rxjs/webSocket';
import { fromEvent, merge, of, timer } from 'rxjs';
import {
  switchMap,
  retry,
  share,
  startWith,
  catchError,
  repeat,
  scan,
  shareReplay,
} from 'rxjs/operators';
import type { Site, LogLine } from '@projectsites/domain';

@Injectable({ providedIn: 'root' })
export class SiteFeedService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Live site list. HTTP-poll fallback when WS unavailable.
   * Polling is the floor: every 30s. SSE upgrade is one PR away.
   */
  readonly sites$ = this.http.get<Site[]>('/api/sites').pipe(
    retry({ count: 3, delay: (_e, n) => timer(2 ** n * 250) }),
    repeat({ delay: 30_000 }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Template-friendly signal — derived AT THE BOUNDARY, never inside the stream.
   * Components do `sites = inject(SiteFeedService).sites;` and read in `@for`.
   */
  readonly sites = toSignal(this.sites$, { initialValue: [] });

  /**
   * Real-time log tail for a site. WS-first; falls back to HTTP poll on disconnect.
   * Polling-as-fallback is THIS pattern — observable contract unchanged either way.
   */
  logsFor(siteId: string) {
    const ws$ = webSocket<LogLine>(`wss://api.projectsites.dev/sites/${siteId}/logs`);
    const fallback$ = this.http
      .get<LogLine[]>(`/api/sites/${siteId}/logs/recent`)
      .pipe(switchMap((lines) => of(...lines)), repeat({ delay: 2000 }));

    return ws$.pipe(
      catchError(() => fallback$),
      scan((acc: LogLine[], line) => [...acc.slice(-999), line], []),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
```

```ts
// Component — template reads signals, NEVER subscribes.
@Component({
  selector: 'app-site-list',
  template: `
    @for (site of sites(); track site.id) {
      <app-site-card [site]="site" />
    }
  `,
})
export class SiteListComponent {
  private readonly feed = inject(SiteFeedService);
  readonly sites = this.feed.sites; // signal — no async pipe, no subscribe
}
```

## Polling-as-floor recipes (when WS/SSE not yet wired)

```ts
// Poll every 30s while subscribed; pause when nothing reads it.
http.get<T>(url).pipe(repeat({ delay: 30_000 }), shareReplay({ bufferSize: 1, refCount: true }))

// Poll on a backoff that doubles after failure.
http.get<T>(url).pipe(
  retry({ count: Infinity, delay: (e, n) => timer(Math.min(2 ** n * 1000, 60_000)) }),
  repeat({ delay: 30_000 }),
)

// Stop polling when tab is hidden (free perf win).
const visible$ = fromEvent(document, 'visibilitychange').pipe(
  startWith(0),
  map(() => !document.hidden),
);
visible$.pipe(switchMap(v => v ? http.get<T>(url).pipe(repeat({ delay: 30_000 })) : EMPTY))
```

## SSE pattern (the ceiling)

```ts
// libs/util-rxjs/src/from-event-source.ts
export function fromEventSource<T>(url: string): Observable<T> {
  return new Observable<T>((sub) => {
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = (evt) => sub.next(JSON.parse(evt.data) as T);
    es.onerror = (err) => sub.error(err);
    return () => es.close();
  });
}

// Service usage — same shape as HTTP/WS.
readonly buildProgress$ = fromEventSource<BuildEvent>(`/api/sites/${id}/build/stream`).pipe(
  retry({ count: 5, delay: 2000 }),
  shareReplay({ bufferSize: 1, refCount: true }),
);
readonly buildProgress = toSignal(this.buildProgress$, { initialValue: null });
```

## WebSocket pattern (bidirectional — chat, presence, cursor sync)

```ts
import { webSocket } from 'rxjs/webSocket';

readonly chat$ = webSocket<ChatFrame>({
  url: `wss://api.projectsites.dev/jobs/${jobId}/chat`,
  openObserver: { next: () => this.chat$.next({ type: 'hello', userId }) },
});

// Send: this.chat$.next({ type: 'message', text: 'hi' });
// Receive: chat$ is itself the inbound stream.
```

## Component patterns

### Search box (debounced + cancelled on next keystroke)

```ts
@Component({
  template: `
    <input [formControl]="query" />
    @for (r of results(); track r.id) { <app-row [r]="r" /> }
  `,
})
export class SearchComponent {
  readonly query = new FormControl('', { nonNullable: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(SearchApi);

  readonly results = toSignal(
    this.query.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((q) => (q ? this.api.search(q) : of([]))),
      takeUntilDestroyed(this.destroyRef),
    ),
    { initialValue: [] },
  );
}
```

### Save-with-optimistic-update + rollback on error

```ts
save() {
  const prev = this.site();
  this.site.set({ ...prev, name: this.editName() }); // optimistic
  this.api.updateSite(prev.id, { name: this.editName() }).pipe(
    catchError((err) => { this.site.set(prev); this.toast.error('Save failed'); return EMPTY; }),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
}
```

## Util library

Every Nx workspace has `libs/util-rxjs/` exposing reusable operators:
- `retryWithBackoff(opts)` — exponential backoff + jitter
- `fromEventSource(url)` — SSE wrapper
- `pollWhile(predicate$, interval)` — gated polling
- `multiplexedSocket(url, topicSelector)` — single WS demuxed by topic
- `pauseWhenHidden(source$)` — `visibilitychange`-aware throttle
- `cacheFirst(source$, ttlMs)` — TTL-cached observable

## Testing
- Marble-test every operator chain via `TestScheduler`. Don't `await firstValueFrom()` in tests — that defeats the marble guarantee.
- For component-level tests, prefer `provideExperimentalZonelessChangeDetection()` + `TestBed.runInInjectionContext` + `toSignal` reads.

## Build gate
- ESLint rule `eslint-plugin-rxjs` enforces: no nested subscribes, no manual unsubscribe (must use `takeUntilDestroyed`), no `firstValueFrom`/`lastValueFrom` in service files (allowed only in non-Angular Node scripts).
- Custom rule (project `eslint.config.js`): `no-restricted-imports` blocks `rxjs/operators` legacy path — must import from `rxjs`.
- TypeScript-strict checks `Observable<T>` return types on every public service method.

## Reference incident (***2026-05-26 — projectsites.dev v2 doctrine adoption***)
Brian's explicit meta-instruction: "Add to the ~/.agentskills that when programming with Angular, RxJS should be used so that all backend calls happen via data streams. Like this, at the very least information can be somewhat real-time by implementing polling at the least."

The pattern this enforces: every service-level backend call MUST return `Observable<T>`. Polling is the universal floor (every Observable can be `repeat({ delay })`'d into a poll). SSE/WS upgrades land without touching the consumer. The current `AdminStateService` partly follows this (signal-wrapped polling) — formalize across every service in `libs/data-access/`.

## See
- [[angular-nx-monorepo]] — the workspace this rule lives inside
- [[frontend-stack]] — RxJS-first applies whenever Angular is the chosen frontend
- [[code-style]] § Testing — marble tests + Vitest patterns
- [[verification-loop]] — every observable-backed feature gets a Playwright spec
- [[e2e-tdd-organization]] — RxJS streams = deterministic E2E; promises = flaky timing
- [[brian-preferences]] — pick ONE, just do it; RxJS IS the one
- [[full-autonomy]] — implementing this pattern across every service is authorized work
