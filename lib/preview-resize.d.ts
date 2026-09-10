export interface PreviewBytes {
  body: Buffer;
  contentType: string;
}

export interface PreviewVariant extends PreviewBytes {
  width: number;
}

/** A bundled screenshot's bytes, or null when `public/` is not readable here. */
export function readLocalPreview(location: string): Promise<PreviewBytes | null>;

/** Null means the caller should serve the original bytes unchanged. */
export function renderVariant(input: {
  key: string;
  body: Buffer;
  contentType: string;
  width: number;
  accept: string;
}): Promise<PreviewVariant | null>;
