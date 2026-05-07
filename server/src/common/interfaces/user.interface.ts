export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  idioma: 'portugues' | 'ingles' | 'espanhol';
  moeda: 'real' | 'dolar' | 'euro';
  created_at: Date;
}

export interface CategoriaDespesa {
  id: number;
  nome: string;
  cor: string;
  created_at: Date;
  usuario_id: number;
}

export interface FonteReceita {
  id: number;
  nome: string;
  cor: string;
  created_at: Date;
  usuario_id: number;
}

export interface Despesa {
  id: number;
  nome: string;
  valor: number;
  recorrente: boolean;
  data: Date;
  data_vencimento: Date | null;
  created_at: Date;
  categoria_despesa_id: number | null;
  usuario_id: number;
}

export interface Receita {
  id: number;
  nome: string;
  valor: number;
  recorrente: boolean;
  data: Date;
  data_vencimento: Date | null;
  created_at: Date;
  fonte_receita_id: number | null;
  usuario_id: number;
}

export interface Meta {
  id: number;
  nome: string;
  valor: number;
  economia_mensal: number;
  data_inicio: Date;
  created_at: Date;
  usuario_id: number;
}
