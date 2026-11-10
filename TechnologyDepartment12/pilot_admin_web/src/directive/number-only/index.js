export default {
  bind(el) {
    el.handler = function () {
      el.children[0].value = el.children[0].value.replace(/[^\d.]/g, '')
    }
    el.addEventListener('input', el.handler)
  },
  unbind(el) {
    el.removeEventListener('input', el.handler)
  },
}
