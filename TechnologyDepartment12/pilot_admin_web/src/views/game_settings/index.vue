


<template>

  <div class="app-container">

    <el-tabs v-model="poolTab" type="card" @tab-click="handleTabsClick">
      <!-- 用户信息 -->
      <el-tab-pane label="游戏配置" name="GameSetting">
        <game v-if="poolTab === 'GameSetting'" ref="GameSetting" />
      </el-tab-pane>
      <!-- 银行卡提现信息 -->
      <el-tab-pane label="机器人配置" name="RobotSetting">
        <robot v-if="poolTab === 'RobotSetting'" ref="RobotSetting" />
      </el-tab-pane>
    </el-tabs>

  </div>
</template>

<script>
  import Game from './components/gameSetting'
  import Robot from './components/robotSetting'
  export default {
    name: 'Index',
    components: {
      Game,
      Robot,
    },
    data() {
      return {
        poolTab: 'GameSetting',
      }
    },
    created() {},
    methods: {
      handleTabsClick(tab, event) {
        this.poolTab = tab.name
      },
    },
  }
</script>
