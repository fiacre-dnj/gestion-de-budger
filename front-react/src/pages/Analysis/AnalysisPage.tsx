import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  Lightbulb, 
  TrendingUp as TrendingUpIcon,
  PiggyBank,
  CheckCircle2,
  Info,
  Clock,
  FileText,
  Printer
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Select from '../../components/UI/Select';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { analysisApi, reportsApi, walletsApi, type MonthlyAnalysis, type AnnualAnalysis, type FinancialHealth, type Wallet } from '../../services/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const MONTH_NAMES = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

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

export default function AnalysisPage() {
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalysis | null>(null);
  const [annualData, setAnnualData] = useState<AnnualAnalysis[]>([]);
  const [healthData, setHealthData] = useState<FinancialHealth | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportSelectorOpen, setIsReportSelectorOpen] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      let res;
      if (reportType === 'annual') {
        res = await reportsApi.getAnnual(reportYear);
      } else {
        res = await reportsApi.getMonthly(reportMonth, reportYear);
      }
      setReportData(res.data);
      setIsReportSelectorOpen(false);
      setIsReportModalOpen(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!reportData) return;
    const isAnnual = reportData.reportType === 'annual';
    const period = isAnnual 
      ? reportData.period.year.toString()
      : (reportData.period.month ? `${MONTH_NAMES[reportData.period.month - 1]} ${reportData.period.year}` : reportData.period.year.toString());
    const genDate = reportData.generatedAt 
      ? new Date(reportData.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    // Build income rows
    const incomeRows = (reportData.incomeCategories || []).map((c: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#16a34a;font-weight:600">${formatAmount(c.amount)}</td></tr>`
    ).join('');

    // Build expense rows
    const expenseRows = (reportData.expenseCategories || []).map((c: any) => {
      const budget = isAnnual ? (c.monthlyBudget ? c.monthlyBudget * 12 : null) : c.monthlyBudget;
      const budgetCol = budget ? formatAmount(budget) : '—';
      const over = budget && c.amount > budget;
      const statusCol = budget ? (over ? '<span style="color:#dc2626">Depasse</span>' : '<span style="color:#16a34a">OK</span>') : '—';
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280">${budgetCol}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;font-weight:600">${formatAmount(c.amount)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${statusCol}</td></tr>`;
    }).join('');

    // Build monthly trend rows (Annual Only)
    let trendHtml = '';
    if (isAnnual && reportData.monthlyTrend) {
      const trendRows = reportData.monthlyTrend
        .filter((m: any) => m.income > 0 || m.expenses > 0)
        .map((m: any) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${m.monthName}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#16a34a">${formatAmount(m.income)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626">${formatAmount(m.expenses)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:${m.balance >= 0 ? '#16a34a' : '#dc2626'}">${formatAmount(m.balance)}</td>
          </tr>
        `).join('');
      
      trendHtml = `
        <h2>Evolution Mensuelle</h2>
        <table>
          <thead class="gray">
            <tr>
              <th style="text-align:left">Mois</th>
              <th style="text-align:right">Revenus</th>
              <th style="text-align:right">Depenses</th>
              <th style="text-align:right">Solde</th>
            </tr>
          </thead>
          <tbody>${trendRows}</tbody>
        </table>
      `;
    }

    // Build wallet breakdown rows
    const walletRows = (reportData.walletBreakdown || []).map((w: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${w.name} <span style="font-size:10px;color:#9ca3af;text-transform:uppercase">(${w.type})</span></td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:${w.balance >= 0 ? '#1f2937' : '#dc2626'}">${formatAmount(w.balance)}</td></tr>`
    ).join('');

    // Build subscription rows
    const subRows = (reportData.subscriptions?.active || []).map((s: any) => {
      const col2 = isAnnual ? formatAmount(s.amount) : `${s.billingDate} du mois`;
      const col3 = isAnnual ? formatAmount(s.amount * 12) : formatAmount(s.amount);
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${col2}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${col3}</td></tr>`;
    }).join('');

    // Build tips
    const tipsHtml = (reportData.tips || []).map((t: any) =>
      `<div style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:6px"><strong>${t.title}</strong><br/><span style="font-size:12px;color:#6b7280">${t.message}</span></div>`
    ).join('');

    // Budget alerts
    const alertsHtml = (reportData.budgetAlerts || []).map((a: any) =>
      `<div style="display:flex;justify-content:space-between;padding:6px 12px;background:#fef2f2;border-radius:6px;margin-bottom:4px;font-size:13px;color:#b91c1c"><span>${a.name}</span><span style="font-weight:600">Depassement de ${formatAmount(a.over)}</span></div>`
    ).join('');

    const balanceColor = reportData.summary.netBalance >= 0 ? '#16a34a' : '#dc2626';
    const diffPct = reportData.comparison?.diffPercentage ?? 0;
    const diffColor = diffPct > 0 ? '#dc2626' : '#16a34a';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bilan Financier - ${period}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 32px; max-width: 800px; margin: 0 auto; font-size: 14px; }
  h1 { font-size: 22px; margin-bottom: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 24px 0 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
  .header-right { text-align: right; }
  .header-right .label { font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; }
  .header-right .value { font-size: 28px; font-weight: 700; color: ${balanceColor}; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
  .card .value { font-size: 18px; font-weight: 700; }
  .card .sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .card.green { background: #f0fdf4; border-color: #bbf7d0; }
  .card.green .label { color: #16a34a; }
  .card.green .value { color: #15803d; }
  .card.red { background: #fef2f2; border-color: #fecaca; }
  .card.red .label { color: #dc2626; }
  .card.red .value { color: #b91c1c; }
  .card.blue { background: #eff6ff; border-color: #bfdbfe; }
  .card.blue .label { color: #2563eb; }
  .card.blue .value { color: #1d4ed8; }
  .card.purple { background: #faf5ff; border-color: #e9d5ff; }
  .card.purple .label { color: #9333ea; }
  .card.purple .value { color: #7e22ce; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  thead th { padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; border-bottom: 2px solid #d1d5db; }
  thead.green th { background: #f0fdf4; color: #15803d; }
  thead.red th { background: #fef2f2; color: #b91c1c; }
  thead.gray th { background: #f9fafb; color: #4b5563; }
  tfoot td { padding: 8px 12px; font-weight: 700; border-top: 2px solid #d1d5db; background: #f9fafb; }
  .variation { padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border: 1px solid ${diffPct > 0 ? '#fecaca' : '#bbf7d0'}; background: ${diffPct > 0 ? '#fef2f2' : '#f0fdf4'}; }
  .rule-box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .rule-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
  .rule-item:last-child { border-bottom: none; }
  .sub-text { font-size: 12px; color: #9ca3af; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${isAnnual ? 'Bilan Financier Annuel' : 'Bilan Financier Mensuel'}</h1>
      <div class="sub-text">Periode : ${period}</div>
      <div class="sub-text">Genere le ${genDate}</div>
    </div>
    <div class="header-right">
      <div class="label">Solde Net Total</div>
      <div class="value">${formatAmount(reportData.summary.netBalance)}</div>
    </div>
  </div>

  <div class="cards">
    <div class="card green">
      <div class="label">${isAnnual ? 'Revenus Annuels' : 'Revenus'}</div>
      <div class="value">${formatAmount(reportData.summary.totalIncome)}</div>
      ${isAnnual ? `<div class="sub">Moyenne: ${formatAmount(reportData.summary.avgMonthlyIncome)}/m</div>` : ''}
    </div>
    <div class="card red">
      <div class="label">${isAnnual ? 'Depenses Annuelles' : 'Depenses'}</div>
      <div class="value">${formatAmount(reportData.summary.totalExpenses)}</div>
      ${isAnnual ? `<div class="sub">Moyenne: ${formatAmount(reportData.summary.avgMonthlyExpenses)}/m</div>` : ''}
    </div>
    <div class="card blue">
      <div class="label">${isAnnual ? 'Solde Mensuel Moyen' : 'Reste a vivre'}</div>
      <div class="value">${isAnnual ? formatAmount(reportData.summary.avgMonthlyBalance) : formatAmount(reportData.remainingToLive)}</div>
    </div>
    <div class="card purple">
      <div class="label">${isAnnual ? 'Meilleur Mois' : 'Projete fin de mois'}</div>
      <div class="value">${isAnnual ? (reportData.bestMonth?.monthName || '—') : formatAmount(reportData.summary.predictedEndOfMonth)}</div>
      ${isAnnual && reportData.bestMonth ? `<div class="sub">Solde: ${formatAmount(reportData.bestMonth.balance)}</div>` : ''}
    </div>
  </div>

  ${trendHtml}

  ${!isAnnual && reportData.comparison ? `<div class="variation"><strong>Variation vs mois precedent :</strong> <span style="color:${diffColor};font-weight:700">${diffPct > 0 ? '+' : ''}${diffPct}%</span>${reportData.comparison.prevMonthExpenses > 0 ? ` <span style="color:#6b7280">(${formatAmount(reportData.comparison.prevMonthExpenses)} le mois dernier)</span>` : ''}</div>` : ''}

  ${incomeRows ? `<h2>Detail des Revenus</h2><table><thead class="green"><tr><th>Categorie</th><th style="text-align:right">Montant</th></tr></thead><tbody>${incomeRows}</tbody><tfoot><tr><td>Total Revenus</td><td style="text-align:right;color:#16a34a">${formatAmount(reportData.summary.totalIncome)}</td></tr></tfoot></table>` : ''}

  ${expenseRows ? `<h2>Detail des Depenses</h2><table><thead class="red"><tr><th>Categorie</th><th style="text-align:right">${isAnnual ? 'Budget Annuel' : 'Budget'}</th><th style="text-align:right">${isAnnual ? 'Total Depense' : 'Depense'}</th><th style="text-align:right">Statut</th></tr></thead><tbody>${expenseRows}</tbody><tfoot><tr><td>Total Depenses</td><td></td><td style="text-align:right;color:#dc2626">${formatAmount(reportData.summary.totalExpenses)}</td><td></td></tr></tfoot></table>` : ''}
  
  ${walletRows ? `<h2>Repartition par Portefeuille</h2><table style="margin-bottom:20px"><thead class="gray"><tr><th style="text-align:left">Compte</th><th style="text-align:right">Solde en fin de periode</th></tr></thead><tbody>${walletRows}</tbody></table>` : ''}

  ${subRows ? `<h2>Charges Fixes & Dépenses Récurrentes (${reportData.subscriptions.count})</h2><table><thead class="gray"><tr><th>Nom</th><th style="text-align:center">${isAnnual ? 'Par mois' : 'Jour'}</th><th style="text-align:right">${isAnnual ? 'Total Annuel' : 'Montant'}</th></tr></thead><tbody>${subRows}</tbody><tfoot><tr><td colspan="2">${isAnnual ? 'Total Cumule Annuel' : 'Total Mensuel'}</td><td style="text-align:right;color:#16a34a">${formatAmount(isAnnual ? reportData.subscriptions.annualTotal : reportData.subscriptions.total)}</td></tr></tfoot></table>` : ''}

  <h2>Regle 50/30/20</h2>
  <div class="rule-box">
    <div class="rule-item"><span>Besoins</span><span><strong>${reportData.healthScore.needsPct}%</strong> / 50%</span></div>
    <div class="rule-item"><span>Envies</span><span><strong>${reportData.healthScore.wantsPct}%</strong> / 30%</span></div>
    <div class="rule-item"><span>Epargne</span><span><strong>${reportData.healthScore.savingsPct}%</strong> / 20%</span></div>
  </div>

  ${alertsHtml && !isAnnual ? `<h2>Alertes Budgetaires</h2>${alertsHtml}` : ''}
  ${tipsHtml ? `<h2>Conseils & Recommandations</h2>${tipsHtml}` : ''}
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [monthlyRes, annualRes, healthRes, walletsRes] = await Promise.all([
          analysisApi.getMonthly(selectedMonth, selectedYear, selectedWalletId),
          analysisApi.getAnnual(selectedYear, selectedWalletId),
          analysisApi.getHealth(), // Health is global for now as it's a mix of all
          walletsApi.getAll(),
        ]);
        setMonthlyData(monthlyRes.data);
        setAnnualData(annualRes.data);
        setHealthData(healthRes.data);
        setWallets(walletsRes.data);
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, selectedWalletId]);

  if (loading) {
    return (
      <Layout title="Analyse Financière">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const expenseBreakdown = monthlyData?.categoryBreakdown.filter(c => c.type === 'expense') || [];

  const RuleCard = ({ label, percentage, target, color }: { label: string, percentage: number, target: string, color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{percentage.toFixed(0)}% / {target}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <Layout 
      title="Analyse Financiere"
      actions={
        <Button onClick={() => setIsReportSelectorOpen(true)} variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Generer Rapport
        </Button>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Wallet Filter for Analysis */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-900 dark:text-white">Périmètre d'analyse</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="w-full md:w-32">
              <Select
                options={Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return { value: y.toString(), label: y.toString() };
                })}
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                options={[
                  { value: '', label: 'Tous les portefeuilles' },
                  ...wallets.map(w => ({ value: w._id, label: w.name })),
                ]}
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reste à vivre */}
          <Card className="p-6 border-l-4 border-l-income hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-income/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-income" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reste à vivre</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(healthData?.remainingToLive || 0)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Besoins déduits</p>
              </div>
            </div>
          </Card>

          {/* Épargne actuelle */}
          <Card className="p-6 border-l-4 border-l-primary-600 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
                <PiggyBank className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Épargne du mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(monthlyData?.totals.balance || 0)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Solde mensuel</p>
              </div>
            </div>
          </Card>

          {/* Taux d'Épargne */}
          <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux d'Épargne</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {healthData?.rule503020.savingsPct.toFixed(1)}%
                  </p>
                  <span className={`text-[10px] pb-1 font-bold ${
                    (healthData?.rule503020.savingsPct || 0) >= 20 ? 'text-income' : 'text-orange-500'
                  }`}>
                    {(healthData?.rule503020.savingsPct || 0) >= 20 ? 'Excellent' : 'À améliorer'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Objectif: 20%</p>
              </div>
            </div>
          </Card>

          {/* Solde projeté */}
          <Card className="p-6 border-l-4 border-l-primary-400 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Projection fin de mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(monthlyData?.prediction.endOfMonthBalance || 0)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Basé sur historique</p>
              </div>
            </div>
          </Card>

          {/* Plus gros poste */}
          <Card className="p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Plus grosse dépense</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthData?.topExpenses?.[0]?.name || '—'}
                </p>
                <p className="text-[10px] text-orange-600 mt-1 uppercase tracking-wider font-bold">
                  {healthData?.topExpenses?.[0]?.amount ? formatAmount(healthData.topExpenses[0].amount) : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Variation Dépenses */}
          <Card className="p-6 border-l-4 border-l-expense hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-expense/10 rounded-xl">
                <TrendingDown className="w-6 h-6 text-expense" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Variation Dépenses</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monthlyData?.comparison.diffPercentage}%
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (monthlyData?.comparison.diffPercentage || 0) > 0 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    vs mois dernier
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Tendance mensuelle</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Category Breakdown */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Répartition des Dépenses</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {expenseBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomPieTooltip theme={theme} formatAmount={formatAmount} />}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Line Chart: Annual Trend */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUpIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Évolution Annuelle</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(val) => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'][val-1]}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(val) => {
                      if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return `${val}`;
                    }}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatAmount(Number(value))}
                    labelFormatter={(val) => MONTH_NAMES[Number(val) - 1]}
                    itemSorter={(item) => {
                      if (item.dataKey === 'income') return -2;
                      if (item.dataKey === 'expenses') return -1;
                      return 0;
                    }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: theme === 'dark' ? '#1f2937' : 'rgba(255, 255, 255, 0.98)',
                      padding: '12px'
                    }}
                    labelStyle={{
                      color: theme === 'dark' ? '#f3f4f6' : '#111827',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={48} 
                    content={() => (
                      <div className="flex justify-end flex-wrap gap-x-6 gap-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5" style={{ backgroundColor: '#3b82f6' }} />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solde</span>
                        </div>
                      </div>
                    )}
                  />
                  <Line type="monotone" dataKey="income" name="Revenus" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, strokeWidth: 1.5, fill: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="balance" name="Solde" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1.5, fill: '#fff' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Health & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rule 50/30/20 */}
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Règle 50/30/20</h3>
            </div>
            <div className="space-y-6">
              <RuleCard 
                label="Besoins" 
                percentage={healthData?.rule503020.needsPct || 0} 
                target="50%" 
                color="bg-primary-600"
              />
              <RuleCard 
                label="Envies" 
                percentage={healthData?.rule503020.wantsPct || 0} 
                target="30%" 
                color="bg-yellow-500"
              />
              <RuleCard 
                label="Épargne" 
                percentage={healthData?.rule503020.savingsPct || 0} 
                target="20%" 
                color="bg-income"
              />
              
              <div className="pt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Cette règle suggère de dépenser 50% pour les besoins, 30% pour les loisirs et d'épargner 20%.
                </p>
              </div>
            </div>
          </Card>

          {/* Advice & Tips */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Conseils & Optimisation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthData?.tips.map((tip, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border flex flex-col h-full ${
                    tip.type === 'success' 
                      ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800' 
                      : tip.type === 'warning'
                      ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800'
                      : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {tip.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : tip.type === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600" />
                    )}
                    <h4 className={`font-bold ${
                      tip.type === 'success' ? 'text-green-800 dark:text-green-300' :
                      tip.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                      'text-blue-800 dark:text-blue-300'
                    }`}>
                      {tip.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                    {tip.message}
                  </p>
                </div>
              ))}
              
              {/* Savings Goal - Dynamic Placeholder */}
              <div className="p-4 rounded-xl bg-primary-600 text-white md:col-span-2 shadow-lg shadow-primary-600/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">Capacité d'épargne projetée</h4>
                    <p className="text-primary-100 text-sm">
                      En maintenant votre rythme actuel, vous pourriez épargner {formatAmount((monthlyData?.totals.balance || 0) * 12)} sur une année pleine.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 Dépenses highlight */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Focus sur vos 3 plus gros postes de dépenses</h4>
              <div className="flex flex-wrap gap-4">
                {healthData?.topExpenses.map((expense, idx) => (
                  <div key={idx} className="flex-1 min-w-[150px] p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{expense.name}</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatAmount(expense.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Budget Tracking Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suivi des Budgets par Catégorie</h3>
            </div>
            <p className="text-xs text-gray-500">Dépenses réelles vs Limites fixées</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expenseBreakdown.filter(c => c.monthlyBudget).length > 0 ? (
              expenseBreakdown
                .filter(c => c.monthlyBudget)
                .map((category, idx) => {
                  const budget = category.monthlyBudget || 0;
                  const spent = category.amount;
                  const percentage = (spent / budget) * 100;
                  const isOverBudget = spent > budget;
                  const statusColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-primary-600';
                  
                  return (
                    <div key={idx} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-gray-900 dark:text-white">{category.name}</div>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Dépensé: {formatAmount(spent)}</span>
                          <span className="text-gray-500">Limite: {formatAmount(budget)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${statusColor} transition-all duration-1000`} 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {isOverBudget && (
                        <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold uppercase mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Budget dépassé de {formatAmount(spent - budget)}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 italic">
                Aucun budget défini. Modifiez vos catégories pour fixer des limites mensuelles.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Report Selector Modal */}
      <Modal
        isOpen={isReportSelectorOpen}
        onClose={() => setIsReportSelectorOpen(false)}
        title="Generer un Rapport Financier"
        className="max-w-md"
      >
        <div className="space-y-6 py-2">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setReportType('monthly')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                reportType === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setReportType('annual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                reportType === 'annual'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Annuel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reportType === 'monthly' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mois</label>
                <Select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(parseInt(e.target.value))}
                  options={MONTH_NAMES.map((name, i) => ({ label: name, value: (i + 1).toString() }))}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Annee</label>
              <Select
                value={reportYear}
                onChange={(e) => setReportYear(parseInt(e.target.value))}
                options={Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return { label: y.toString(), value: y.toString() };
                })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsReportSelectorOpen(false)}>Annuler</Button>
            <Button className="flex-1" onClick={handleGenerateReport} isLoading={reportLoading}>
              <FileText className="w-4 h-4 mr-2" />
              Generer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={reportData?.reportType === 'annual' 
          ? `Rapport Annuel — ${reportData?.period?.year}` 
          : `Rapport Financier — ${MONTH_NAMES[(reportData?.period?.month || 1) - 1]} ${reportData?.period?.year}`
        }
        className="max-w-4xl"
      >
        {reportData && (
          <div id="report-content">
            {/* ── Header ── */}
            <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {reportData.reportType === 'annual' ? 'Bilan Financier Annuel' : 'Bilan Financier Mensuel'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Periode : {reportData.reportType === 'annual' 
                    ? reportData.period.year 
                    : `${MONTH_NAMES[reportData.period.month - 1]} ${reportData.period.year}`
                  }
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Genere le {reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Solde Net Total</p>
                <p className={`text-2xl font-bold ${reportData.summary.netBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatAmount(reportData.summary.netBalance)}
                </p>
              </div>
            </div>

            {/* ── Summary Cards 2x2 ── */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-3 rounded-xl">
                <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
                  {reportData.reportType === 'annual' ? 'Revenus Annuels' : 'Revenus'}
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatAmount(reportData.summary.totalIncome)}</p>
                {reportData.reportType === 'annual' && (
                  <p className="text-[10px] text-green-600/70 mt-1">Moyenne: {formatAmount(reportData.summary.avgMonthlyIncome)}/mois</p>
                )}
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 p-3 rounded-xl">
                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                  {reportData.reportType === 'annual' ? 'Depenses Annuelles' : 'Depenses'}
                </p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatAmount(reportData.summary.totalExpenses)}</p>
                {reportData.reportType === 'annual' && (
                  <p className="text-[10px] text-red-600/70 mt-1">Moyenne: {formatAmount(reportData.summary.avgMonthlyExpenses)}/mois</p>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-3 rounded-xl">
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  {reportData.reportType === 'annual' ? 'Solde Moyen Mensuel' : 'Reste a vivre'}
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {reportData.reportType === 'annual' ? formatAmount(reportData.summary.avgMonthlyBalance) : formatAmount(reportData.remainingToLive)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 p-3 rounded-xl">
                <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                  {reportData.reportType === 'annual' ? 'Meilleur Mois' : 'Projete fin de mois'}
                </p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {reportData.reportType === 'annual' 
                    ? (reportData.bestMonth?.monthName || '—') 
                    : formatAmount(reportData.summary.predictedEndOfMonth)
                  }
                </p>
                {reportData.reportType === 'annual' && reportData.bestMonth && (
                  <p className="text-[10px] text-purple-600/70 mt-1">Solde: {formatAmount(reportData.bestMonth.balance)}</p>
                )}
              </div>
            </div>

            {/* ── Monthly Trend Table (Annual Only) ── */}
            {reportData.reportType === 'annual' && reportData.monthlyTrend && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary-600" />
                  Evolution Mensuelle
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Mois</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Revenus</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Depenses</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Solde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.monthlyTrend.filter((m: any) => m.income > 0 || m.expenses > 0).map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{m.monthName}</td>
                          <td className="px-3 py-2 text-right text-income">{formatAmount(m.income)}</td>
                          <td className="px-3 py-2 text-right text-expense">{formatAmount(m.expenses)}</td>
                          <td className={`px-3 py-2 text-right font-medium ${m.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                            {formatAmount(m.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Variation vs mois dernier (Monthly Only) ── */}
            {reportData.reportType === 'monthly' && reportData.comparison && (
              <div className={`flex items-center gap-3 p-3 rounded-xl mb-5 border text-sm ${
                reportData.comparison.diffPercentage > 0 
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800'
              }`}>
                {reportData.comparison.diffPercentage > 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                <p>
                  <span className="font-medium">Variation vs mois precedent :</span>{' '}
                  <span className={`font-bold ${reportData.comparison.diffPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {reportData.comparison.diffPercentage > 0 ? '+' : ''}{reportData.comparison.diffPercentage}%
                  </span>
                  {reportData.comparison.prevMonthExpenses > 0 && (
                    <span className="text-gray-500 ml-1">({formatAmount(reportData.comparison.prevMonthExpenses)} le mois dernier)</span>
                  )}
                </p>
              </div>
            )}

            {/* ── Detail Revenus ── */}
            {reportData.incomeCategories && reportData.incomeCategories.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Detail des Revenus</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50 dark:bg-green-900/10">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-green-700 dark:text-green-400 text-xs">Categorie</th>
                        <th className="text-right px-4 py-2.5 font-medium text-green-700 dark:text-green-400 text-xs">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.incomeCategories.map((cat: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{cat.name}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-income">{formatAmount(cat.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-green-50/50 dark:bg-green-900/5 border-t-2 border-green-200 dark:border-green-800">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">Total Revenus</td>
                        <td className="px-4 py-2.5 text-right font-bold text-income">{formatAmount(reportData.summary.totalIncome)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── Repartition par Portefeuille ── */}
            {reportData.walletBreakdown && reportData.walletBreakdown.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <PiggyBank className="w-3.5 h-3.5 text-primary-600" />
                  Repartition par Portefeuille
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 text-xs">Portefeuille</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 text-xs">Solde fin de période</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.walletBreakdown.map((wallet: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{wallet.name}</span>
                              <span className="text-[10px] text-gray-400 uppercase">{wallet.type}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-2.5 text-right font-bold ${wallet.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-expense'}`}>
                            {formatAmount(wallet.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {reportData.expenseCategories && reportData.expenseCategories.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                  {reportData.reportType === 'annual' ? 'Detail des Depenses Annuelles' : 'Detail des Depenses'}
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50 dark:bg-red-900/10">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-red-700 dark:text-red-400 text-xs">Categorie</th>
                        <th className="text-right px-4 py-2.5 font-medium text-red-700 dark:text-red-400 text-xs">
                          {reportData.reportType === 'annual' ? 'Budget Annuel' : 'Budget'}
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-red-700 dark:text-red-400 text-xs">
                          {reportData.reportType === 'annual' ? 'Total Depense' : 'Depense'}
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-red-700 dark:text-red-400 text-xs">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.expenseCategories.map((cat: any, idx: number) => {
                        const budget = reportData.reportType === 'annual' 
                          ? (cat.monthlyBudget ? cat.monthlyBudget * 12 : null)
                          : cat.monthlyBudget;
                        const isOverBudget = budget && cat.amount > budget;
                        
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{cat.name}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">
                              {budget ? formatAmount(budget) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-expense">{formatAmount(cat.amount)}</td>
                            <td className="px-4 py-2.5 text-right">
                              {budget ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isOverBudget 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                  {isOverBudget ? 'Depasse' : 'OK'}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-red-50/50 dark:bg-red-900/5 border-t-2 border-red-200 dark:border-red-800">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">Total Depenses</td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 text-right font-bold text-expense">{formatAmount(reportData.summary.totalExpenses)}</td>
                        <td className="px-4 py-2.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── Abonnements ── */}
            {reportData.subscriptions && reportData.subscriptions.count > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                  Charges Fixes & Abonnements ({reportData.subscriptions.count})
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 text-xs">Nom</th>
                        <th className="text-center px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 text-xs">
                          {reportData.reportType === 'annual' ? 'Par mois' : 'Jour'}
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 text-xs">
                          {reportData.reportType === 'annual' ? 'Total Annuel' : 'Montant'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {reportData.subscriptions.active.map((sub: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{sub.name}</td>
                          <td className="px-4 py-2.5 text-center text-gray-500">
                            {reportData.reportType === 'annual' ? formatAmount(sub.amount) : `${sub.billingDate} du mois`}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white">
                            {reportData.reportType === 'annual' ? formatAmount(sub.amount * 12) : formatAmount(sub.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white" colSpan={2}>
                          {reportData.reportType === 'annual' ? 'Total Cumule Annuel' : 'Total Mensuel'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary-600">
                          {reportData.reportType === 'annual' 
                            ? formatAmount(reportData.subscriptions.annualTotal) 
                            : formatAmount(reportData.subscriptions.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── Regle 50/30/20 ── */}
            <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                Regle 50/30/20
              </h3>
              <div className="space-y-3">
                <RuleCard label="Besoins" percentage={reportData.healthScore.needsPct} target="50%" color="bg-primary-600" />
                <RuleCard label="Envies" percentage={reportData.healthScore.wantsPct} target="30%" color="bg-yellow-500" />
                <RuleCard label="Epargne" percentage={reportData.healthScore.savingsPct} target="20%" color="bg-income" />
              </div>
            </div>

            {/* ── Alertes Budgetaires ── */}
            {reportData.budgetAlerts && reportData.budgetAlerts.length > 0 && (
              <div className="mb-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 p-4 rounded-xl">
                <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-2 text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Alertes Budgetaires
                </h3>
                <ul className="space-y-1.5">
                  {reportData.budgetAlerts.map((alert: any, idx: number) => (
                    <li key={idx} className="text-sm text-red-700 dark:text-red-300 flex justify-between bg-white/60 dark:bg-gray-900/20 px-3 py-2 rounded-lg">
                      <span>{alert.name}</span>
                      <span className="font-medium">Depassement de {formatAmount(alert.over)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Conseils ── */}
            {reportData.tips && reportData.tips.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                  Conseils & Recommandations
                </h3>
                <div className="space-y-2">
                  {reportData.tips.map((tip: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-xl border text-sm ${
                      tip.type === 'success' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800' :
                      tip.type === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800' :
                      'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                    }`}>
                      <p className="font-medium mb-0.5">{tip.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{tip.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handlePrintReport} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimer
              </Button>
              <Button onClick={() => setIsReportModalOpen(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
