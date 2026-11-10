/**
 * @description router全局配置，如有必要可分文件抽离，其中asyncRoutes只有在intelligence模式下才会用到，pro版只支持remixIcon图标
 * hidden: true                       是否显示在菜单中显示路由(默认值：false)
 * alwaysShow: true                   当只有一级子路由时是否显示父路由是否显示在菜单中显示路由(默认值：false)
 * name: 'Demo'                       首字母大写，一定要与vue文件的name对应起来，用于noKeepAlive缓存控制(该项特别重要)
 * menuHidden: true                   常规/横向/纵向模式中，隐藏根布局，仅适用于第一层路由
 * meta: {
    title: 'title'                    菜单、面包屑、标签页显示的名称
    roles: ['admin','...']            当config/setting.config.js中rolesControl配置开启时，用于控制角色
    roles: {
      role: ['admin'],                role: ['admin']
      ability: ['READ','WRITE'],      ability: ['READ','WRITE'],
      mode: 'allOf'                   allOf: 数组内所有角色都拥有，返回True
                                      oneOf: 数组内拥有任一角色，返回True(等价第1种数据)
                                      except: 不拥有数组内任一角色，返回True(取反)
    }
    icon: ''                          图标
    isCustomSvg: false,               是否是自定义svg图标，默认值：false，如果为true，将svg拷贝到icon文件夹下
    noKeepAlive: true                 当前路由是否不缓存(默认值：false)
    affix: true                       当前路由是否固定标签页
    badge: 'New'                      徽章(只支持子级)
    dot: true                         dot小圆点(只支持子级)
    tabHidden: true                   当前路由是否不显示标签页
    activeMenu: '',                   高亮指定菜单
    dynamicNewTab: true,              动态路径新页面是否新建标签
   }
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/vab/layouts'
import { publicPath, routerMode } from '@/config'

Vue.use(VueRouter)
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true,
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/403'),
    hidden: true,
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404'),
    hidden: true,
  },
  {
    path: '/',
    component: () => import('@/vab/layouts'),
    redirect: '/home',
    name: 'Index',
    hidden: false,
    meta: { title: '首页' },
    children: [
      {
        path: 'home',
        component: () => import('@/views/home/index'),
        name: 'Home',
        meta: { title: 'dashboard', icon: 'dashboard', affix: true },
      },
    ],
  },
]
// 采用All模式 路由由后端控制
export const asyncRoutes = []

const router = createRouter()

export function resetRouter(routes = constantRoutes) {
  router.matcher = createRouter(routes).matcher
}

function createRouter(routes = constantRoutes) {
  return new VueRouter({
    base: publicPath,
    mode: routerMode,
    scrollBehavior: () => ({
      y: 0,
    }),
    routes: routes,
  })
}

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject)
    return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch((err) => err)
}

export default router
