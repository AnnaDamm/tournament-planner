export type CssModule = Record<string, string>

const toCssModuleKey = (value: string) =>
  value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

export const classNames = (...values: Array<CssModule | string | false | null | undefined>) => {
  const modules = values.filter((value): value is CssModule => typeof value === 'object')

  return values
    .filter((value): value is string => typeof value === 'string')
    .flatMap((value) =>
      value
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (className) =>
            modules.map((styles) => styles[toCssModuleKey(className)]).find(Boolean) ?? className,
        ),
    )
    .join(' ')
}
