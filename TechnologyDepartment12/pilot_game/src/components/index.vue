<template>
  <div id="app">
      <!-- <template v-if="!flyer">
          <Poster @hanldePlay="hanldePlay"></Poster>
      </template>
      <template v-else> -->
          <Aviator  />
      <!-- </template> -->
      
  </div>
</template>

<script>
import Aviator from './Aviator.vue'
// import Poster from './poster'
export default {
  name: 'index',
  components: {
    Aviator,
    // Poster
  },
  data(){
      return{
          flyer:false
      }
  },
  created() {
  
  },
  methods:{
      hanldePlay(){
         this.flyer = true; 
      }
  }
}
</script>

<style scoped>
 
</style>
