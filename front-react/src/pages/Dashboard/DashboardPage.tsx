import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, ArrowRightLeft } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { transactionsApi, walletsApi, type Transaction, type TransactionSummary, type Wallet as WalletType } from '../../services/api';
import { Link } from 'react-router-dom';
import Select from '../../components/UI/Select';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: any[];
  theme: string;
  formatAmount: (amount: number) => string;
}

const CustomPieTooltip = ({ active, payload, theme, formatAmount }: CustomPieTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload.fill || data.color;
    
    return (
      <div className="p-3 rounded-xl border-none shadow-xl backdrop-blur-md" style={{ 
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`
      }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
          {data.name}
        </p>
        <p className="text-lg font-bold" style={{ color }}>
          {formatAmount(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { formatAmount, currency, rates } = useCurrency();
  const { theme } = useTheme();

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  const convertValue = (amountInMGA: number) => {
    const rate = rates[currency] || 1;
    return amountInMGA * rate;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [summaryRes, transactionsRes, walletsRes] = await Promise.all([
          transactionsApi.getSummary(selectedWalletId),
          transactionsApi.getAll({ walletId: selectedWalletId }),
          walletsApi.getAll(),
        ]);
        setSummary(summaryRes.data);
        setTransactions(transactionsRes.data);
        setWallets(walletsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedWalletId]);

  const recentTransactions = transactions.slice(0, 5);

  // Monthly data for bar chart
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; revenus: number; dépenses: number }>();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthMap.set(key, {
        month: monthNames[date.getMonth()],
        revenus: 0,
        dépenses: 0,
      });
    }

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = monthMap.get(key);
      if (existing) {
        if (t.type === 'income') {
          existing.revenus += convertValue(t.amount);
        } else {
          existing.dépenses += convertValue(t.amount);
        }
      }
    });

    return Array.from(monthMap.values());
  }, [transactions]);

  // Category data for pie chart
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const categoryName = typeof t.category === 'string' ? t.category : t.category?.name || 'Autre';
        const existing = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, existing + convertValue(t.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Balance trend data for area chart
  const balanceTrend = useMemo(() => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let balance = 0;
    const data: { date: string; solde: number }[] = [];
    
    sortedTransactions.forEach((t) => {
      balance += t.type === 'income' ? t.amount : -t.amount;
      const dateStr = new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      data.push({ date: dateStr, solde: convertValue(balance) });
    });

    // Keep only last 10 points for readability
    return data.slice(-10);
  }, [transactions]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout title="Tableau de bord">
      <div className="space-y-8">
        {/* Wallet Selector & Global Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {selectedWalletId 
                ? wallets.find(w => w._id === selectedWalletId)?.name 
                : 'Vue d\'ensemble'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedWalletId ? 'Statistiques de ce compte' : 'Vue consolidée de tous vos comptes'}
            </p>
          </div>
          <div className="w-full md:w-64">
            <Select
              icon={Wallet}
              options={[
                { value: '', label: 'Tous les portefeuilles' },
                ...wallets.map(w => ({ value: w._id, label: w.name })),
              ]}
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenus</p>
                <p className="text-2xl font-bold text-income mt-1">
                  {isLoading ? '...' : formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-income/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-income" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Dépenses</p>
                <p className="text-2xl font-bold text-expense mt-1">
                  {isLoading ? '...' : formatCurrency(summary.totalExpense)}
                </p>
              </div>
              <div className="w-12 h-12 bg-expense/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-expense" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solde</p>
                <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-primary-600' : 'text-expense'}`}>
                  {isLoading ? '...' : formatCurrency(summary.balance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Income vs Expenses */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenus vs Dépenses</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Chargement...</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    className="text-xs" 
                    tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }} 
                    tickFormatter={(v) => {
                      if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                      if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
                      return `${v}`;
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      padding: '12px',
                    }}
                    labelStyle={{
                      color: theme === 'dark' ? '#f3f4f6' : '#111827',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    formatter={(value) => [formatAmount(Number(value) / (rates[currency] || 1))]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={36}
                    content={() => (
                      <div className="flex justify-end gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-income" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-expense" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses</span>
                        </div>
                      </div>
                    )}
                  />
                  <Bar dataKey="revenus" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenus" barSize={20} />
                  <Bar dataKey="dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Dépenses" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Expense Categories Pie Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dépenses par catégorie</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Chargement...</div>
            ) : categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Aucune dépense enregistrée</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomPieTooltip theme={theme} formatAmount={formatAmount} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Balance Trend */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution du solde</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Chargement...</div>
          ) : balanceTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Pas assez de données</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={balanceTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  className="text-xs" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(v) => {
                    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
                    return `${v}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{
                    color: theme === 'dark' ? '#f3f4f6' : '#111827',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}
                  formatter={(value) => [formatAmount(Number(value) / (rates[currency] || 1)), 'Solde']}
                />
                <Area
                  type="monotone"
                  dataKey="solde"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorSolde)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions Récentes</h2>
            <Link to="/transactions">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune transaction pour le moment.{' '}
              <Link to="/transactions" className="text-primary-600 hover:underline">
                Ajouter votre première transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income'
                          ? 'bg-income/10'
                          : transaction.type === 'transfer'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30'
                          : 'bg-expense/10'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-income" />
                      ) : transaction.type === 'transfer' ? (
                        <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-expense" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.category?.name} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-income' : 
                      transaction.type === 'transfer' ? 'text-indigo-600 dark:text-indigo-400' : 
                      'text-expense'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
