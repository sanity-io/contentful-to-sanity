export type ContentfulLocationValue = {
  lat: number
  lon: number
}

export function objectIsContentfulLocation(value: any | ContentfulLocationValue): value is ContentfulLocationValue {
  return (
    value &&
    typeof value === 'object' &&
    'lat' in value &&
    'lon' in value.sys
  )
}
