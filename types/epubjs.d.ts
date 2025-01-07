declare module 'epubjs' {
  export interface RenditionOptions {
    width?: string | number;
    height?: string | number;
    ignoreClass?: string;
    manager?: string;
    view?: string;
    flow?: string;
    layout?: string;
    spread?: string;
    minSpreadWidth?: number;
    stylesheet?: string;
    script?: string;
    allowScriptedContent?: boolean;
  }

  export interface Contents {
    document: Document;
    content: Element;
    baseUri: string;
    window: Window;
    serializer: XMLSerializer;
    sectionIndex: number;
  }

  export interface Location {
    start: {
      cfi: string;
      displayed: {
        page: number;
        total: number;
      };
    };
    end: {
      cfi: string;
      displayed: {
        page: number;
        total: number;
      };
    };
  }

  export interface Theme {
    body: {
      background?: string;
      color?: string;
      direction?: 'ltr' | 'rtl';
      'writing-mode'?: 'vertical-rl' | 'horizontal-tb';
      '-webkit-writing-mode'?: 'vertical-rl' | 'horizontal-tb';
      '-epub-writing-mode'?: 'vertical-rl' | 'horizontal-tb';
      'text-orientation'?: 'upright' | 'mixed' | 'sideways';
    };
  }

  export interface Themes {
    default(theme: Theme): void;
    register(name: string, theme: Theme): void;
    select(name: string): void;
    fontSize(size: string): void;
  }

  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  export interface Navigation {
    toc: NavItem[];
    landmarks?: NavItem[];
    page_list?: NavItem[];
  }

  export interface SpineItem {
    href: string;
    url: string;
    index: number;
  }

  export interface Hook {
    register(callback: (contents: Contents) => void): void;
    deregister(callback: (contents: Contents) => void): void;
    trigger(contents: Contents): void;
  }

  export interface Hooks {
    content: Hook;
    render: Hook;
    serialize: Hook;
    content_ready: Hook;
  }

  export interface Rendition {
    display(target?: string): Promise<void>;
    prev(): Promise<void>;
    next(): Promise<void>;
    themes: Themes;
    hooks: Hooks;
    flow(flow: string): void;
    spread(spread: string): void;
    resize(width?: number | string, height?: number | string): void;
    on(event: string, callback: (event: any) => void): void;
    off(event: string, callback: (event: any) => void): void;
    location: {
      start: {
        href: string;
        cfi: string;
        displayed: {
          page: number;
          total: number;
        };
      };
    };
  }

  export interface Book {
    renderTo(element: Element, options?: RenditionOptions): Rendition;
    destroy(): void;
    ready: Promise<void>;
    isOpen: boolean;
    opened: Promise<void>;
    resolve(path: string): string;
    package: {
      metadata: any;
      spine: any;
    };
    spine: {
      get(target: string): Promise<any>;
      spineItems: SpineItem[];
      spineByHref: { [key: string]: SpineItem };
    };
    loaded: {
      navigation: Promise<Navigation>;
      metadata: Promise<any>;
      cover: Promise<string>;
      resources: Promise<any>;
      spine: Promise<any>;
      package: Promise<any>;
    };
    locations: {
      generate(pageLength?: number): Promise<any>;
      total: number;
      locationFromCfi(cfi: string): number;
    };
  }

  export default function ePub(data: ArrayBuffer | string): Book;
} 