import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Repeat, 
  TrendingUp,
  CreditCard,
  Edit2,
  AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { useCurrency } from '../../context/CurrencyContext';
import { subscriptionsApi, categoriesApi, walletsApi, type Subscription, type Category, type Wallet } from '../../services/api';

export default function SubscriptionsPage() {
  const { formatAmount } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [summary, setSummary] = useState({ totalMonthly: 0, count: 0 });

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    walletId: '',
    billingDate: '1',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, catsRes, walletsRes, summaryRes] = await Promise.all([
        subscriptionsApi.getAll(),
        categoriesApi.getAll('expense'),
        walletsApi.getAll(),
        subscriptionsApi.getSummary(),
      ]);
      setSubscriptions(subsRes.data);
      setCategories(catsRes.data);
      setWallets(walletsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
        billingDate: Number(formData.billingDate),
      };

      if (editingSub) {
        await subscriptionsApi.update(editingSub._id, data);
      } else {
        await subscriptionsApi.create(data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await subscriptionsApi.delete(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      categoryId: sub.categoryId._id,
      walletId: sub.walletId._id,
      billingDate: sub.billingDate.toString(),
      description: sub.description || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      categoryId: categories[0]?._id || '',
      walletId: wallets.find(w => w.type === 'bank')?._id || wallets[0]?._id || '',
      billingDate: '1',
      description: '',
    });
    setEditingSub(null);
  };

  const pageActions = (
    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Nouvelle dépense
    </Button>
  );

  return (
    <Layout title="Dépenses Récurrentes" actions={pageActions}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            Les <strong>dépenses récurrentes</strong> sont des charges qui se répètent chaque mois. 
            Elles sont automatiquement prises en compte dans vos <strong>analyses mensuelles</strong> et votre <strong>santé financière</strong>.
          </p>
        </div>
        
        {/* Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-primary-600 text-white border-none shadow-lg shadow-primary-600/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <p className="text-primary-100 text-sm">Total mensuel récurrent</p>
                <p className="text-3xl font-bold">{formatAmount(summary.totalMonthly)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-l-4 border-l-primary-600">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre de dépenses</p>
                <p className="text-2xl font-bold">{summary.count}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-income">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-income/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-income" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Impact annuel</p>
                <p className="text-2xl font-bold">{formatAmount(summary.totalMonthly * 12)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vos dépenses récurrentes</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subscriptions.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                Aucune dépense récurrente enregistrée.
              </div>
            ) : (
              subscriptions.map((sub) => (
                <Card key={sub._id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                        <Repeat className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white capitalize">{sub.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{sub.categoryId?.name || 'Sans catégorie'}</p>
                          <span className="text-[10px] text-gray-300">•</span>
                          <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                            {sub.walletId?.name || 'Sans portefeuille'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">{formatAmount(sub.amount)}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        Chaque {sub.billingDate} du mois
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs">
                      {sub.description && (
                         <span className="text-gray-400 italic">"{sub.description}"</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(sub)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sub._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? "Modifier la dépense récurrente" : "Nouvelle dépense récurrente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ex: Netflix, Loyer, Sport..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
            <Input
              label="Jour de prélèvement"
              type="number"
              min="1"
              max="31"
              value={formData.billingDate}
              onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Catégorie"
              options={categories.map(c => ({ value: c._id, label: c.name }))}
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            />
            <Select
              label="Portefeuille débité"
              options={wallets.map(w => ({ value: w._id, label: w.name }))}
              value={formData.walletId}
              onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
              required
            />
          </div>
          <Input
            label="Description (Optionnel)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">{editingSub ? 'Mettre à jour' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la dépense récurrente"
        message="Êtes-vous sûr de vouloir supprimer cette dépense récurrente ? Cette action est irréversible."
        isLoading={isDeleting}
      />
    </Layout>
  );
}
