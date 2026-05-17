import { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  CreditCard, 
  Banknote, 
  PiggyBank, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { walletsApi, type Wallet } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';

type WalletType = 'bank' | 'cash' | 'savings';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatAmount } = useCurrency();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as WalletType,
    initialBalance: 0,
  });

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const response = await walletsApi.getAll();
      setWallets(response.data);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      alert('Erreur lors du chargement des portefeuilles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleOpenModal = (wallet?: Wallet) => {
    if (wallet) {
      setEditingWallet(wallet);
      setFormData({
        name: wallet.name,
        type: wallet.type as WalletType,
        initialBalance: wallet.initialBalance,
      });
    } else {
      setEditingWallet(null);
      setFormData({
        name: '',
        type: 'bank',
        initialBalance: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitLoading(true);
      if (editingWallet) {
        await walletsApi.update(editingWallet._id, formData);
      } else {
        await walletsApi.create(formData);
      }
      setIsModalOpen(false);
      fetchWallets();
    } catch (error) {
      console.error('Failed to save wallet:', error);
      alert("Erreur lors de l'enregistrement du portefeuille");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = (wallet: Wallet) => {
    setWalletToDelete(wallet);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!walletToDelete) return;
    setIsDeleting(true);
    try {
      await walletsApi.delete(walletToDelete._id);
      setIsDeleteModalOpen(false);
      setWalletToDelete(null);
      fetchWallets();
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank': return <CreditCard className="w-5 h-5" />;
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'savings': return <PiggyBank className="w-5 h-5" />;
      default: return <WalletIcon className="w-5 h-5" />;
    }
  };

  const pageActions = (
    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Nouveau Portefeuille
    </Button>
  );

  return (
    <Layout title="Mes Portefeuilles" actions={pageActions}>
      <div className="space-y-6">
      {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            Le <strong>solde initial</strong> est le montant présent au moment de la création. 
            Le <strong>solde actuel</strong> est calculé automatiquement à partir de vos transactions et virements.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : wallets.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            <WalletIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Vous n'avez pas encore de portefeuille.</p>
            <p className="text-sm mb-6">Créez votre premier compte pour commencer à suivre vos dépenses.</p>
            <Button onClick={() => handleOpenModal()}>Créer mon premier portefeuille</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <Card key={wallet._id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${
                    wallet.type === 'bank' ? 'bg-blue-100 text-blue-600' :
                    wallet.type === 'savings' ? 'bg-green-100 text-green-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {getWalletIcon(wallet.type)}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(wallet)}>
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(wallet)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{wallet.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-4">
                  {wallet.type === 'bank' ? 'Compte Bancaire' : wallet.type === 'cash' ? 'Espèces' : 'Épargne'}
                </p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-gray-400 uppercase font-medium">Solde Initial</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {formatAmount(wallet.initialBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-gray-500 uppercase font-bold">Solde Actuel</span>
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {formatAmount(wallet.currentBalance ?? wallet.initialBalance)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        
      </div>

      {/* Modal Portefeuille */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">
                {editingWallet ? 'Modifier le portefeuille' : 'Nouveau portefeuille'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nom du portefeuille"
                placeholder="ex: Compte Courant, Portfolio Crypto..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as WalletType })}
                >
                  <option value="bank">Compte Bancaire</option>
                  <option value="cash">Espèces</option>
                  <option value="savings">Épargne</option>
                </select>
              </div>
              
              <Input
                label="Solde initial"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
                required
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 font-semibold"
                  disabled={isSubmitLoading}
                >
                  {isSubmitLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    editingWallet ? 'Enregistrer' : 'Créer'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (isDeleting) return;
          setIsDeleteModalOpen(false);
          setWalletToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer le portefeuille"
        message={
          walletToDelete
            ? `Êtes-vous sûr de vouloir supprimer le portefeuille "${walletToDelete.name}" ? Les transactions associées perdront leur lien.`
            : ''
        }
        confirmLabel="Supprimer"
        isLoading={isDeleting}
      />
    </Layout>
  );
}
