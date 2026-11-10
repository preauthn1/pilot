<template>
  <el-dropdown
    v-if="theme.showLanguage"
    style="margin-right: 10px"
    @command="handleCommand"
  >
    <vab-icon icon="translate" />
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN">中文简体</el-dropdown-item>
        <el-dropdown-item command="vi-VN">Tiếng Việt</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'
  import getPageTitle from '@/utils/pageTitle'

  export default {
    name: 'Language',
    computed: {
      ...mapGetters({
        theme: 'settings/theme',
        extra: 'settings/extra',
        visitedRoutes: 'tabs/visitedRoutes',
      }),
    },
    methods: {
      ...mapActions({
        changeLanguage: 'settings/changeLanguage',
      }),
      handleCommand(command) {
        this.changeLanguage(command)
        this.$i18n.locale = command
        document.title = getPageTitle(this.$route.meta.title)
        this.refreshRoute()
      },
      async refreshRoute() {
        const currentRoute = this.$route
        const parentRouteName = currentRoute.matched
          .slice(0, -1)
          .map((item) => item.name)
          .join(',')
        const otherRoutes = this.visitedRoutes.filter((item) => {
          return item.name !== currentRoute.name
        })
        if (otherRoutes.length) {
          let transferRoute = otherRoutes.find((item) => {
            return item.matched.slice(0, -1).join(',') === parentRouteName
          })
          if (!transferRoute) transferRoute = otherRoutes[0]
          this.extra.transferRouteName = currentRoute.name
          this.$router
            .replace(transferRoute)
            .then(() => {
              this.extra.transferRouteName = ''
              this.$router.replace(currentRoute)
            })
            .catch(() => {
              this.$message.success('刷新失败')
            })
        } else this.$baseEventBus.$emit('reload-router-view')
      },
    },
  }
</script>
