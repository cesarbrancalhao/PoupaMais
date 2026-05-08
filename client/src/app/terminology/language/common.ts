import { Language } from './types';

export const common = {
  add: {
    pt: 'Adicionar',
    en: 'Add',
    es: 'Agregar',
  },
  edit: {
    pt: 'Editar',
    en: 'Edit',
    es: 'Editar',
  },
  delete: {
    pt: 'Excluir',
    en: 'Delete',
    es: 'Eliminar',
  },
  save: {
    pt: 'Salvar',
    en: 'Save',
    es: 'Guardar',
  },
  cancel: {
    pt: 'Cancelar',
    en: 'Cancel',
    es: 'Cancelar',
  },
  confirm: {
    pt: 'Confirmar',
    en: 'Confirm',
    es: 'Confirmar',
  },
  close: {
    pt: 'Fechar',
    en: 'Close',
    es: 'Cerrar',
  },

  loading: {
    pt: 'Carregando...',
    en: 'Loading...',
    es: 'Cargando...',
  },
  success: {
    pt: 'Sucesso',
    en: 'Success',
    es: 'Éxito',
  },
  error: {
    pt: 'Erro',
    en: 'Error',
    es: 'Error',
  },
  viewMore: {
    pt: 'Ver mais',
    en: 'View more',
    es: 'Ver más',
  },

  name: {
    pt: 'Nome',
    en: 'Name',
    es: 'Nombre',
  },
  email: {
    pt: 'Email',
    en: 'Email',
    es: 'Correo electrónico',
  },
  password: {
    pt: 'Senha',
    en: 'Password',
    es: 'Contraseña',
  },
  value: {
    pt: 'Valor',
    en: 'Value',
    es: 'Valor',
  },
  amount: {
    pt: 'Valor',
    en: 'Amount',
    es: 'Monto',
  },
  date: {
    pt: 'Data',
    en: 'Date',
    es: 'Fecha',
  },
  description: {
    pt: 'Descrição',
    en: 'Description',
    es: 'Descripción',
  },
  category: {
    pt: 'Categoria',
    en: 'Category',
    es: 'Categoría',
  },
  source: {
    pt: 'Fonte',
    en: 'Source',
    es: 'Fuente',
  },

  expenses: {
    pt: 'Despesas',
    en: 'Expenses',
    es: 'Gastos',
  },
  income: {
    pt: 'Receitas',
    en: 'Income',
    es: 'Ingresos',
  },
  balance: {
    pt: 'Saldo',
    en: 'Balance',
    es: 'Saldo',
  },
  total: {
    pt: 'Total',
    en: 'Total',
    es: 'Total',
  },

  checkConnection: {
    pt: 'Verifique sua conexão',
    en: 'Check your connection',
    es: 'Verifique su conexión',
  },
  noData: {
    pt: 'Nenhum dado disponível',
    en: 'No data available',
    es: 'No hay datos disponibles',
  },

  yes: {
    pt: 'Sim',
    en: 'Yes',
    es: 'Sí',
  },
  no: {
    pt: 'Não',
    en: 'No',
    es: 'No',
  },

  previous: {
    pt: 'Anterior',
    en: 'Previous',
    es: 'Anterior',
  },
  next: {
    pt: 'Próxima',
    en: 'Next',
    es: 'Siguiente',
  },
  of: {
    pt: 'de',
    en: 'of',
    es: 'de',
  },

  search: {
    pt: 'Buscar...',
    en: 'Search...',
    es: 'Buscar...',
  },
  minValue: {
    pt: 'Valor mínimo',
    en: 'Min value',
    es: 'Valor mínimo',
  },
  maxValue: {
    pt: 'Valor máximo',
    en: 'Max value',
    es: 'Valor máximo',
  },
  allCategories: {
    pt: 'Todas as categorias',
    en: 'All categories',
    es: 'Todas las categorías',
  },
  allSources: {
    pt: 'Todas as fontes',
    en: 'All sources',
    es: 'Todas las fuentes',
  },
  noCategory: {
    pt: 'Sem categoria',
    en: 'No category',
    es: 'Sin categoría',
  },
  noSource: {
    pt: 'Sem fonte',
    en: 'No source',
    es: 'Sin fuente',
  },
} as const;

export type CommonKey = keyof typeof common;

export function getCommonText(key: CommonKey, language: Language): string {
  return common[key][language];
}
