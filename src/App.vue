<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">

    <div v-if="loading"
         class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center">
      <svg class="animate-spin -ml-1 mr-3 h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div class="container">
      <div class="w-full my-4"></div>

      <add-ticker
          @add-ticker="add"
          :disabled="tooManyTickersAdded"
          :coin-list="coinList"
          :tickers="tickers"
      />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4"/>
        <div>
          <button
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="page -= 1"
              v-if="page > 1"
          >Назад
          </button>
          <button
              class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              @click="page +=1"
              v-if="hasNextPage"
          >Вперед
          </button>
          <div>
            Фильтр
            <input
                v-model="filter"
                @input="page=1"
                type="text"
                class="block pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"/>
          </div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4"/>
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
              v-for="t in paginatedTickers"
              :key="t.name"
              @click="selectedTicker = t"
              :class="{
                'border-4': selectedTicker === t,
                'bg-white': !!t.currency,
                'bg-red-100': !t.currency
              }"
              class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - {{ t.currency ? t.currency : 'USD' }}
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
                @click.stop="handleDelete(t)"
                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="#718096"
                  aria-hidden="true"
              >
                <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                ></path>
              </svg>
              Удалить
            </button>
          </div>

        </dl>
        <hr class="w-full border-t border-gray-600 my-4"/>
      </template>

      <graph-painter
          v-if="selectedTicker"
          :selectedTicker="selectedTicker"
          :graph="normalizedGraph"
          @unselect-ticker="selectedTicker=null"
      />
    </div>
  </div>
</template>

<script>
import { initSharedWorker, subscribeToTicker, unsubscribeFromTicker } from './api'
import AddTicker from '@/components/AddTicker'
import GraphPainter from '@/components/GraphPainter'

export default {
  name: 'App',
  components: {
    GraphPainter,
    AddTicker,
  },
  data() {
    return {
      tickers: [],
      selectedTicker: null,
      graph: [],
      loading: false,
      coinList: [],
      page: 1,
      filter: '',
    }
  },
  async created() {
    await initSharedWorker()

    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries())

    if (windowData.filter) {
      this.filter = windowData.filter
    }
    if (windowData.page) {
      this.page = +windowData.page
    }

    const tickersData = localStorage.getItem('cryptonomicon-list')

    if (tickersData) {
      this.tickers = JSON.parse(tickersData)
      for (const ticker of this.tickers) {
        ticker.currency = await subscribeToTicker(ticker.name, newPrice => this.updateTicker(ticker.name, newPrice))
      }
    }

    this.loading = true
    const f = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
    const coinList = await f.json()
    this.coinList = Object.values(coinList.Data)
    this.loading = false
  },
  computed: {
    tooManyTickersAdded() {
      return this.tickers.length > 4
    },
    startIndex() {
      return (this.page - 1) * 6
    },
    endIndex() {
      return this.page * 6
    },
    filteredTickers() {
      return this.tickers.filter(t => t.name.includes(this.filter))
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex)
    },
    hasNextPage() {
      return this.filteredTickers.length > this.endIndex
    },
    normalizedGraph() {
      const maxV = Math.max(...this.graph)
      const minV = Math.min(...this.graph)
      if (maxV === minV) {
        return this.graph.map(() => 50)
      }
      return this.graph.map(price =>
          5 + (price - minV) * 95 / (maxV - minV),
      )
    },
    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      }
    },
  },
  methods: {

    updateTicker(tickerName, price) {
      this.tickers
          .filter(t => t.name === tickerName)
          .forEach(t => {
            if (t === this.selectedTicker) {
              this.graph.push(price)
            }
            t.price = price
          })
    },
    formatPrice(price) {
      if (price === '-') return price
      return price > 1
          ? price.toFixed(2)
          : price.toPrecision(2)
    },

    async add(ticker) {
      const currentTicker = {
        name: ticker,
        price: '-',
      }

      this.tickers = [...this.tickers, currentTicker]

      this.filter = ''
      this.ticker = ''

      const currency = await subscribeToTicker(currentTicker.name, newPrice => this.updateTicker(currentTicker.name, newPrice))
      this.tickers.find(t => t.name === currentTicker.name).currency = currency
    },

    handleDelete(tToRemove) {
      this.tickers = this.tickers.filter(t => t !== tToRemove)
      if (this.selectedTicker === tToRemove) {
        this.selectedTicker = null
      }
      unsubscribeFromTicker(tToRemove.name)
    },

  },
  watch: {
    tickers() {
      localStorage.setItem('cryptonomicon-list', JSON.stringify(this.tickers))
    },
    selectedTicker() {
      this.graph = []
    },
    // paginatedTickers() {
    //   if (this.paginatedTickers.length === 0 && this.page > 1) {
    //     this.page -= 1
    //   }
    // },
    filter(newFilter) {
      this.filter = newFilter.toUpperCase()
    },
    pageStateOptions(v) {
      window.history.pushState(
          null,
          document.title,
          `${window.location.pathname}?filter=${v.filter}&page=${v.page}`,
      )
    },
  },
}
</script>
