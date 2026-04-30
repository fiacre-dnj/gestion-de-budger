import { useState, useEffect, useMemo, memo } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Calendar, 
  ChartPie, 
  Calculator,
  Trash2,
  Edit2,
  Info,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { useCurrency } from '../../context/CurrencyContext';
import { savingsApi, type SavingGoal } from '../../services/api';
import Input from '../../components/UI/Input';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Memoized components to prevent re-renders when modal state changes
const GoalsGrid = memo(({ goals, onEdit, onDelete, onContribute, formatAmount, calculateMonthsLeft }: any) => (
  <div className="lg:col-span-2 space-y-4">
    {goals.length === 0 ? (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <PiggyBank className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun objectif pour le moment</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Commencez par créer votre premier projet d'épargne !</p>
        <Button variant="outline" onClick={() => onEdit(null)}>Créer un objectif</Button>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal: SavingGoal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const monthsLeft = calculateMonthsLeft(goal.deadline);
          
          return (
            <Card key={goal._id} className="p-5 flex flex-col h-full overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: goal.color }} />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{goal.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Échéance : {new Date(goal.deadline).toLocaleDateString()}</p>
                    {goal.estimatedDate && (
                       <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                           <Sparkles className="w-3 h-3" />
                           Prévu : {new Date(goal.estimatedDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                         </span>
                         {goal.monthlySpeed && goal.monthlySpeed > 0 && (
                           <span className="text-[10px] text-gray-400">({formatAmount(goal.monthlySpeed)}/mois)</span>
                         )}
                       </div>
                     )}
                   </div>
                 </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(goal)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(goal)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progression</span>
                  <span className="font-bold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}
                  />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Actuel</p>
                    <p className="font-bold text-primary-600 text-lg">{formatAmount(goal.currentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Cible</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatAmount(goal.targetAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{monthsLeft} mois restants</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onContribute(goal)}
                  className="text-xs h-8 px-3"
                >
                  Ajouter
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </div>
));

const SidebarStats = memo(({ distributionData, goals, formatAmount, calculateMonthlySavingNeeded }: any) => (
  <div className="space-y-6">
    {/* Distribution Chart */}
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <ChartPie className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Distribution</h3>
      </div>
      <div className="h-[240px] w-full">
        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {distributionData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number | undefined) => val !== undefined ? formatAmount(val) : ''} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <Info className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">Pas encore d'épargne à afficher</p>
          </div>
        )}
      </div>
    </Card>

    {/* Smart Calculator / Tips */}
    <Card className="p-6 bg-primary-600 text-white shadow-xl shadow-primary-600/20">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5" />
        <h3 className="text-lg font-bold">Simulateur Mensuel</h3>
      </div>
      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.filter((g: SavingGoal) => g.currentAmount < g.targetAmount).slice(0, 2).map((goal: SavingGoal) => (
            <div key={goal._id} className="p-3 bg-white/10 rounded-xl border border-white/10">
              <p className="text-xs text-primary-100 mb-1">{goal.title}</p>
              <div className="flex justify-between items-end">
                <p className="text-lg font-bold">{formatAmount(calculateMonthlySavingNeeded(goal))} <span className="text-xs font-normal">/ mois</span></p>
                {goal.monthlySpeed && goal.monthlySpeed > 0 && (
                  <div className={`text-[10px] px-1.5 py-0.5 rounded ${goal.monthlySpeed >= calculateMonthlySavingNeeded(goal) ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                    Actuel: {formatAmount(goal.monthlySpeed)}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-primary-100">Fixez des objectifs pour voir vos besoins d'épargne mensuels.</p>
        )}
        <div className="pt-2">
          <p className="text-xs opacity-80 flex items-start gap-2 leading-tight">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Conseil : Mettez l'argent de côté dès le début du mois (Pay yourself first).
          </p>
        </div>
      </div>
    </Card>
  </div>
));

export default function SavingsPage() {
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    color: '#4f46e5'
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await savingsApi.getGoals();
      setGoals(response.data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedGoal) {
        await savingsApi.updateGoal(selectedGoal._id, {
          ...formData,
          targetAmount: Number(formData.targetAmount)
        });
      } else {
        await savingsApi.createGoal({
          ...formData,
          targetAmount: Number(formData.targetAmount)
        });
      }
      setIsModalOpen(false);
      fetchGoals();
      resetForm();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount) return;
    try {
      await savingsApi.addContribution(selectedGoal._id, Number(contributionAmount));
      setIsContributionModalOpen(false);
      setContributionAmount('');
      fetchGoals();
    } catch (error) {
      console.error('Failed to add contribution:', error);
    }
  };

  const handleDelete = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedGoal) return;
    try {
      setIsDeleting(true);
      await savingsApi.deleteGoal(selectedGoal._id);
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: '',
      deadline: '',
      color: '#4f46e5'
    });
    setSelectedGoal(null);
  };

  const calculateMonthsLeft = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(0, diffMonths);
  };

  const calculateMonthlySavingNeeded = (goal: SavingGoal) => {
    const months = calculateMonthsLeft(goal.deadline);
    const remaining = goal.targetAmount - goal.currentAmount;
    if (months <= 0) return remaining > 0 ? remaining : 0;
    return remaining / months;
  };

  const distributionData = useMemo(() => goals.map((g: SavingGoal) => ({
    name: g.title,
    value: g.currentAmount,
    color: g.color
  })).filter((d: { name: string; value: number }) => d.value > 0), [goals]);

  const usedColors = useMemo(() => new Set(goals.map(g => g.color.toLowerCase())), [goals]);

  const isColorUsed = (color: string) => {
    const lowerColor = color.toLowerCase();
    // If we are editing, we don't count the current goal's color as "used" by someone else
    if (selectedGoal && selectedGoal.color.toLowerCase() === lowerColor) return false;
    return usedColors.has(lowerColor);
  };

  const totalSaved = useMemo(() => goals.reduce((sum: number, g: SavingGoal) => sum + g.currentAmount, 0), [goals]);

  const pageActions = (
    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Nouvel Objectif
    </Button>
  );

  if (loading && goals.length === 0) {
    return (
      <Layout title="Épargne">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const handleOpenEditModal = (goal: SavingGoal | null) => {
    if (goal) {
      setSelectedGoal(goal);
      setFormData({
        title: goal.title,
        targetAmount: goal.targetAmount.toString(),
        deadline: goal.deadline.split('T')[0],
        color: goal.color
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleOpenContributionModal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setIsContributionModalOpen(true);
  };

  return (
    <Layout title="Gestion de l'Épargne" actions={pageActions}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            Définissez vos <strong>objectifs d'épargne</strong> et suivez votre progression. L'analyse prédictive estime la date d'achèvement en fonction de votre <strong>vitesse réelle</strong> sur les 3 derniers mois.
          </p>
        </div>
        
        {/* Header Summary */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vos Projets d'Épargne</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total épargné : <span className="font-bold text-primary-600">{formatAmount(totalSaved)}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GoalsGrid 
            goals={goals}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
            onContribute={handleOpenContributionModal}
            formatAmount={formatAmount}
            calculateMonthsLeft={calculateMonthsLeft}
          />
          
          <SidebarStats 
            distributionData={distributionData}
            goals={goals}
            formatAmount={formatAmount}
            calculateMonthlySavingNeeded={calculateMonthlySavingNeeded}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={selectedGoal ? 'Modifier l\'objectif' : 'Nouvel objectif d\'épargne'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                label="Titre"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Vacances d'été, Mac Studio..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cible"
                type="number"
                required
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              />
              <Input
                label="Date limite"
                type="date"
                icon={Calendar}
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Couleur</label>
                {isColorUsed(formData.color) && (
                  <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Déjà utilisée
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-primary-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* Custom Color Picker */}
                <div className="relative group">
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-gray-50 dark:bg-gray-700 transition-all ${
                      !COLORS.includes(formData.color) ? 'border-primary-600 scale-110 shadow-sm' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400'
                    }`}
                    style={!COLORS.includes(formData.color) ? { backgroundColor: formData.color } : {}}
                    onClick={() => document.getElementById('custom-color')?.click()}
                  >
                    <Plus className={`w-4 h-4 ${!COLORS.includes(formData.color) ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                  <input
                    id="custom-color"
                    type="color"
                    className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button type="submit" className="flex-1">Enregistrer</Button>
            </div>
          </form>
        </Modal>

        {/* Contribution Modal */}
        <Modal 
          isOpen={isContributionModalOpen} 
          onClose={() => setIsContributionModalOpen(false)}
          title={`Ajouter à "${selectedGoal?.title}"`}
        >
          <form onSubmit={handleContribute} className="space-y-4">
            <Input
              label="Montant du versement"
              type="number"
              required
              autoFocus
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="text-2xl font-bold text-primary-600"
            />
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsContributionModalOpen(false)}>Annuler</Button>
              <Button type="submit" className="flex-1">Confirmer</Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Supprimer l'objectif"
          message={`Êtes-vous sûr de vouloir supprimer l'objectif "${selectedGoal?.title}" ? Cette action est irréversible.`}
          isLoading={isDeleting}
        />

      </div>
    </Layout>
  );
}
