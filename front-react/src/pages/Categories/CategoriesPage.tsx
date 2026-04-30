import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import { categoriesApi, type Category } from '../../services/api';
import ConfirmModal from '../../components/UI/ConfirmModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    monthlyBudget: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, {
          ...formData,
          monthlyBudget: formData.monthlyBudget ? Number(formData.monthlyBudget) : undefined
        });
      } else {
        await categoriesApi.create({
          ...formData,
          monthlyBudget: formData.monthlyBudget ? Number(formData.monthlyBudget) : undefined
        });
      }
      
      setIsModalOpen(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de l\'enregistrement de la catégorie');
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await categoriesApi.delete(categoryToDelete._id);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Échec de la suppression de la catégorie');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      monthlyBudget: category.monthlyBudget?.toString() || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      monthlyBudget: '',
    });
    setError('');
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const pageActions = (
    <Button onClick={() => { resetForm(); setEditingCategory(null); setIsModalOpen(true); }} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Ajouter une catégorie
    </Button>
  );

  const CategoryCard = ({ category }: { category: Category }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          category.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
        }`}>
          {category.type === 'income' ? (
            <TrendingUp className="w-5 h-5 text-income" />
          ) : (
            <TrendingDown className="w-5 h-5 text-expense" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
          <div className="flex items-center gap-2">
            {category.isDefault && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Par défaut</span>
            )}
            {category.monthlyBudget && (
              <span className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                Budget: {category.monthlyBudget}€
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleEdit(category)}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(category)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <Layout title="Catégories" actions={pageActions}>
      <div className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            Les <strong>catégories</strong> vous permettent de classer vos transactions. 
            Définissez un <strong>budget mensuel</strong> pour suivre vos dépenses et optimiser votre santé financière.
          </p>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-income/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-income" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Catégories de revenus</h2>
              </div>
              
              {incomeCategories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune catégorie de revenu</p>
              ) : (
                <div className="space-y-3">
                  {incomeCategories.map((category) => (
                    <CategoryCard key={category._id} category={category} />
                  ))}
                </div>
              )}
            </Card>

            {/* Expense Categories */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-expense/10 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-expense" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Catégories de dépenses</h2>
              </div>
              
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune catégorie de dépense</p>
              ) : (
                <div className="space-y-3">
                  {expenseCategories.map((category) => (
                    <CategoryCard key={category._id} category={category} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Select
            label="Type"
            options={[
              { value: 'expense', label: 'Dépense' },
              { value: 'income', label: 'Revenu' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
            required
          />

          <Input
            label="Budget mensuel (Optionnel)"
            type="number"
            value={formData.monthlyBudget}
            onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
            placeholder="ex: 300"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {editingCategory ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={isDeleting}
      />
    </Layout>
  );
}
