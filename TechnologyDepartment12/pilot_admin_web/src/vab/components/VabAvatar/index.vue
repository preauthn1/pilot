<template>
  <el-dropdown @command="handleCommand" @visible-change="handleVisibleChange">
    <span class="avatar-dropdown">
      <el-avatar :src="avatar" class="user-avatar" />
      <div class="user-name">
        <span class="hidden-xs-only">{{ username }}</span>
        <vab-icon
          :class="{ 'vab-dropdown-active': active }"
          class="vab-dropdown"
          icon="arrow-down-s-line"
        />
      </div>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <!--        <el-dropdown-item command="personalCenter">
          <vab-icon icon="user-line" />
          {{ translateTitle('个人中心') }}
        </el-dropdown-item>-->
        <el-dropdown-item command="logout">
          <vab-icon icon="logout-circle-r-line" />
          {{ translateTitle('退出登录') }}
        </el-dropdown-item>
        <!--        <el-dropdown-item command="themeSettings">-->
        <!--          <vab-icon icon="brush-2-line" />-->
        <!--          {{ translateTitle('主题配置') }}-->
        <!--        </el-dropdown-item>-->
        <el-dropdown-item command="changePassword">
          <vab-icon icon="lock-password-line" />
          {{ translateTitle('修改密码') }}
        </el-dropdown-item>
        <el-dropdown-item command="changeLineUrl">
          <vab-icon icon="line-chart-line" />
          {{ translateTitle('切换线路') }}
        </el-dropdown-item>
      </el-dropdown-menu>
      <edit ref="edit"></edit>
      <ChangeLine ref="changeLine"></ChangeLine>
    </template>
  </el-dropdown>
</template>

<script>
  import { translateTitle } from '@/utils/i18n'
  import { mapActions, mapGetters } from 'vuex'
  import { toLoginRoute } from '@/utils/routes'
  import Edit from '@/vab/components/VabChangePassword'
  import ChangeLine from '@/vab/components/VabChangeLineUrl'

  export default {
    name: 'VabAvatar',
    components: { Edit, ChangeLine },
    data() {
      return {
        active: false,
      }
    },
    computed: {
      ...mapGetters({
        avatar: 'user/avatar',
        username: 'user/username',
      }),
    },
    methods: {
      translateTitle,
      ...mapActions({
        _logout: 'user/logout',
      }),
      handleCommand(command) {
        switch (command) {
          case 'logout':
            this.logout()
            break
          case 'themeSettings':
            this.themeSettings()
            break
          case 'changePassword':
            this.handleChangePassword()
            break
          case 'changeLineUrl':
            this.handleChangeLineUrl()
            break
        }
      },
      handleChangePassword() {
        this.$refs['edit'].showEdit()
        //  this.$baseEventBus.$emit('password')
      },
      handleChangeLineUrl() {
        this.$refs['changeLine'].showLine()
      },
      handleVisibleChange(val) {
        this.active = val
      },
      themeSettings() {
        this.$baseEventBus.$emit('theme')
      },
      async logout() {
        await this._logout()
        await this.$router.push(toLoginRoute(this.$route.path))
      },
    },
  }
</script>
<style lang="scss" scoped>
  .avatar-dropdown {
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: center;
    justify-items: center;

    .user-avatar {
      width: 40px;
      height: 40px;
      margin-left: 15px;
      cursor: pointer;
      border-radius: 50%;
    }

    .user-name {
      position: relative;
      display: flex;
      align-content: center;
      align-items: center;
      height: 40px;
      margin-left: 6px;
      line-height: 40px;
      cursor: pointer;

      [class*='ri-'] {
        margin-left: 0 !important;
      }
    }
  }
</style>
