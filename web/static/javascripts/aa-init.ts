// @ts-nocheck
var ALGOLIA_INSIGHTS_SRC: string = "https://cdn.jsdelivr.net/npm/search-insights@2.2.1";

!function(e: Window, a: Document, t: string, n: string, s: string, i: string, c: HTMLElement): void {
  e.AlgoliaAnalyticsObject = s;
  e[s] = e[s] || function() {
    (e[s].queue = e[s].queue || []).push(arguments);
  };
  i = a.createElement(t);
  c = a.getElementsByTagName(t)[0];
  i.async = 1;
  i.src = n;
  c.parentNode.insertBefore(i, c);
}(window, document, "script", ALGOLIA_INSIGHTS_SRC, "aa");