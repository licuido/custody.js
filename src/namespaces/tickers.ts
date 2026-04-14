import { URLs } from "../constants/urls.js"
import type {
  Core_ApiTicker,
  Core_TickersCollection,
  GetTickerPathParams,
  GetTickersQueryParams,
} from "../services/tickers/tickers.types.js"
import type { TypedTransport } from "../transport/index.js"

export function createTickers(t: TypedTransport) {
  return {
    list: (queryParams?: GetTickersQueryParams): Promise<Core_TickersCollection> =>
      t.get(URLs.tickers, undefined, queryParams),

    get: (params: GetTickerPathParams): Promise<Core_ApiTicker> => t.get(URLs.ticker, params),
  } as const
}
