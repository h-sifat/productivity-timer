// if an option is negated (e.g., --no-description) it's value will be
// false. So, to remove this property we've to change it to null.
export function setNegatedPropsToNull(object: any) {
  for (const [key, value] of Object.entries(object))
    if (value === false) (<any>object)[key] = null;
}
