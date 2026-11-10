<template>
  <el-form
    ref="form"
    :model="baseFormData"
    :rules="rules"
    :inline="baseFormAttr.isInline || false"
    :label-width="baseFormAttr.labelWidth"
  >
    <template v-for="(item, i) in baseFormColumns">
      <el-form-item
        v-show="!item.hidden"
        :key="i"
        :prop="item.prop"
        :label="item.label"
      >
        <!--输入框 input -->
        <el-input
          v-if="item.type === 'text'"
          v-model="baseFormData[item.prop]"
          :style="{ width: baseFormAttr.isInline ? '180px' : '400px' }"
          :disabled="item.disabled || false"
          v-bind="item.bind"
          :placeholder="
            item.placeholder || $t('common.placeholder.input') + item.label
          "
        />
        <el-input
          v-else-if="item.type === 'number'"
          v-model.number="baseFormData[item.prop]"
          :style="{ width: baseFormAttr.isInline ? '180px' : '400px' }"
          :disabled="item.disabled || false"
          v-bind="item.bind"
          :placeholder="
            item.placeholder || $t('common.placeholder.input') + item.label
          "
        />
        <!--文本框 textarea-->
        <el-input
          v-else-if="item.type === 'textarea'"
          v-model="baseFormData[item.prop]"
          v-bind="item.bind"
          type="textarea"
          rows="6"
          :style="{ width: baseFormAttr.isInline ? '180px' : '400px' }"
          :placeholder="
            item.placeholder || $t('common.placeholder.input') + item.label
          "
        />
        <!-- 富文本主键-->
      <!--  <quill-editor v-else-if="item.type === 'editor'"
            v-model="baseFormData[item.prop]"
            ref="myQuillEditor"
            :options="editorOption"
            @blur="onEditorBlur($event)"
            @focus="onEditorFocus($event)"
            @change="onEditorChange($event)"
            @ready="onEditorReady($event)">
        </quill-editor> -->


        <div class="quill-editor"   v-else-if="item.type === 'editor'">
            <!-- 图片上传组件辅助，组件内添加v-show=“false”属性，把该组件隐藏起来。-->
            <el-upload class="avatar-uploader" :action="uploadUrl" name="file" :show-file-list="false" :on-success="uploadSuccess" :before-upload="beforeUpload">
            </el-upload>
            <!--富文本编辑器组件-->
            <quill-editor v-model="baseFormData[item.prop]" :content="baseFormData[item.prop]" :options="editorOption" @blur="onEditorBlur($event)" @focus="onEditorFocus($event)" @ready="onEditorReady($event)" ref="QuillEditor">
            </quill-editor>
          </div>

        <!--下拉框 select-->
        <el-select
          v-else-if="item.type === 'select'"
          v-model="baseFormData[item.prop]"
          v-bind="item.bind"
          :placeholder="
            item.placeholder || $t('common.placeholder.choose') + item.label
          "
          :multiple="item.multiple || false"
          :filterable="item.filterable || true"
          :clearable="item.clearable || true"
          :disabled="item.disabled || false"
          @change="item.change ? item.change($event) : null"
        >
          <template v-if="item.optionType === 'string'">
            <el-option
              v-for="(option, index) in item.options"
              :key="index"
              :label="option"
              :value="index"
            />
          </template>
          <template v-else-if="item.optionType === 'array'">
            <el-option
              v-for="(option, index) in item.options"
              :key="index"
              :label="option.label"
              :value="option.value"
            />
          </template>
          <template v-else>
            <el-option
              v-for="(option, index) in item.options"
              :key="index"
              :label="option"
              :value="+index"
            />
          </template>
        </el-select>
        <!--单选框 radio-->
        <el-radio-group
          v-else-if="item.type === 'radio'"
          v-model="baseFormData[item.prop]"
          v-bind="item.bind"
        >
          <el-radio-button
            v-for="(option, index) in item.options"
            :key="index"
            :label="index"
          >
            {{ option }}
          </el-radio-button>
        </el-radio-group>
        <!--多选框 checkbox-->
        <template v-else-if="item.type === 'checkbox'">
          <el-checkbox
            v-if="item.hasCheckAll"
            v-model="item.checkAll"
            :indeterminate="item.isIndeterminate"
            @change="
              (val) => handleCheckAllChange(val, item.prop, item.options)
            "
          >
            全选
          </el-checkbox>
          <el-checkbox-group
            v-model="baseFormData[item.prop]"
            v-bind="item.bind"
            @change="(val) => handleCheckedChange(val, item.prop, item.options)"
          >
            <el-checkbox
              v-for="(option, index) in item.options"
              :key="index"
              :label="index"
            >
              {{ option }}
            </el-checkbox>
          </el-checkbox-group>
        </template>
        <!--开关 switch-->
        <el-switch
          v-else-if="item.type === 'switch'"
          v-model="baseFormData[item.prop]"
          :active-value="1"
          :inactive-value="0"
          :active-text="item.activeText"
          :inactive-text="item.inactiveText"
          @change="item.change ? item.change($event) : null"
        />
        <!--时间选择器 dateTimePicker-->
        <el-date-picker
          v-else-if="item.type === 'dateTimePicker'"
          v-model="baseFormData[item.prop]"
          type="datetimerange"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="~"
          :start-placeholder="$t('common.startTime')"
          :end-placeholder="$t('common.endTime')"
          align="right"
        />
        <el-date-picker
          v-else-if="item.type === 'datePicker'"
          v-model="baseFormData[item.prop]"
          type="datetimerange"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="~"
          :start-placeholder="$t('common.startTime')"
          :end-placeholder="$t('common.endTime')"
          :default-time="['00:00:00', '23:59:59']"
          align="right"
        />
        <!--上传文件-->
        <el-upload
          v-else-if="item.type === 'upload'"
          v-loading="item.loading || upload.imgLoading"
          class="avatar-uploader"
          :show-file-list="false"
          :headers="upload.headers"
          :accept="upload.accept"
          :multiple="false"
          :action="upload.uploadApi"
          :data="item.data"
          drag
          :before-upload="beforeUpload"
          :on-change="
            (file, fileList) =>
              handleImgChange(file, fileList, item.prop, item.loading)
          "
          :on-success="
            (response, file, fileList) =>
              handleImgSuccess(
                response,
                file,
                fileList,
                item.prop,
                item.ossUrl,
                item.handleSuccess
              )
          "
        >
          <el-image
            v-if="item.imgUrl"
            :src="item.imgUrl"
            fit="contain"
            style="width: 100%; height: 100%"
          />
          <span v-else width="100%" class="el-icon-upload">
            <div class="el-upload__text">
              {{ $t('file.uploadFileText.uploadText1') }}
              <em>{{ $t('file.uploadFileText.uploadText2') }}</em>
            </div>
          </span>
        </el-upload>
      </el-form-item>
    </template>
    <!--留一个插槽-->
    <el-form-item><slot name="item" /></el-form-item>
    <el-form-item class="form-button">
      <el-button :loading="submitLoading" type="primary" @click="handleSubmit">
        {{ baseFormAttr.submitButtonText || $t('common.confirmButtonText') }}
      </el-button>
      <el-button v-if="baseFormAttr.showReset" @click="handleReset">
        {{ $t('common.reset') }}
      </el-button>
      <el-button v-if="baseFormAttr.showCancel" @click="handleCancel">
        {{ $t('common.cancelButtonText') }}
      </el-button>
      <slot name="button" />
    </el-form-item>
  </el-form>
</template>

<script>
  import { quillEditor } from 'vue-quill-editor'
  import { getToken } from '@/utils/token'
  import { baseURL } from '@/config/net.config'
  import store from '@/store'
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // 加粗，斜体，下划线，删除线
    ['blockquote', 'code-block'],                      //引用，代码块
    [{ 'header': 1 }, { 'header': 2 }],               // 几级标题
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],     // 有序列表，无序列表
    [{ 'script': 'sub' }, { 'script': 'super' }],      // 下角标，上角标
    [{ 'indent': '-1' }, { 'indent': '+1' }],          // 缩进
    [{ 'direction': 'rtl' }],                         // 文字输入方向
    [{ 'size': ['small', false, 'large', 'huge'] }],  // 字体大小
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],// 标题
    [{ 'color': [] }, { 'background': [] }],          // 颜色选择
    [{ 'font': ['SimSun', 'SimHei', 'Microsoft-YaHei', 'KaiTi', 'FangSong', 'Arial'] }],// 字体
    [{ 'align': [] }], // 居中
    ['clean'],                                       // 清除样式,
    ['link', 'image'],  // 上传图片、上传视频
  ]
  export default {
    name: 'BaseForm',
    components: { quillEditor},
    props: {
      /**
       *  表单基础属性
       *  {
       *    title: string,  表单标题
       *    isInline: boolean,  是否行内表单，默认false
       *    labelWidth: string, 表单域标签的的宽度
       *    submitButtonText: string, 提交按钮文本，默认为确定
       *    showReset: boolean, 是否显示重置按钮
       *    showCancel: boolean,  是否显示取消按钮(关闭窗口时使用)
       *  }
       */
      formAttr: {
        type: Object,
        default: () => {
          return {}
        },
      },
      /**
       *  表单数据
       */
      formData: {
        type: Object,
        default: () => {
          return {}
        },
      },
      /**
       *  表单项类型
       *  {
       *    prop: {
       *      prop: string,  字段名
       *      label: string,  标签文本
       *      type: string, 输入框类型
       *      placeholder: string, 输入框文本
       *      rules: array,  校验规则
       *      options: array, 输入选项：select，radio，checkbox等需要填写
       *      pickerOptions：object, 日期快捷选项，日期组件可填写
       *    }
       *  }
       */
      formColumns: {
        type: Object,
        default: () => {
          return {}
        },
      },
      /**
       *  表单提交按钮加载中状态
       */
      submitLoading: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        content: '',
        editorOption: {
                placeholder: '请在这里输入',
                theme: 'snow', //主题 snow/bubble
                modules: {
                  history: {
                    delay: 1000,
                    maxStack: 50,
                    userOnly: false
                  },
                  toolbar: {
                    container: toolbarOptions,
                    handlers: {
                      image: function (value) {
                        if (value) {
                          // 调用element的图片上传组件
                          document.querySelector('.avatar-uploader input').click()
                        } else {
                          this.quill.format('image', false)
                        }
                      }
                    }
                  }
                }
              },
        uploadUrl: baseURL+`/upload` ,
        baseFormAttr: {},
        baseFormData: {},
        baseFormColumns: {},
        pickerOptions: {
          shortcuts: [
            {
              text: this.$t('common.week'),
              onClick(picker) {
                const end = new Date()
                const start = new Date()
                start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
                picker.$emit('pick', [start, end])
              },
            },
            {
              text: this.$t('common.oneMonth'),
              onClick(picker) {
                const end = new Date()
                const start = new Date()
                start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
                picker.$emit('pick', [start, end])
              },
            },
            {
              text: this.$t('common.threeMonth'),
              onClick(picker) {
                const end = new Date()
                const start = new Date()
                start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
                picker.$emit('pick', [start, end])
              },
            },
          ],
        },
        upload: {
          imgLoading: false,
          headers: {},
          accept: 'image/png, image/jpeg, image/jpg',
          uploadApi: baseURL + '/upload',
        },
      }
    },
    computed: {
      rules() {
        const rulesObj = {}
        for (const i in this.baseFormColumns) {
          const { label, rules, type } = this.baseFormColumns[i]
          if (rules) {
            rulesObj[i] = []
            const trigger = ['select', 'checkbox', 'radio', 'switch'].includes(
              type
            )
              ? 'change'
              : 'blur'
            rules.forEach((r) => {
              if (r === 'required') {
                rulesObj[i].push({
                  required: true,
                  message: label + this.$t('validateErrorMsg.required'),
                  trigger,
                })
              }
              if (typeof r === 'function') {
                rulesObj[i].push({ validator: r, trigger })
              }
            })
          }
        }
        return rulesObj
      },
    },
    watch: {
      formColumns: {
        deep: true,
        handler(val, oldVal) {
          this.baseFormColumns = this.$util.deepClone(val)
        },
      },
      formData: {
        deep: true,
        handler(val, oldVal) {
          this.baseFormData = this.$util.deepClone(val)
        },
      },
    },
    created() {
      this.baseFormAttr = this.$util.deepClone(this.formAttr)
      this.baseFormData = this.$util.deepClone(this.formData)
      this.baseFormColumns = this.$util.deepClone(this.formColumns)
    },
    methods: {
      // 失去焦点
          onEditorBlur (editor) { },
          // 获得焦点
          onEditorFocus (editor) { },
          // 开始
          onEditorReady (editor) { },
          // 值发生变化
          onEditorChange (editor) {
            this.content = editor.html;
            console.log(editor);
          },
          beforeUpload (file) { },
          uploadSuccess (res) {
            // 获取富文本组件实例
            let aa = this.$refs.QuillEditor
            console.log(aa)
            let quill = this.$refs.QuillEditor[0].quill
              console.log(quill)
            // 如果上传成功
            if (res) {
              console.log(res)
              // 获取光标所在位置
              let length = quill.getSelection().index;
              // 插入图片，res为服务器返回的图片链接地址
              quill.insertEmbed(length, 'image', res.data)
              // 调整光标到最后
              quill.setSelection(length + 1)
            } else {
              // 提示信息，需引入Message
              this.$message.error('图片插入失败！')
            }
          },

      resetForm() {
        this.$refs.form.resetFields()
      },
      clearValidate() {
        this.$refs.form.clearValidate()
      },
      handleSubmit() {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.$emit('update:form-data', this.baseFormData)
            this.$emit('handle-submit')
          } else {
            return false
          }
        })
      },
      handleReset() {
        this.resetForm()
        this.$emit('update:form-data', this.baseFormData)
        this.$emit('handle-refresh')
      },
      handleCancel() {
        this.$emit('handle-close')
      },
      switchChange() {
        this.$emit('switchChange')
      },
      beforeUpload() {
        let lang = store.getters['settings/language'] || 'en'
        this.$set(this.upload.headers, 'token', getToken())
        this.$set(this.upload.headers, 'Lang', lang)
      },
      handleImgChange(file, fileList, prop, loading) {
        if (file.status === 'uploading' || file.status === 'ready') {
          if (loading !== undefined) {
            this.baseFormColumns[prop].loading = true
          } else {
            this.upload.imgLoading = true
          }
        } else {
          if (loading !== undefined) {
            this.baseFormColumns[prop].loading = false
          } else {
            this.upload.imgLoading = false
          }
        }
      },
      handleImgSuccess(res, file, fileList, prop, ossUrl, successCallback) {
        console.log(res.data)
        if (res.code === 0) {
          this.baseFormColumns[prop].imgUrl =  res.data
          this.baseFormData[prop] =  res.data
          if (typeof successCallback === 'function') {
            successCallback(res)
          }
        } else {
          this.$message({
            message: res.message,
            type: 'error',
          })
        }
      },
      // 全选处理
      handleCheckAllChange(val, prop, options) {
        if (val) {
          for (const i in options) {
            this.baseFormData[prop].push(i)
          }
        } else {
          this.baseFormData[prop] = []
        }
        this.baseFormColumns[prop].isIndeterminate = false
      },
      // 单个选项选择处理
      handleCheckedChange(value, prop, options) {
        let checkedCount = value.length
        let totalCount = Object.keys(options).length
        this.baseFormColumns[prop].checkAll = checkedCount === totalCount
        this.baseFormColumns[prop].isIndeterminate =
          checkedCount > 0 && checkedCount < totalCount
      },
      setValue(prop, value) {
        this.baseFormData[prop] = value
      },
    },
  }
</script>

<style scoped>
  .form-button {
    display: block;
  }
</style>
