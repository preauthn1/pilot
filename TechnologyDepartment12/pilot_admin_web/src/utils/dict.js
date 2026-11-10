import { dictMaps } from '@/api/common'

export function commonDict(dictNames, rstFun) {
  dictMaps({ dictNames: dictNames }).then((response) => {
    rstFun(response.data)
  })
}
