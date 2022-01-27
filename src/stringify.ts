export { stringify }

import { types } from './types'

function stringify(
  value: unknown,
  {
    forbidReactElements,
    space,
    valueName = 'value',
  }: { forbidReactElements?: boolean; space?: number; valueName?: string } = {},
): string {
  let path: string[] = []

  return JSON.stringify(value, replacer, space)

  function replacer(this: Record<string, unknown>, key: string, value: unknown) {
    if (key !== '') {
      path.push(key)
    }

    if (forbidReactElements && isReactElement(value)) {
      throw new Error(genErrMsg('React element'))
    }

    if (isFunction(value)) {
      const functionName = value.name
      throw new Error(genErrMsg('function', path.length === 0 ? functionName : undefined))
    }

    const valueOriginal = this[key]
    for (const t of types.slice().reverse()) {
      //@ts-ignore
      if (t.is(valueOriginal)) {
        //@ts-ignore
        return t.serialize(valueOriginal)
      }
    }

    return value
  }

  function genErrMsg(valueType: 'React element' | 'function', valName?: string) {
    const name = valName ? ' `' + valName + '`' : ''
    const location =
      path.length === 0 ? '' : ` ${name ? 'at ' : ''}\`${valueName}[${path.map((p) => `'${p}'`).join('][')}]\``
    const fallback = name === '' && location === '' ? ` ${valueName}` : ''
    return `[@brillout/json-s] Cannot serialize${name}${location}${fallback} because it is a ${valueType}`
  }
}

function isReactElement(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    String((value as Record<string, unknown>)['$$typeof']) === 'Symbol(react.element)'
  )
}

function isFunction<T extends (...args: unknown[]) => unknown>(thing: T | unknown): thing is T {
  return thing instanceof Function || typeof thing === 'function'
}