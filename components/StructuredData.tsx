/**
 * Emits a schema.org graph. The payload is built from parsed upstream data, so
 * it is escaped rather than trusted: `<` cannot start a tag and `&` cannot open
 * an entity inside the script element.
 */
export default function StructuredData({ data }: { data: unknown }) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <script
      type="application/ld+json"
      // The value is JSON produced above, with every character that could break
      // out of the script element already escaped.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
