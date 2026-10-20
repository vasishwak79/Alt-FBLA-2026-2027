/**
 * A tiny URL router written for this project.
 *
 * Routes are registered with a method and a pattern such as
 * `/api/resources/:id`. Each `:name` segment becomes a parameter that the
 * handler receives in `ctx.params`.
 */

export class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    const paramNames = [];
    const regexSource = pattern
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          paramNames.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    this.routes.push({
      method,
      regex: new RegExp(`^${regexSource}$`),
      paramNames,
      handler,
    });
  }

  get(pattern, handler) {
    this.add('GET', pattern, handler);
  }

  post(pattern, handler) {
    this.add('POST', pattern, handler);
  }

  put(pattern, handler) {
    this.add('PUT', pattern, handler);
  }

  patch(pattern, handler) {
    this.add('PATCH', pattern, handler);
  }

  delete(pattern, handler) {
    this.add('DELETE', pattern, handler);
  }

  /**
   * Finds the handler for a request.
   * Returns `{ handler, params }`, `{ allowed }` when only the method is
   * wrong (405), or `null` when nothing matches (404).
   */
  match(method, pathname) {
    const allowed = [];

    for (const route of this.routes) {
      const result = route.regex.exec(pathname);
      if (!result) continue;

      if (route.method !== method) {
        allowed.push(route.method);
        continue;
      }

      const params = {};
      route.paramNames.forEach((name, index) => {
        const raw = result[index + 1];
        try {
          params[name] = decodeURIComponent(raw);
        } catch {
          params[name] = raw;
        }
      });
      return { handler: route.handler, params };
    }

    return allowed.length > 0 ? { allowed } : null;
  }
}
