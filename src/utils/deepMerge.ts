// deep merge utility function
export function deepMerge(target: any, source: any): any {
  const output = { ...target }; // use spread for shallow copy of target
  if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
    return source; // if either is not an object, source wins (or if source is null/undefined)
  }

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];
    if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      // deduplicate args/ignoredefaultargs, prefer source values
      output[key] = [...new Set([
        ...(key === 'args' || key === 'ignoreDefaultArgs' ?
          targetVal.filter((arg: string) => !sourceVal.some((launchArg: string) => typeof arg === 'string' && typeof launchArg === 'string' && arg.startsWith('--') && launchArg.startsWith(arg.split('=')[0]))) :
          targetVal),
        ...sourceVal
      ])];
    } else if (sourceVal !== null && typeof sourceVal === 'object' && !Array.isArray(sourceVal) && key in target && typeof targetVal === 'object' && targetVal !== null) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  }
  return output;
}