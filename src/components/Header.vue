<template>
    <div>
      <div class="header">
          <ul class="list-inline">
            <li class="list-inline-item"><router-link to='/e/novusphere'>novusphere</router-link></li>
            <li class="list-inline-item"><router-link to='/e/eos'>eos</router-link></li>
            <li class="list-inline-item"><router-link to='/e/general'>general</router-link></li>
            <li class="list-inline-item"><router-link to='/e/anon'>anon</router-link></li>
            <li class="list-inline-item"><router-link to='/e/movies'>movies</router-link></li>
            <li class="list-inline-item"><router-link to='/e/music'>music</router-link></li>
            <li class="list-inline-item"><router-link to='/e/bounties'>bounties</router-link></li>
            <li class="list-inline-item"><router-link to='/e/dev'>dev</router-link></li>
            <li class="list-inline-item"><router-link to='/e/test'>test</router-link></li>
          </ul>
      </div>
      <div class="header-second mb-3">
        <div class="ml-3">
          <slot></slot>
        </div>
      </div>
    </div>
</template>

<script>
export default {
  name: "Menu",
  async mounted() {
  },
  methods: {
  },
  data() {
    return {};
  }
}
</script>
