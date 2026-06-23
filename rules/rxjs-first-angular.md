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

- Every service method returns `Observable<T>`; the service never subscribes internally except when persisting the stream with `shareReplay`.
- `toSignal()` is called once per stream, at the service boundary, never inside a template or `effect()`.
- WS streams fall back to HTTP poll on disconnect via `catchError(() => fallback$)`.

See `reference/rxjs-first-angular.md` for the full service + component example, polling recipes, SSE pattern, WebSocket pattern, and component patterns.

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
