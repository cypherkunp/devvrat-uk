import {
  portraitAscii,
  portraitAsciiColumns,
} from '#/components/link-hub/portrait-ascii'

/* A monospace cell is ~0.6em wide, so the grid spans this many ems; sizing the
   font off the container width makes the art fill the frame at any breakpoint.
   The extra 0.4 is slack for mono faces whose advance runs a hair over 0.6em. */
const asciiWidthEm = portraitAsciiColumns * 0.6 + 0.4

export function AsciiPortrait({ alt }: { alt: string }) {
  return (
    <span
      role="img"
      aria-label={alt}
      className="@container relative isolate flex size-full min-h-64 items-center justify-center overflow-hidden md:min-h-0"
    >
      <pre
        aria-hidden="true"
        className="m-0 bg-gradient-to-b from-[var(--hub-fg)] via-[#424245] to-[var(--hub-muted)] bg-clip-text font-mono text-transparent"
        style={{
          fontSize: `calc(100cqw / ${asciiWidthEm})`,
          lineHeight: 1.14,
        }}
      >
        {portraitAscii}
      </pre>
    </span>
  )
}
