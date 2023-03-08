export type ContentfulLocationValue = {
  lat: number
  lon: number
}

export function objectIsContentfulLocation(
  value: any | ContentfulLocationValue,
): value is ContentfulLocationValue {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.sys === 'object' &&
    'lat' in value &&
    'lon' in value.sys
  )
}
