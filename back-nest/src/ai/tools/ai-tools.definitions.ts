import { LlmToolDefinition } from '../providers/llm.types';

export const AI_TOOL_DEFINITIONS: LlmToolDefinition[] = [
  {
    name: 'list_wallets',
    description: 'Liste les portefeuilles de l\'utilisateur avec leur solde actuel',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_categories',
    description: 'Liste les catégories de revenus ou dépenses',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: 'Filtrer par type' },
      },
      required: [],
    },
  },
  {
    name: 'create_transaction',
    description: 'Crée une transaction (dépense, revenu ou virement). Utilise les noms de portefeuille/catégorie si l\'ID est inconnu.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Titre de la transaction' },
        amount: { type: 'number', description: 'Montant en devise de l\'utilisateur' },
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
        date: { type: 'string', description: 'Date ISO (YYYY-MM-DD), défaut: aujourd\'hui' },
        walletName: { type: 'string', description: 'Nom du portefeuille source' },
        categoryName: { type: 'string', description: 'Nom de la catégorie' },
        toWalletName: { type: 'string', description: 'Portefeuille destination (virement)' },
        description: { type: 'string' },
      },
      required: ['title', 'amount', 'type'],
    },
  },
  {
    name: 'get_transactions_summary',
    description: 'Résumé des revenus, dépenses et solde (mois en cours par défaut)',
    parameters: {
      type: 'object',
      properties: {
        walletName: { type: 'string', description: 'Filtrer par portefeuille' },
      },
      required: [],
    },
  },
  {
    name: 'list_saving_goals',
    description: 'Liste les objectifs d\'épargne avec progression',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'add_saving_contribution',
    description: 'Ajoute une contribution à un objectif d\'épargne',
    parameters: {
      type: 'object',
      properties: {
        goalName: { type: 'string', description: 'Nom de l\'objectif (recherche partielle)' },
        amount: { type: 'number', description: 'Montant à ajouter' },
      },
      required: ['goalName', 'amount'],
    },
  },
  {
    name: 'get_monthly_analysis',
    description: 'Analyse mensuelle: dépenses par catégorie, tendances',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'integer', description: 'Mois 1-12' },
        year: { type: 'integer', description: 'Année' },
      },
      required: [],
    },
  },
  {
    name: 'get_financial_health',
    description: 'Score et indicateurs de santé financière avec recommandations',
    parameters: { type: 'object', properties: {}, required: [] },
  },
];
