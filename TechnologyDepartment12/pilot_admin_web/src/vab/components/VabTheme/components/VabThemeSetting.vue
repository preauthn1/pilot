<template>
  <div v-if="theme.showThemeSetting" class="vab-theme-setting">
    <div @click="handleOpenTheme">
      <vab-icon icon="brush-2-line" />
      <p>{{ translateTitle('主题配置') }}</p>
    </div>
    <div @click="randomTheme">
      <vab-icon icon="apps-line" />
      <p>{{ translateTitle('随机换肤') }}</p>
    </div>
    <div @click="getCode">
      <vab-icon icon="file-copy-line" />
      <p>{{ translateTitle('拷贝源码') }}</p>
    </div>
    <div @click="removeLocalStorage">
      <vab-icon icon="delete-bin-4-line" />
      <p>{{ translateTitle('清理缓存') }}</p>
    </div>
  </div>
</template>

<script>
  import { translateTitle } from '@/utils/i18n'
  import { mapGetters } from 'vuex'

  export default {
    name: 'VabThemeSetting',
    computed: {
      ...mapGetters({
        theme: 'settings/theme',
      }),
    },
    methods: {
      translateTitle,
      handleOpenTheme() {
        this.$baseEventBus.$emit('theme')
      },
      randomTheme() {
        this.$baseEventBus.$emit('random-theme')
      },
      getCode() {
        const url =
          'https://github.com/vue-admin-beautiful/vue-admin-beautiful-pro/blob/master/src/views'
        let path = this.$route.path + '/index.vue'
        if (path === '/vab/icon/icon/index.vue') {
          path = '/vab/icon/icon.vue'
        }
        if (path === '/vab/icon/colorfulIcon/index.vue') {
          path = '/vab/icon/colorfulIcon.vue'
        }
        if (path === '/vab/icon/iconSelector/index.vue') {
          path = '/vab/icon/iconSelector.vue'
        }
        if (path === '/vab/table/comprehensiveTable/index.vue') {
          path = '/vab/table/comprehensiveTable.vue'
        }
        if (path === '/vab/table/inlineEditTable/index.vue') {
          path = '/vab/table/inlineEditTable.vue'
        }
        if (path === '/vab/table/customTable/index.vue') {
          path = '/vab/table/customTable.vue'
        }
        if (path === '/vab/drag/dialogDrag/index.vue') {
          path = '/vab/drag/dialogDrag.vue'
        }
        if (path === '/vab/drag/cardDrag/index.vue') {
          path = '/vab/drag/cardDrag.vue'
        }
        if (path === '/vab/form/comprehensiveForm/index.vue') {
          path = '/vab/form/comprehensiveForm.vue'
        }
        if (path === '/vab/form/stepForm/index.vue') {
          path = '/vab/form/stepForm.vue'
        }
        if (path === '/vab/editor/richTextEditor/index.vue') {
          path = '/vab/editor/richTextEditor.vue'
        }
        if (path === '/vab/editor/markdownEditor/index.vue') {
          path = '/vab/editor/markdownEditor.vue'
        }
        if (path === '/vab/menu1/menu1-1/menu1-1-1/menu1-1-1-1/index.vue') {
          path = '/vab/nested/menu1/menu1-1/menu1-1-1/menu1-1-1-1/index.vue'
        }
        if (path === '/vab/excel/exportExcel/index.vue') {
          path = '/vab/excel/exportExcel.vue'
        }
        if (path === '/vab/excel/exportSelectedExcel/index.vue') {
          path = '/vab/excel/exportSelectedExcel.vue'
        }
        if (path === '/vab/excel/exportMergeHeaderExcel/index.vue') {
          path = '/vab/excel/exportMergeHeaderExcel.vue'
        }
        window.open(url + path)
      },
      removeLocalStorage() {
        localStorage.clear()
        location.reload()
      },
    },
  }
</script>

<style lang="scss" scoped>
  .vab-theme-setting {
    position: fixed;
    top: 50%;
    right: 0;
    width: 60px;
    min-height: 60px;
    text-align: center;
    cursor: pointer;
    border-radius: $base-border-radius;
    transform: translateY(-50%);

    > div {
      padding-top: 10px;
      margin-top: 1px;
      text-align: center;
      background: $base-color-blue;

      &:hover {
        opacity: 0.9;
      }

      p {
        padding: 0;
        margin: 0;
        overflow: hidden;
        font-size: $base-font-size-small;
        line-height: 30px;
        color: $base-color-white;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    ::v-deep {
      [class*='ri-'] {
        margin-left: auto !important;
        color: $base-color-white !important;
      }
    }
  }
</style>
