<template>
 
        <div style="width:100%;">
            <div class="meter red">
                <span :style="{'width':wid+'%'}"></span>
            </div>
            <div class="progress-txt">{{ wid }}%</div>
        </div>

</template>
<script>
export default {
    data(){
        return{

        }
    },
    props:{
        wid:{
            type:Number,
            default:0
        }
    }
}
</script>
<style scoped>
    .progress-txt{
        color:#fff;
        text-align: center;
        position: fixed;
        bottom:15%;
        width:100%;
        font-size: 24px;
        font-weight: bold;
    }
    .meter {
    /* position: relative;
    position: fixed;
    top: 0; */
    width: 80%;
    /* left: 0; */
     box-sizing: content-box;
    height: 20px;
    position: fixed;
    bottom:20%;
    margin: 0 10%; 
    background-color: rgba(10, 12, 29,0.9);
    box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 1px 0;
    padding-bottom: 2px;
}
.meter > span {
  display: block;
  height: 100%;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  background-color: rgb(43, 194, 83);
  background-image: linear-gradient(
    center bottom,
    rgb(43, 194, 83) 37%,
    rgb(84, 240, 84) 69%
  );
  box-shadow: inset 0 2px 9px rgba(255, 255, 255, 0.3),
    inset 0 -2px 6px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}
.meter > span:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-image: linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  z-index: 1;
  background-size: 50px 50px;
  animation: move 2s linear infinite;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  overflow: hidden;
}

@keyframes move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

/* .orange > span {
  background-image: linear-gradient(#f1a165, #f36d0a);
} */

.red > span {
  background-image: linear-gradient(#f0a3a3, #f42323);
}

</style>
