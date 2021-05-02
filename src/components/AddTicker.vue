<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
        >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
              v-model="ticker"
              @keydown.enter="add(ticker)"
              type="text"
              name="wallet"
              id="wallet"
              class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              placeholder="Например DOGE"
              autocomplete="off"
          />
        </div>

        <div v-if="tickerLength && optionTickers.length"
             class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
              <span
                  v-for="(t, i) in optionTickers"
                  :key="i"
                  @click="add(t)"
                  class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
                {{ t }}
              </span>
        </div>

        <div v-if="error.message" class="text-sm text-red-600 text-center mt-1">{{error.message}}</div>

        <add-button
            @click="add(ticker)"
            class="my-4"
            :disabled="disabled"
        />
      </div>
    </div>

  </section>
</template>

<script>
import AddButton from './AddButton.vue'

export default {
  components: {
    AddButton,
  },

  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    optionTickers: {
      type: Array,
      required: false,
      default: [],
    },
    error: {
      type: Object,
      required: false,
      default: {},
    }
  },

  emits: {
    'add-ticker': value => value.length > 0 && typeof value === 'string',
    'ask-options': value => value.length > 0 && typeof value === 'string',
  },

  data() {
    return {
      ticker: '',
    }
  },

  methods: {

    async add(ticker) {
      const newTicker = ticker || this.ticker || ''

      if (newTicker.length === 0) {
        return
      }

      this.$emit('add-ticker', newTicker.toUpperCase())

      this.ticker = ''
    },
  },

  computed: {
    tickerLength() {
      return this.ticker.length
    },
  },

  watch: {
    ticker() {
      if (this.ticker.length === 0) {
        return
      }
      this.$emit('ask-options', this.ticker.toUpperCase())
    }
  }
}
</script>
