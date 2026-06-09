---
name: "rxjs-first-angular"
priority: 2
pack: "angular"
triggers:
  - "angular"
  - "rxjs"
  - "observable"
paths:
  - "stack:angular-nx"
---

# RxJS-First Angular

Every backend interaction in Angular is an **RxJS observable stream**, never a one-shot promise. Polling is the floor; SSE/WebSockets are the ceiling. Signals only bridge at the template boundary via `toSignal()`. `firstValueFrom()` defeats the contract.

## Principle

- HTTP / WebSocket / SSE / postMessage / IndexedDB → `Observable<T>`.
- Component state derived from streams → `Signal<T>` via `toSignal(stream$, { initialValue })`.
- Service keeps stream observable to compose `retry`, `debounceTime`, `switchMap`, `combineLatest`, `merge`, `share`, `takeUntilDestroyed`, `repeat`, `interval`.

## Mandate

### Do

- **HTTP** → `HttpClient` returns Observable. Keep it. NEVER `firstValueFrom(this.http.get(...))` in the service.
- **WebSocket** → `webSocket()` from `rxjs/webSocket`, never hand-rolled `new WebSocket()`.
- **SSE** → `fromEventSource()` helper at `libs/util-rxjs/src/from-event-source.ts` OR `fromEvent(source, 'message')`.
- **Polling fallback** → `source$ = http.get(url).pipe(repeat({ delay: 5000 }), shareReplay(1))`.
- **Template binding** → `toSignal(source$, { initialValue: ... })` at boundary.
- **Reactive forms** → `formControl.valueChanges` piped through `debounceTime + distinctUntilChanged + switchMap`.
- **Cancel** → `takeUntilDestroyed(this.destroyRef)` at end of every chain not exposed as a service stream.
- **Retry** → `retry({ count: 3, delay: (_, n) => timer(Math.min(2 ** n * 250, 30_000)) })` on every HTTP. Helper: `libs/util-rxjs/src/retry-with-backoff.ts`.

### Don't

- ❌ `await firstValueFrom(this.api.foo())` in async function.
- ❌ `lastValueFrom()` for simplicity.
- ❌ Hand-rolled `setInterval(() => this.refresh(), 5000)` in a component.
- ❌ Subscribe without `takeUntilDestroyed()` or `| async`.
- ❌ `effect(() => doHttp(this.someSignal()))` — use `toObservable(signal$).pipe(switchMap(v => this.http.get(...)))` instead.
- ❌ Hand-rolled `Subject` for one-direction streams — use `BehaviorSubject` only when meaningful initial value; else `share({ connector: () => new ReplaySubject(1) })`.

## Canonical service

```ts
@Injectable({ providedIn: 'root' })
export class SiteFeedService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // HTTP-poll fallback when WS unavailable. SSE upgrade is one PR away.
  readonly sites$ = this.http.get<Site[]>('/api/sites').pipe(
    retry({ count: 3, delay: (_e, n) => timer(2 ** n * 250) }),
    repeat({ delay: 30_000 }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly sites = toSignal(this.sites$, { initialValue: [] });

  // WS-first; falls back to HTTP poll on disconnect.
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

@Component({
  template: `@for (site of sites(); track site.id) { <app-site-card [site]="site" /> }`,
})
export class SiteListComponent {
  private readonly feed = inject(SiteFeedService);
  readonly sites = this.feed.sites;
}
```

## Polling recipes

```ts
// Poll every 30s; pause when nothing reads it.
http.get<T>(url).pipe(repeat({ delay: 30_000 }), shareReplay({ bufferSize: 1, refCount: true }))

// Doubling backoff on failure.
http.get<T>(url).pipe(
  retry({ count: Infinity, delay: (_e, n) => timer(Math.min(2 ** n * 1000, 60_000)) }),
  repeat({ delay: 30_000 }),
)

// Stop polling when tab hidden.
const visible$ = fromEvent(document, 'visibilitychange').pipe(startWith(0), map(() => !document.hidden));
visible$.pipe(switchMap(v => v ? http.get<T>(url).pipe(repeat({ delay: 30_000 })) : EMPTY))
```

## SSE pattern

```ts
export function fromEventSource<T>(url: string): Observable<T> {
  return new Observable<T>((sub) => {
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = (evt) => sub.next(JSON.parse(evt.data) as T);
    es.onerror = (err) => sub.error(err);
    return () => es.close();
  });
}
```

## WebSocket pattern

```ts
readonly chat$ = webSocket<ChatFrame>({
  url: `wss://api.projectsites.dev/jobs/${jobId}/chat`,
  openObserver: { next: () => this.chat$.next({ type: 'hello', userId }) },
});
// Send: this.chat$.next({ type: 'message', text: 'hi' });
```

## Component patterns

```ts
// Search box — debounced + cancelled on next keystroke
readonly results = toSignal(
  this.query.valueChanges.pipe(
    debounceTime(200), distinctUntilChanged(),
    switchMap((q) => (q ? this.api.search(q) : of([]))),
    takeUntilDestroyed(this.destroyRef),
  ),
  { initialValue: [] },
);

// Save-with-optimistic-update + rollback
save() {
  const prev = this.site();
  this.site.set({ ...prev, name: this.editName() });
  this.api.updateSite(prev.id, { name: this.editName() }).pipe(
    catchError(() => { this.site.set(prev); this.toast.error('Save failed'); return EMPTY; }),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
}
```

## Util library (`libs/util-rxjs/`)

- `retryWithBackoff(opts)` — exponential backoff + jitter
- `fromEventSource(url)` — SSE wrapper
- `pollWhile(predicate$, interval)` — gated polling
- `multiplexedSocket(url, topicSelector)` — single WS demuxed by topic
- `pauseWhenHidden(source$)` — `visibilitychange`-aware throttle
- `cacheFirst(source$, ttlMs)` — TTL-cached observable

## Testing

- Marble-test every operator chain via `TestScheduler`. Don't `await firstValueFrom()` in tests.
- For components, prefer `provideExperimentalZonelessChangeDetection()` + `TestBed.runInInjectionContext` + `toSignal` reads.

## Build gate

- `eslint-plugin-rxjs` enforces: no nested subscribes, no manual unsubscribe (use `takeUntilDestroyed`), no `firstValueFrom`/`lastValueFrom` in service files.
- `no-restricted-imports` blocks `rxjs/operators` legacy — import from `rxjs`.
- TS-strict checks `Observable<T>` return types on every public service method.
