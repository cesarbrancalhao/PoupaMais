import { Currency } from "@/types/auth";

interface CurrencyInfo {
    locale: string;
    currency: string;
    symbol: string;
    position: "before" | "after";
}
  
const currencyMap: Record<Currency, CurrencyInfo> = {
    real: {
        locale: "pt-BR",
        currency: "BRL",
        symbol: "R$",
        position: "before"
    },
    dollar: {
        locale: "en-US",
        currency: "USD",
        symbol: "$",
        position: "before"
    },
    euro: {
        locale: "de-DE",
        currency: "EUR",
        symbol: "€",
        position: "after"
    }
};
  

export function formatCurrency(value: number, currency?: Currency) {
  const safeCurrency = currency ?? "real"; 
  const config = currencyMap[safeCurrency];

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: config.currency,
  }).format(value);
}

export function getCurrencySymbol(currency?: Currency) {
  return currencyMap[currency ?? "real"].symbol;
}

export function getCurrencyPlaceholder(currency: Currency) {
    const cfg = currencyMap[currency];
  
    if (cfg.position === "before") {
      return `${cfg.symbol} 0,00`;
    }
  
    return `0,00 ${cfg.symbol}`;
  }
  
