import { useEffect, useState } from 'react';
import { Plus, Download, Edit2, Trash2, TrendingUp, TrendingDown, Filter, Tags, Calendar, RotateCcw, UploadCloud } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import { transactionsApi, categoriesApi, importApi, walletsApi, type Transaction, type Category, type Wallet } from '../../services/api';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { Wallet as WalletIcon, ArrowRightLeft, AlertCircle } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { formatAmount, currency, rates } = useCurrency();
  const [filter, setFilter] = useState({
    type: '',
    category: '',
    walletId: '',
    startDate: '',
    endDate: '',
  });

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    category: '',
    walletId: '',
    toWalletId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, walletsRes] = await Promise.all([
        transactionsApi.getAll(filter),
        categoriesApi.getAll(),
        walletsApi.getAll(),
      ]);
      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
      setWallets(walletsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rate = rates[currency] || 1;
    const amountInMGA = parseFloat(formData.amount) / rate;

    const data: any = {
      ...formData,
      amount: amountInMGA,
    };

    // Cleanup: remove category if empty for transfer, or remove toWalletId if not a transfer
    if (data.type === 'transfer') {
      if (!data.category) delete data.category;
    } else {
      delete data.toWalletId;
    }

    try {
      if (editingTransaction) {
        await transactionsApi.update(editingTransaction._id, data);
      } else {
        await transactionsApi.create(data);
      }
      
      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    try {
      await transactionsApi.delete(transactionToDelete);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    const rate = rates[currency] || 1;
    const displayAmount = transaction.amount * rate;
    
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: displayAmount.toFixed(2),
      type: transaction.type,
      category: typeof transaction.category === 'string' ? transaction.category : (transaction.category?._id || ''),
      walletId: transaction.walletId,
      toWalletId: transaction.toWalletId || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
      description: transaction.description || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      walletId: '',
      toWalletId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const handleResetFilters = () => {
    setFilter({
      type: '',
      category: '',
      walletId: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const res = await importApi.uploadCsv(file);
      setImportedRows(res.data);
      setIsImportModalOpen(true);
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      alert('Erreur lors du parsing du fichier CSV.');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const confirmImport = async () => {
    try {
      setIsLoading(true);
      await transactionsApi.createBulk(importedRows);
      setIsImportModalOpen(false);
      setImportedRows([]);
      fetchData();
    } catch (error) {
      console.error('Failed to import transactions:', error);
      alert('Erreur lors de l\'import des transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await transactionsApi.export(filter);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button 
        onClick={() => { resetForm(); setEditingTransaction(null); setIsModalOpen(true); }}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Nouvelle Transaction
      </Button>
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleImportFile}
          className="absolute inset-0 opacity-0 cursor-pointer"
          title="Importer un fichier CSV"
          disabled={isImporting}
        />
        <Button 
          variant="outline" 
          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={isImporting}
        >
          <UploadCloud className={`w-4 h-4 mr-2 ${isImporting ? 'animate-bounce' : ''}`} />
          {isImporting ? 'Parsing...' : 'Importer'}
        </Button>
      </div>
      <Button 
        variant="outline" 
        onClick={handleExport}
        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Download className="w-4 h-4 mr-2" />
        Exporter
      </Button>
    </div>
  );

  return (
    <Layout title="Transactions" actions={pageActions}>
      <div className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            Consultez et gérez l'ensemble de vos <strong>flux financiers</strong>. Les <strong>virements internes</strong> (en indigo) n'impactent pas votre bénéfice global mais ajustent les soldes de vos portefeuilles.
          </p>
        </div>
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="min-w-[160px]">
              <Select
                icon={Filter}
                options={[
                  { value: '', label: 'Tous les types' },
                  { value: 'income', label: 'Revenu' },
                  { value: 'expense', label: 'Dépense' },
                  { value: 'transfer', label: 'Virement' },
                ]}
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                icon={Tags}
                options={[
                  { value: '', label: 'Toutes les catégories' },
                  ...categories.map(c => ({ value: c._id, label: c.name })),
                ]}
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              />
            </div>
            <div className="min-w-[200px]">
              <Select
                icon={WalletIcon}
                options={[
                  { value: '', label: 'Tous les portefeuilles' },
                  ...wallets.map(w => ({ value: w._id, label: w.name })),
                ]}
                value={filter.walletId}
                onChange={(e) => setFilter({ ...filter, walletId: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Input
                icon={Calendar}
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              />
            </div>
            <div className="w-40">
              <Input
                icon={Calendar}
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              />
            </div>
            {(filter.type || filter.category || filter.walletId || filter.startDate || filter.endDate) && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <Card>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune transaction trouvée. Ajoutez votre première transaction !
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Titre</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Catégorie</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Portefeuille</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Montant</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {transaction.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeof transaction.category === 'string' ? transaction.category : transaction.category?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {wallets.find(w => w._id === transaction.walletId)?.name || 'Portefeuille inconnu'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income'
                            ? 'bg-income/10 text-income'
                            : transaction.type === 'expense'
                            ? 'bg-expense/10 text-expense'
                             : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : transaction.type === 'expense' ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <ArrowRightLeft className="w-3 h-3" />
                          )}
                          {transaction.type === 'income' ? 'revenu' : transaction.type === 'expense' ? 'dépense' : 'virement'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${
                         transaction.type === 'income' ? 'text-income' : transaction.type === 'expense' ? 'text-expense' : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                        {transaction.type === 'transfer' && (
                          <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                            Vers {wallets.find(w => w._id === transaction.toWalletId)?.name || '...'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Montant (${currency === 'MGA' ? 'Ar' : currency})`}
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: 'expense', label: 'Dépense / Achat' },
                { value: 'income', label: 'Revenu' },
                { value: 'transfer', label: 'Virement interne' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: '' })}
              required
            />
            {formData.type === 'transfer' ? (
               <Select
               label="Catégorie (Optionnelle)"
               options={[
                 { value: '', label: 'Virement interne' },
                 ...categories.map(c => ({ value: c._id, label: c.name })),
               ]}
               value={formData.category}
               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
             />
            ) : (
              <Select
                label="Catégorie"
                options={[
                  { value: '', label: 'Sélectionner une catégorie' },
                  ...filteredCategories.map(c => ({ value: c._id, label: c.name })),
                ]}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            )}
            <div className="md:col-span-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700">
              {formData.type === 'expense' && "Utilisez 'Dépense' pour vos achats (ex: boutique, loyer). Choisissez le compte qui sera débité."}
              {formData.type === 'transfer' && "Utilisez 'Virement' uniquement pour déplacer de l'argent entre VOS comptes (ex: retrait d'espèces)."}
              {formData.type === 'income' && "Utilisez 'Revenu' pour les entrées d'argent extérieures (ex: salaire, virement d'un ami)."}
            </div>
          </div>

          <div className={`grid gap-4 ${formData.type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Select
              label={formData.type === 'transfer' ? "Compte Source" : "Portefeuille"}
              options={[
                { value: '', label: 'Sélectionner un portefeuille' },
                ...wallets.map(w => ({ value: w._id, label: w.name })),
              ]}
              value={formData.walletId}
              onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
              required
            />
            {formData.type === 'transfer' && (
              <Select
                label="Compte Destination"
                options={[
                  { value: '', label: 'Sélectionner un portefeuille' },
                  ...wallets.map(w => ({ value: w._id, label: w.name })).filter(o => o.value !== formData.walletId),
                ]}
                value={formData.toWalletId}
                onChange={(e) => setFormData({ ...formData, toWalletId: e.target.value })}
                required
              />
            )}
          </div>

          <Input
            label="Description (optionnel)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {editingTransaction ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer la transaction"
        message="Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible."
        confirmLabel="Supprimer"
        isLoading={isDeleting}
      />
      {/* CSV Import Preview Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => { if (!isLoading) setIsImportModalOpen(false); }}
        title="Prévisualisation de l'import"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {importedRows.length} transactions détectées. Vérifiez les données avant de confirmer.
          </p>
          <div className="max-h-[400px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {importedRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{formatDate(row.date)}</td>
                    <td className="px-4 py-2">{row.description}</td>
                    <td className={`px-4 py-2 text-right font-medium ${row.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {formatAmount(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={confirmImport} disabled={isLoading}>
              {isLoading ? 'Importation...' : 'Confirmer l\'import'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
