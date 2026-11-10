export function translateTitle(title) {
  if (this.$te(`route.${title}`)) return this.$t(`route.${title}`)
  return title
}
