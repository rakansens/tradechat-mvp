# Services Overview

This document provides a high level look at the service modules used in TradeChat.
Each section lists the responsibility of the module and highlights useful public
APIs.

## 1. API Services

The **API** layer lives under `services/api` and encapsulates all REST requests
and API client creation.

Key files and methods:

- `services/api/common/request.ts` – generic request helpers including
  `apiRequest`, `browserApiRequest`, `serverApiRequest`, `adaptiveApiRequest`
  and `createCancellableRequest`.
- `config/environment.ts` – environment helpers such as
  `getEnvironment` and `getApiConfig`.
- `services/api/client-factory.ts` – exposes `getApiClient` for creating a
  cached `BitgetApiClient` instance.
- `services/api/bitget/client.new.ts` – `BitgetApiClient` class providing methods
  like `fetchCandles` and `fetchOrderBook`.

## 2. Socket Service

Files under `services/socket` manage WebSocket connectivity and subscriptions.
`services/socket/factory.ts` exposes factory helpers:

- `getSocketService`
- `createCustomSocketService`
- `getMockService`
- `resetInstances`

The main implementation is `services/socket/socket-service.ts`, which implements
`ISocketService` with methods such as `initializeMarketSocket`,
`initializeApiClient`, `subscribeOrderBook`, `subscribeKline` and
`disconnectAll`.

## 3. Cache Service

`services/cache/service.ts` offers an in-memory cache with these public methods:

- `set`
- `get`
- `delete`
- `clearByPattern`
- `clear`
- `size`
- `getStats`

Expired entries are automatically cleaned up every 60 seconds.

## 4. Data Services

Chart and order book data access is organised under `services/data`.
Important exports include:

- `chart-data-service.ts` – provides `fetchChartData`,
  `subscribeKlineRealtime`, `unsubscribeAllKlines` and
  `clearCacheOnSymbolChange`.
- `order-book-service.ts` – exposes `getOrderBook`,
  `subscribeOrderBookRealtime` and `unsubscribeAllOrderBooks`.
- `factory.ts` – convenience functions such as
  `getChartDataServiceFactory` and `getOrderBookServiceFactory`.

These services work together so higher level components can retrieve market
information through a unified interface.
