<template>
    <div class="poster">
        <div>
            <div class="title">飞行大师</div>
        <div class="info"> {{ info }} </div>
        <div  class="btn" :class="active?'btn_active':''">
            <img src="@/assets/image/poster-btn.png"  alt="" @click="handleStart">
        </div>
        </div>
    </div>
</template>
<script>    
//
export default {
    data(){
        return{
            info:'<< Pilot Grandmaster >>',
            active:false
        }
    },
    mounted(){

    },
    methods:{
        handleStart(){
            this.active = true;
            let that = this;
            setTimeout(()=>{
                that.$emit('hanldePlay')
            },1500)
        }
    }
 }
</script>
<style scoped>
.poster{
    position: fixed;
    top:0;left:0;right:0;bottom:0;
    background: rgba(0,0,0,0.8);
    display: flex;
   align-items: center;
   justify-content: center;
    
}
.title{
    text-align: center;
    margin-bottom: 10px;
}
.info{
    text-align: center;
    margin-bottom: 40px;
}
.btn{
    display: inline-block;
     height: 60px;
     position: relative;
     margin:0 auto;
}
.btn img{
    height: 60px;

}
/* .btn_active{
     display: inline-block;
     height: 60px;
     position: relative;
} */
/* 下面设计 发光效果 */
.btn::before,.btn_active::before {
    content: '';
    position: absolute;
    top: -1px;
    bottom: -1px;
    left: -1px;
    right: -1px;
    border-radius: 10px;
    /* 背景渐变色 */
    background-image: linear-gradient(to right, #f9e10a, #dcc922, #ffeb3b, #ffed47);
    /* 背景渐变色大小 */
    background-size: 400%;
    /* 元素的位置 底层或者顶层  -值表示底层 + 值表示顶层 */
    z-index: -1;
    /* 设置模糊度 显示发光效果 */
    filter: blur(10px);
}

.btn_active::before {
    /* 动画 名称 时间 infinite 是无限次播放 */
    animation: sun 2s infinite;
}

.btn_active:hover::before {
    animation: sun 2s infinite;
}

@keyframes sun {
    100% {
        /* 背景位置 */
        background-position: -400% 0;
    }
}
</style>