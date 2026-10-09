declare module 'postscribe' {
  export default function postscribe(element: HTMLElement, html: string, options?: {
    done?: () => void;
    error?: (error: { msg: string }) => void;
  }): void;
}
