import { Moeda } from "@/types/auth";

interface CurrencyInfo {
    locale: string;
    currency: string;
    symbol: string;
    position: "before" | "after";
}
  
const currencyMap: Record<Moeda, CurrencyInfo> = {
    real: {
        locale: "pt-BR",
        currency: "BRL",
        symbol: "R$",
        position: "before"
    },
    dolar: {
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
  

export function formatCurrency(value: number, moeda?: Moeda) {
  const safeMoeda = moeda ?? "real"; 
  const config = currencyMap[safeMoeda];

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: config.currency,
  }).format(value);
}

export function getCurrencySymbol(moeda?: Moeda) {
  return currencyMap[moeda ?? "real"].symbol;
}

export function getCurrencyPlaceholder(moeda: Moeda) {
    const cfg = currencyMap[moeda];
  
    if (cfg.position === "before") {
      return `${cfg.symbol} 0,00`;
    }
  
    return `0,00 ${cfg.symbol}`;
  }
  

