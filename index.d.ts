import * as feathers from 'feathers';

declare module 'feathers' {
  interface Service<T> {
    before(hooks: hooks.HookMap);
    after(hooks: hooks.HookMap);
  }
}

declare function hooks(): () => void;

declare namespace hooks {
  interface Hook {
    <T>(hook: HookProps<T>): Promise<any> | void;
  }

  interface HookProps<T> {
    method?: string;
    type: 'before' | 'after';
    params?: any;
    data?: T;
    result?: T;
    app?: feathers.Application;
  }

  interface HookMap {
    all?: Hook | Hook[];
    find?: Hook | Hook[];
    get?: Hook | Hook[];
    create?: Hook | Hook[];
    update?: Hook | Hook[];
    patch?: Hook | Hook[];
    remove?: Hook | Hook[];
  }
}

export = hooks;
