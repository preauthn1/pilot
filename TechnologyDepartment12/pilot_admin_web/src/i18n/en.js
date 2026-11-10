export default {
  route: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    notification: 'Notification',
    notificationSend: 'Send',
    system: 'System',
    'permission-role': 'RBAC',
    permission: {
      permissions: 'Permission list',
    },
    role: {
      roles: 'Role list',
    },
    admin: {
      admins: 'Managers',
    },
    activeLog: {
      activeLogs: 'Operation record',
    },
    exceptionError: {
      exceptionErrors: 'Abnormal record',
      logFiles: 'LOG',
    },
    user: {
      name: '用户中心',
      users: '用户列表',
      info: {
        info: '用户信息',
        config: '用户信息',
      },
    },
    file: {
      files: 'File Manage',
    },
    nginx: {
      logs: 'NGINX Logs',
    },
    pay: {
      name: '支付管理',
      channelSetting: {
        channelSettings: '支付类',
      },
      merchant: {
        merchants: '渠道商户',
      },
      typeSetting: {
        typeSettings: '支付方式',
      },
      channel: {
        channels: '支付渠道',
      },
      virtualConfig: {
        virtualConfigs: '虚拟支付配置',
      },
    },
    report: {
      name: '平台报表',
      playerRanking: {
        playerRankings: '玩家排行',
      },
      userDailyIncome: {
        userDailyIncomes: '用户每日收益',
      },
    },
    setting: {
      name: '数值设置',
      spider: '蜘蛛设置',
      equipment: {
        name: '装备设置',
        equipment: '装备设置',
        suit: '套装设置',
      },
      levelUserConfig: {
        levelUserConfigs: '玩家等级配置',
      },
      taskConfig: '任务设置',
    },
    descriptionConfig: {
      name: '说明配置',
      exploreDescription: {
        exploreDescriptions: '探索说明',
      },
    },
    systemConfig: {
      systemConfigs: '系统配置',
    },
    management: {
      name: '会员管理',
      levelUserInfo: {
        levelUserInfos: '会员等级',
      },
      rewardPointsRecord: {
        rewardPointsRecords: '积分奖励记录',
      },
    },
  },
  navbar: {
    dashboard: 'Dashboard',
    github: 'Github',
    logOut: 'Log Out',
    profile: 'Profile',
    theme: 'Theme',
    size: 'Global Size',
    setting: 'Layout Settings',
  },
  login: {
    title: 'Login Form',
    logIn: 'Login',
    username: 'Username',
    REDACTED,
    any: 'any',
    thirdparty: 'Or connect with',
    thirdpartyTips:
      'Can not be simulated on local, so please combine you own business simulation! ! !',
  },
  common: {
    help: 'Help',
    capsLock: 'Caps locked',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    submit: 'Submit',
    tips: 'Tips',
    download: 'Download',
    details: 'Details',
    confirmDelete: 'Confirm delete?',
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    emptyText: 'No data available',
    more: 'More',
    reset: 'Reset',
    refresh: 'Refresh',
    search: 'Search',
    copy: 'Copy',
    copySuccess: 'Copy succeeded',
    createTime: 'Create Date',
    startTime: 'Start Date',
    endTime: 'End Date',
    week: 'Last week',
    oneMonth: 'Last month',
    threeMonth: 'Last three months',
    createdAt: 'Create Date',
    updatedAt: 'Update Date',
    handle: 'Handle',
    batchHandle: 'Batch Handle',
    jsonTheme: {
      default: 'White',
      oneDark: 'Dark',
      vsCode: 'vs-code',
    },
    seeMore: 'See more',
    seeInfo: 'View details',
    moreScreening: 'More screening',
    collapseScreening: 'Collapse screening',
    loading: 'Loading',
  },
  permission: {
    keywords: 'Enter keywords to filter',
    sort: 'Sort',
    addSon: 'Create child permissions',
    name: 'Permission identification',
    title: 'Directory name',
    icon: 'Table of contents Icon',
    path: 'Directory path',
    component: 'Directory address',
    hidden: 'Directory display',
    nav: 'NavBar',
    btn: 'Button',
    startSortText: 'Directory sort',
    help: {
      example: 'example',
      exampleText: 'Create permissions',
      nav: 'The navigation bar will be displayed on the left navigation',
      proposal: 'Suggested rules',
      proposalText:
        'The path of the sub-routing directory is kept constant with the directory address, forming a corresponding relationship with the authority identification',
      nameText:
        'Used for background authority routing and foreground routing and i18n configuration',
      pathText: 'Front-end routing access path',
      componentText: 'File address corresponding to front-end routing',
      componentText1: 'Single-level nested routing use',
      componentText2: 'Multi-level nested routing use',
    },
  },
  role: {
    name: 'Role identification',
    syncPermissions: 'Permission setting',
  },
  admin: {
    id: 'User ID',
    name: 'User name',
    email: 'Email',
    REDACTED,
    roles: 'Roles',
    syncRoles: 'Role setting',
    syncPermissions: 'Permission setting',
    emptyPasswordText: 'Leave blank and do not modify',
    status: 'Status',
    status1Text: 'Active',
    status0Text: 'Un active',
    navSetting: {
      refresh: 'Effective after refreshing the page',
      cache: 'Cancel page cache',
      affix: 'Fixed Tag',
      need: 'Need Tags-View',
    },
  },
  systemConfig: {
    systemConfigs: '系统配置',
    id: 'ID',
    key: '键 名',
    value: '值',
    remark: '配置说明',
  },
}
