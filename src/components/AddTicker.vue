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
              :placeholder="randomTicker"
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

        <div v-if="tickerValidationError" class="text-sm text-red-600 text-center mt-1">{{ tickerValidationError }}
        </div>

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
    coinList: {
      type: Array,
      required: false,
      default: [],
    },
    tickers: {
      type: Array,
      required: true,
    },
  },

  emits: {
    'add-ticker': value => value.length > 0 && typeof value === 'string',
  },

  data() {
    return {
      ticker: '',
      tickerValidationError: '',
      randomTicker: 'Например'
    }
  },

  methods: {
    async add(ticker) {
      const newTicker = ticker || this.ticker || ''

      if (this.isNotValidTicker(newTicker)) {
        return
      }

      if (newTicker.length === 0) {
        return
      }

      this.$emit('add-ticker', newTicker.toUpperCase())

      this.ticker = ''
    },

    isNotValidTicker(ticker) {
      if (!this.coinList.some(t => t.Symbol === ticker)) {
        this.tickerValidationError = 'Такого тикера нет в базе'
        return true
      }
      if (this.tickers.some(t => t.name === ticker)) {
        this.tickerValidationError = 'Тикер уже добавлен'
        return true
      }
      return false
    },
  },

  computed: {
    tickerLength() {
      return this.ticker.length
    },

    coinListLength() {
      return this.coinList.length
    },

    optionTickers() {
      if (this.ticker.length === 0) {
        return
      }
      this.tickerValidationError = ''
      const options = []

      for (const t of this.coinList) {
        if ((t.Symbol.includes(this.ticker) || t.FullName.includes(this.ticker)) && options.length < 4) {
          options.push(t.Symbol)
        }
        if (t.Symbol === this.ticker) {
          options[0] = t.Symbol
        }
      }
      return options
    },
  },

  watch: {
    ticker(newTicker) {
      this.ticker = newTicker.toUpperCase()
    },
    coinList(newState) {
      if (newState.length) {
        this.randomTicker = `Например ${this.coinList[Math.floor(Math.random() * this.coinListLength)]?.Symbol || 'BTC'}`
      }
    },
  },
}
</script>
