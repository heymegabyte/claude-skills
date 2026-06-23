# RxJS-First Angular — implementation reference

Sourced on demand by rules/rxjs-first-angular.md.

---

## Canonical service + component

Full working example of an HTTP-poll service with WebSocket upgrade path and a signal-bound component.

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

---

## Polling recipes

Three canonical poll patterns: simple, with doubling backoff, and paused when tab is hidden.

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

---

## SSE pattern

Wraps the native `EventSource` in an `Observable` with teardown logic. Lives at
`libs/util-rxjs/src/from-event-source.ts`.

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

---

## WebSocket pattern

RxJS `webSocket()` with greeting frame on open.

```ts
readonly chat$ = webSocket<ChatFrame>({
  url: `wss://api.projectsites.dev/jobs/${jobId}/chat`,
  openObserver: { next: () => this.chat$.next({ type: 'hello', userId }) },
});
// Send: this.chat$.next({ type: 'message', text: 'hi' });
```

---

## Component patterns

Debounced search box and save-with-optimistic-update inside a component.

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
