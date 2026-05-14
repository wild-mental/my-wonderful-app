// ChannelAdapter strategy interface (REQ-NF-024).
// Each affiliate channel (e.g. Coupang Partners) implements this contract so
// that adding a new channel never touches the Super-Calc engine — only a new
// adapter file is registered. DATA-001 ships only the interface; concrete
// adapters land in API-006~008.

export interface ProductPriceSnapshot {
  channelCode: string;
  channelProductId: string;
  priceKrw: number;
  servingsPerUnit: number;
  pricePerDayKrw: number;
  collectedAt: Date;
  sourceUrl: string;
}

export interface ChannelAdapter {
  readonly channelCode: string;
  fetchPriceSnapshot(channelProductId: string): Promise<ProductPriceSnapshot>;
}
