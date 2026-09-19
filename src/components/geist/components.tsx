import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, JSX, ReactNode } from 'react'

/** @vercel/geistcn is private; this matches the published Grid API. */

export type Breakpoint<T> = T | { sm?: T; md?: T; lg?: T }

type GridSystemValue = {
  guideWidth: number
  dashedGuides: boolean
  useContainer: boolean
  debug: boolean
}

type CrossMark = { column: number; row: number }

type GridValue = {
  columns: Breakpoint<number>
  rows: Breakpoint<number>
  registerAll: (marks: CrossMark[]) => void
  registerOne: (mark: CrossMark) => () => void
}

const GridSystemContext = createContext<GridSystemValue>({
  guideWidth: 1,
  dashedGuides: false,
  useContainer: false,
  debug: false,
})

const GridContext = createContext<GridValue | null>(null)

function useGridSystem(): GridSystemValue {
  return useContext(GridSystemContext)
}

function useGrid(): GridValue {
  const value = useContext(GridContext)
  if (!value) throw new Error('GridCross must be used inside Grid')
  return value
}

function isMap<T>(value: Breakpoint<T>): value is { sm?: T; md?: T; lg?: T } {
  return typeof value === 'object' && value !== null
}

function maxNum(value: Breakpoint<number>): number {
  if (!isMap(value)) return value
  return Math.max(value.sm ?? 1, value.md ?? 1, value.lg ?? 1)
}

function cssVars(
  prefix: string,
  value: Breakpoint<string | number> | undefined,
): Record<string, string> {
  if (value == null) return {}
  if (!isMap(value)) return { [`--${prefix}-sm`]: String(value) }
  const vars: Record<string, string> = {}
  if (value.sm != null) vars[`--${prefix}-sm`] = String(value.sm)
  if (value.md != null) vars[`--${prefix}-md`] = String(value.md)
  if (value.lg != null) vars[`--${prefix}-lg`] = String(value.lg)
  return vars
}

function parseTracks(value: string): number[] {
  if (!value || value === 'none') return []
  return [...value.matchAll(/([\d.]+)px/g)].map((match) => Number(match[1]))
}

function toLines(tracks: number[]): number[] {
  const lines = [0]
  for (const track of tracks) {
    const last = lines.at(-1) ?? 0
    lines.push(last + track)
  }
  return lines
}

export function GridPage({ children }: { children: ReactNode }): JSX.Element {
  return <div className="geist-grid-page">{children}</div>
}

export function GridSystem({
  children,
  guideWidth = 1,
  dashedGuides = false,
  unstable_useContainer = false,
  debug = false,
}: {
  children: ReactNode
  guideWidth?: number
  dashedGuides?: boolean
  unstable_useContainer?: boolean
  debug?: boolean
}): JSX.Element {
  return (
    <GridSystemContext.Provider
      value={{
        guideWidth,
        dashedGuides,
        useContainer: unstable_useContainer,
        debug,
      }}
    >
      <div
        className="geist-grid-system"
        data-container={unstable_useContainer ? '' : undefined}
        data-dashed={dashedGuides ? '' : undefined}
        data-debug={debug ? '' : undefined}
        style={{ '--guide-width': `${guideWidth}px` } as CSSProperties}
      >
        {children}
      </div>
    </GridSystemContext.Provider>
  )
}

export function Grid({
  children,
  columns,
  rows,
  hideGuides,
  className,
}: {
  children?: ReactNode
  columns: Breakpoint<number>
  rows: Breakpoint<number>
  hideGuides?: 'row' | 'column'
  className?: string
}): JSX.Element {
  const system = useGridSystem()
  const ref = useRef<HTMLDivElement>(null)
  const [marks, setMarks] = useState<CrossMark[]>([])
  const [lines, setLines] = useState<{ cols: number[]; rows: number[] }>({
    cols: [],
    rows: [],
  })

  const registerAll = useCallback((next: CrossMark[]) => {
    setMarks(next)
  }, [])

  const registerOne = useCallback((mark: CrossMark) => {
    setMarks((current) => [...current, mark])
    return () =>
      setMarks((current) =>
        current.filter(
          (item) => item.column !== mark.column || item.row !== mark.row,
        ),
      )
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const styles = getComputedStyle(el)
      setLines({
        cols: toLines(parseTracks(styles.gridTemplateColumns)),
        rows: toLines(parseTracks(styles.gridTemplateRows)),
      })
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    void document.fonts.ready.then(measure)
    return () => observer.disconnect()
  }, [columns, rows])

  return (
    <div className={['geist-grid-wrap', className].filter(Boolean).join(' ')}>
      <div
        ref={ref}
        className="geist-grid"
        data-hide-guides={hideGuides}
        style={
          {
            ...cssVars('grid-cols', columns),
            ...cssVars('grid-rows', rows),
            '--guide-width': `${system.guideWidth}px`,
          } as CSSProperties
        }
      >
        <GridContext.Provider
          value={{ columns, rows, registerAll, registerOne }}
        >
          {children}
        </GridContext.Provider>
      </div>
      <Guides
        colLines={lines.cols}
        rowLines={lines.rows}
        hideGuides={hideGuides}
        dashed={system.dashedGuides}
        width={system.guideWidth}
      />
      <CrossLayer marks={marks} colLines={lines.cols} rowLines={lines.rows} />
    </div>
  )
}

export function GridCell({
  children,
  column,
  row,
  solid,
  className,
}: {
  children?: ReactNode
  column?: Breakpoint<string | number>
  row?: Breakpoint<string | number>
  solid?: boolean
  className?: string
}): JSX.Element {
  return (
    <div
      className={['geist-grid-cell', className].filter(Boolean).join(' ')}
      data-solid={solid ? '' : undefined}
      style={{
        ...cssVars('cell-col', column),
        ...cssVars('cell-row', row),
      }}
    >
      {children}
    </div>
  )
}

export function GridCross({
  column,
  row,
}: {
  column: number
  row: number
}): null {
  const { registerOne } = useGrid()
  useLayoutEffect(
    () => registerOne({ column, row }),
    [column, row, registerOne],
  )
  return null
}

/** Stamp a plus at every grid-line intersection. */
export function GridCrosses(): null {
  const { columns, rows, registerAll } = useGrid()
  useLayoutEffect(() => {
    const next: CrossMark[] = []
    const maxColumns = maxNum(columns)
    const maxRows = maxNum(rows)
    for (let row = 1; row <= maxRows + 1; row += 1) {
      for (let column = 1; column <= maxColumns + 1; column += 1) {
        next.push({ column, row })
      }
    }
    registerAll(next)
    return () => registerAll([])
  }, [columns, rows, registerAll])
  return null
}

function Guides({
  colLines,
  rowLines,
  hideGuides,
  dashed,
  width,
}: {
  colLines: number[]
  rowLines: number[]
  hideGuides?: 'row' | 'column'
  dashed: boolean
  width: number
}): JSX.Element | null {
  if (!colLines.length || !rowLines.length) return null
  const height = colLines.length ? (rowLines.at(-1) ?? 0) : 0
  const span = rowLines.length ? (colLines.at(-1) ?? 0) : 0
  const hideCols = hideGuides === 'column'
  const hideRows = hideGuides === 'row'

  return (
    <div aria-hidden="true" className="geist-guides">
      {hideCols
        ? null
        : colLines.map((x, index) => (
            <span
              key={`c${index}`}
              className="geist-guide geist-guide-col"
              data-dashed={dashed ? '' : undefined}
              style={{
                left: x,
                width,
                height,
              }}
            />
          ))}
      {hideRows
        ? null
        : rowLines.map((y, index) => (
            <span
              key={`r${index}`}
              className="geist-guide geist-guide-row"
              data-dashed={dashed ? '' : undefined}
              style={{
                top: y,
                height: width,
                width: span,
              }}
            />
          ))}
    </div>
  )
}

function CrossLayer({
  marks,
  colLines,
  rowLines,
}: {
  marks: CrossMark[]
  colLines: number[]
  rowLines: number[]
}): JSX.Element | null {
  if (!colLines.length || !rowLines.length) return null
  return (
    <div aria-hidden="true" className="geist-crosses">
      {marks.map((mark, index) => {
        if (mark.column > colLines.length || mark.row > rowLines.length) {
          return null
        }
        const x = colLines[mark.column - 1] ?? 0
        const y = rowLines[mark.row - 1] ?? 0
        return (
          <span
            key={`${mark.column}:${mark.row}:${index}`}
            className="geist-grid-cross"
            style={{ left: x, top: y }}
          />
        )
      })}
    </div>
  )
}

export function Badge({
  children,
  variant = 'gray',
  contrast,
}: {
  children: ReactNode
  variant?: 'gray' | 'blue' | 'green' | 'amber' | 'purple'
  contrast?: 'low'
}): JSX.Element {
  return (
    <span
      className="geist-badge"
      data-variant={variant}
      data-contrast={contrast}
    >
      {children}
    </span>
  )
}
