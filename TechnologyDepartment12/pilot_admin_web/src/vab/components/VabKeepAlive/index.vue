<template>
  <keep-alive :include="cachedRoutes" :max="keepAliveMaxNum">
    <router-view :key="key" />
  </keep-alive>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { keepAliveMaxNum } from '@/config'

  export default {
    name: 'VabKeepAlive',
    data() {
      return {
        key: null,
        keepAliveMaxNum,
        dept: this.findParent(this).length,
        parent: null,
      }
    },
    computed: {
      ...mapGetters({
        cachedRoutes: 'routes/cachedRoutes',
      }),
    },
    watch: {
      $route: {
        handler(route) {
          const matched = this.$route.matched.map((item) => item.name)
          if (!this.parent) this.parent = matched[this.dept - 1]
          const tempKey = matched[this.dept]
          const key = tempKey
            ? this.dept === matched.length - 1
              ? tempKey +
                JSON.stringify(route.params) +
                JSON.stringify(route.query)
              : tempKey
            : this.key
          if (this.dept > 1) {
            if (matched[this.dept - 1] === this.parent) this.key = key
          } else this.key = key
        },
        immediate: true,
      },
    },
    methods: {
      findParent(node) {
        if (node.$options.name === 'VabAppMain') return ['VabAppMain']
        return node.$options.name === 'VabKeepAlive' ||
          node.$options.name.startsWith('El')
          ? this.findParent(node.$parent)
          : [...this.findParent(node.$parent), node.$options.name]
      },
    },
  }
</script>
