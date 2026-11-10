<template>
  <div class="tabs-bar-container" @contextmenu.prevent="handleContextMenu">
    <fold v-if="layout === 'common'" />
    <el-tabs
      v-model="tabActive"
      :class="{
        ['tabs-content-' + theme.tabsBarStyle]: true,
      }"
      class="tabs-content"
      type="card"
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="item in visitedRoutes"
        :key="item.path"
        :closable="!isAffix(item)"
        :name="item.path"
      >
        <template v-if="theme.showTabsBarIcon" #label>
          <vab-icon
            v-if="item.meta && item.meta.icon"
            :icon="item.meta.icon"
            :is-custom-svg="item.meta.isCustomSvg"
          />
          <!--  如果没有图标那么取第二级的图标 -->
          <vab-icon v-else :icon="item.parentIcon" />
          {{ translateTitle(item.meta.title) }}
        </template>
        <template v-else #label>
          {{ translateTitle(item.meta.title) }}
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 右键上下文菜单 -->
    <div
      v-show="contextMenuVisible"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      class="context-menu"
    >
      <div class="context-menu-item" @click="closeCurrentContextTab">
        <vab-icon icon="close-line" />
        {{ translateTitle('关闭当前') }}
      </div>
      <div class="context-menu-item" @click="closeOthersTabsForContext">
        <vab-icon icon="close-line" />
        {{ translateTitle('关闭其他') }}
      </div>
      <div class="context-menu-item" @click="closeLeftTabsForContext">
        <vab-icon icon="arrow-left-line" />
        {{ translateTitle('关闭左侧') }}
      </div>
      <div class="context-menu-item" @click="closeRightTabsForContext">
        <vab-icon icon="arrow-right-line" />
        {{ translateTitle('关闭右侧') }}
      </div>
      <div class="context-menu-item" @click="closeAllTabsForContext">
        <vab-icon icon="close-line" />
        {{ translateTitle('关闭全部') }}
      </div>
    </div>
  </div>
</template>

<script>
  import { translateTitle } from '@/utils/i18n'
  import { mapActions, mapGetters } from 'vuex'
  import { handleActivePath } from '@/utils/routes'

  export default {
    name: 'VabTabs',
    props: {
      layout: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        affixTabs: [],
        tabActive: '',
        contextMenuVisible: false,
        contextMenuX: 0,
        contextMenuY: 0,
        contextMenuTabPath: '',
      }
    },
    computed: {
      ...mapGetters({
        visitedRoutes: 'tabs/visitedRoutes',
        routes: 'routes/routes',
        theme: 'settings/theme',
      }),
    },
    watch: {
      $route: {
        handler(route) {
          this.$nextTick(() => {
            this.addTabs(route)
          })
        },
        immediate: true,
      },
    },
    created() {
      this.initAffixTabs(this.routes)
    },
    mounted() {
      document.addEventListener('click', this.hideContextMenu)
    },
    beforeDestroy() {
      document.removeEventListener('click', this.hideContextMenu)
    },
    methods: {
      translateTitle,
      ...mapActions({
        addVisitedRoute: 'tabs/addVisitedRoute',
        delVisitedRoute: 'tabs/delVisitedRoute',
        delOthersVisitedRoutes: 'tabs/delOthersVisitedRoutes',
        delLeftVisitedRoutes: 'tabs/delLeftVisitedRoutes',
        delRightVisitedRoutes: 'tabs/delRightVisitedRoutes',
        delAllVisitedRoutes: 'tabs/delAllVisitedRoutes',
      }),
      handleTabClick(tab) {
        if (!this.isActive(tab.name))
          this.$router.push(this.visitedRoutes[tab.index])
      },
      initAffixTabs(routes) {
        routes.forEach((route) => {
          if (route.meta && route.meta.affix) this.addTabs(route, true)
          if (route.children) this.initAffixTabs(route.children)
        })
      },
      /**
       * 添加标签页
       * @param tag route
       * @param init 是否是从router获取路由
       * @returns {Promise<void>}
       */
      async addTabs(tag, init = false) {
        let parentIcon = ''
        if (tag.matched && tag.matched.length > 1)
          parentIcon = tag.matched[1].meta.icon
        if (tag.name && tag.meta && tag.meta.tabHidden !== true) {
          const path = handleActivePath(tag, true)
          await this.addVisitedRoute({
            path: path,
            query: tag.query,
            params: tag.params,
            name: tag.name,
            matched: init
              ? [tag.name]
              : tag.matched.map((item) => item.components.default.name),
            parentIcon,
            meta: { ...tag.meta },
          })
          this.tabActive = path
        }
      },
      /**
       * 根据原生路径删除标签中的标签
       * @param rawPath 原生路径
       * @returns {Promise<void>}
       */
      async handleTabRemove(rawPath) {
        await this.delVisitedRoute(rawPath)
        if (this.isActive(rawPath)) this.toLastTab()
      },
      /**
       * 跳转最后一个标签页
       */
      toLastTab() {
        const latestView = this.visitedRoutes.slice(-1)[0]
        if (latestView) this.$router.push(latestView)
        else this.$router.push('/')
      },
      isActive(path) {
        return path === handleActivePath(this.$route, true)
      },
      isAffix(tag) {
        return tag.meta && tag.meta.affix
      },
      /**
       * 右键上下文菜单 - 显示
       */
      handleContextMenu(event) {
        // 找到被右键点击的标签页
        let target = event.target
        while (target && target !== event.currentTarget) {
          if (target.classList.contains('el-tabs__item') && target.getAttribute('id')) {
            const path = target.getAttribute('id').replace('tab-', '')
            const tab = this.visitedRoutes.find((item) => item.path === path)
            if (tab) {
              this.contextMenuTabPath = tab.path
              this.contextMenuX = event.clientX
              this.contextMenuY = event.clientY
              this.contextMenuVisible = true
              this.$nextTick(() => {
                // 防止菜单溢出屏幕
                const menu = this.$el.querySelector('.context-menu')
                if (menu) {
                  const rect = menu.getBoundingClientRect()
                  if (rect.right > window.innerWidth)
                    menu.style.left = (event.clientX - rect.width) + 'px'
                  if (rect.bottom > window.innerHeight)
                    menu.style.top = (event.clientY - rect.height) + 'px'
                }
              })
            }
            return
          }
          target = target.parentElement
        }
      },
      hideContextMenu() {
        this.contextMenuVisible = false
      },
      async closeCurrentContextTab() {
        const path = this.contextMenuTabPath
        this.hideContextMenu()
        if (this.isAffix(this.visitedRoutes.find((item) => item.path === path))) return
        await this.delVisitedRoute(path)
        if (this.isActive(path)) this.toLastTab()
      },
      async closeOthersTabsForContext() {
        const path = this.contextMenuTabPath
        this.hideContextMenu()
        await this.delOthersVisitedRoutes(path)
      },
      async closeLeftTabsForContext() {
        const path = this.contextMenuTabPath
        this.hideContextMenu()
        await this.delLeftVisitedRoutes(path)
      },
      async closeRightTabsForContext() {
        const path = this.contextMenuTabPath
        this.hideContextMenu()
        await this.delRightVisitedRoutes(path)
      },
      async closeAllTabsForContext() {
        this.hideContextMenu()
        await this.delAllVisitedRoutes()
        if (
          !this.affixTabs.some((tag) =>
            this.isActive(handleActivePath(tag, true))
          )
        )
          this.toLastTab()
      },
    },
  }
</script>

<style lang="scss" scoped>
  .tabs-bar-container {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: space-between;
    height: $base-tabs-height;
    padding-right: $base-padding;
    padding-left: $base-padding;
    user-select: none;
    background: $base-color-white;
    border-top: 1px solid #f6f6f6;

    ::v-deep {
      .fold-unfold {
        margin-right: $base-margin;
      }
    }

    .tabs-content {
      width: 100%;

      &-card {
        height: $base-tag-item-height;

        ::v-deep {
          .el-tabs__nav-next,
          .el-tabs__nav-prev {
            height: $base-tag-item-height;
            line-height: $base-tag-item-height;
          }

          .el-tabs__header {
            border-bottom: 0;

            .el-tabs__nav {
              border: 0;
            }

            .el-tabs__item {
              box-sizing: border-box;
              height: $base-tag-item-height;
              margin-right: 5px;
              line-height: $base-tag-item-height;
              border: 1px solid $base-border-color;
              border-radius: $base-border-radius;
              transition: padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;

              &.is-active {
                color: $base-color-blue;
                background: rgba($base-color-blue, 0.1);
                border: 1px solid $base-color-blue;
              }

              &:hover {
                border: 1px solid $base-color-blue;
              }
            }
          }
        }
      }

      &-smart {
        height: $base-tag-item-height;
        ::v-deep {
          .el-tabs__nav-next,
          .el-tabs__nav-prev {
            height: $base-tag-item-height;
            line-height: $base-tag-item-height;
          }

          .el-tabs__header {
            border-bottom: 0;

            .el-tabs__nav {
              border: 0;
            }

            .el-tabs__item {
              height: $base-tag-item-height;
              margin-right: 5px;
              line-height: $base-tag-item-height;
              border: 0;
              transition: padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
              &.is-active {
                background: rgba($base-color-blue, 0.1);
                &:after {
                  width: 100%;
                  transition: $base-transition;
                }
              }
              &:after {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 2px;
                content: '';
                background-color: $base-color-blue;
                transition: $base-transition;
              }
              &:hover {
                background: rgba($base-color-blue, 0.1);
                &:after {
                  width: 100%;
                  transition: $base-transition;
                }
              }
            }
          }
        }
      }

      &-smooth {
        height: $base-tag-item-height + 4;

        ::v-deep {
          .el-tabs__nav-next,
          .el-tabs__nav-prev {
            height: $base-tag-item-height + 4;
            line-height: $base-tag-item-height + 4;
          }

          .el-tabs__header {
            border-bottom: 0;

            .el-tabs__nav {
              border: 0;
            }

            .el-tabs__item {
              height: $base-tag-item-height + 4;
              padding: 0 30px 0 30px;
              margin-top: ($base-tabs-height - $base-tag-item-height - 4)/2;
              margin-right: -15px;
              line-height: $base-tag-item-height + 4;
              border: 0;
              transition: padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;

              &.is-active {
                padding: 0 30px 0 30px;
                color: $base-color-blue;
                background: rgba($base-color-blue, 0.1);
                mask: url('~@/assets/tabs_images/vab-tab.png');
                mask-size: 100% 100%;

                &:hover {
                  padding: 0 30px 0 30px;
                  color: $base-color-blue;
                  background: rgba($base-color-blue, 0.1);
                  mask: url('~@/assets/tabs_images/vab-tab.png');
                  mask-size: 100% 100%;
                }
              }

              &:hover {
                padding: 0 30px 0 30px;
                color: $base-color-black;
                background: #dee1e6;
                mask: url('~@/assets/tabs_images/vab-tab.png');
                mask-size: 100% 100%;
              }
            }
          }
        }
      }
    }

    .context-menu {
      position: fixed;
      z-index: 9999;
      min-width: 140px;
      padding: 5px 0;
      background: $base-color-white;
      border-radius: 4px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      .context-menu-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        font-size: 13px;
        color: $base-color-black;
        cursor: pointer;

        [class*='ri-'] {
          margin-right: 8px;
          color: $base-color-gray;
        }

        &:hover {
          color: $base-color-blue;
          background: rgba($base-color-blue, 0.05);

          [class*='ri-'] {
            color: $base-color-blue;
          }
        }
      }
    }
  }
</style>
