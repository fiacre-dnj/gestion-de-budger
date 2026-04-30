import { useState, useEffect } from 'react';
import { UserCircle, Shield, Info, Lock, User as UserIcon, CheckCircle2, ChevronRight } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Input from '../../components/UI/Input';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { currency, setCurrency, isLoading: currencyLoading } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [currencyMessage, setCurrencyMessage] = useState({ type: '', text: '' });

  // Profile (Name) state
  const [name, setName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' });

  // Password change state
  const [passwordStep, setPasswordStep] = useState<'initial' | 'verify' | 'new'>('initial');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveCurrency = async () => {
    setIsSavingCurrency(true);
    setCurrencyMessage({ type: '', text: '' });
    try {
      await setCurrency(selectedCurrency);
      setCurrencyMessage({ type: 'success', text: 'Paramètres régionaux enregistrés' });
    } catch (error) {
      setCurrencyMessage({ type: 'error', text: 'Échec de l\'enregistrement' });
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsSavingName(true);
    setNameMessage({ type: '', text: '' });
    try {
      const response = await authApi.updateProfile({ name });
      updateUser(response.data);
      setNameMessage({ type: 'success', text: 'Nom mis à jour avec succès' });
    } catch (error) {
      setNameMessage({ type: 'error', text: 'Échec de la mise à jour' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleVerifyPassword = async () => {
    setIsVerifying(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      const response = await authApi.verifyPassword(currentPassword);
      if (response.data.isValid) {
        setPasswordStep('new');
        setCurrentPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: 'Mot de passe actuel incorrect' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Erreur lors de la vérification' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSavePassword = async () => {
    const errors: Record<string, string> = {};
    if (newPassword.length < 6) {
      errors.password = 'Le mot de passe doit faire au moins 6 caractères';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      await authApi.updateProfile({ password: newPassword });
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStep('initial');
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Échec de la modification' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Layout title="Paramètres">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Personal Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <UserCircle className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informations Personnelles</h2>
          </div>
          
          <Card className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-4">
                <Input
                  label="Nom complet"
                  icon={UserIcon}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                />
                <div className="relative">
                  <Input
                    label="Adresse email"
                    icon={Shield}
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-75"
                  />
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {nameMessage.text && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    nameMessage.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {nameMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    {nameMessage.text}
                  </div>
                )}
                <Button 
                  onClick={handleSaveName} 
                  isLoading={isSavingName}
                  disabled={name === user?.name}
                  className="w-full md:w-auto self-end"
                >
                  Enregistrer le nom
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Security / Password */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Lock className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sécurité</h2>
          </div>
          
          <Card className="p-8">
            {passwordStep === 'initial' ? (
              <div className="flex flex-col items-center py-4 space-y-4 text-center">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-full">
                  <Lock className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Changer votre mot de passe</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                    Pour votre sécurité, nous vous demanderons votre mot de passe actuel avant de le modifier.
                  </p>
                </div>
                <Button 
                  onClick={() => setPasswordStep('verify')}
                  variant="outline"
                  className="mt-4"
                >
                  Modifier le mot de passe
                </Button>
                {passwordMessage.text && (
                  <p className={`mt-4 text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMessage.text}
                  </p>
                )}
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {passwordStep === 'verify' ? 'Vérification' : 'Nouveau mot de passe'}
                  </h3>
                  <button 
                    onClick={() => {
                      setPasswordStep('initial');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordErrors({});
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    Annuler
                  </button>
                </div>

                {passwordStep === 'verify' ? (
                  <div className="space-y-4">
                    <Input
                      label="Mot de passe actuel"
                      type="password"
                      icon={Lock}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    {passwordMessage.text && (
                      <p className="text-sm text-red-600">{passwordMessage.text}</p>
                    )}
                    <Button 
                      onClick={handleVerifyPassword} 
                      isLoading={isVerifying}
                      className="w-full"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      label="Nouveau mot de passe"
                      type="password"
                      icon={Lock}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={passwordErrors.password}
                      placeholder="Au moins 6 caractères"
                    />
                    <Input
                      label="Confirmer le nouveau mot de passe"
                      type="password"
                      icon={Lock}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={passwordErrors.confirmPassword}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <Button 
                      onClick={handleSavePassword} 
                      isLoading={isSavingPassword}
                      className="w-full"
                    >
                      Enregistrer le nouveau mot de passe
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>

        {/* Regional Preferences */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Info className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Préférences régionales</h2>
          </div>
          
          <Card className="p-8">
            <div className="max-w-md space-y-6">
              <Select
                label="Devise préférée"
                options={[
                  { value: 'MGA', label: 'Ariary Malgache (MGA)' },
                  { value: 'EUR', label: 'Euro (EUR)' },
                  { value: 'USD', label: 'Dollar US (USD)' },
                ]}
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                disabled={currencyLoading || isSavingCurrency}
              />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  Note: Tous les montants saisis sont considérés comme étant en MGA en base de données pour assurer la cohérence de vos calculs historiques.
                </p>
              </div>

              {currencyMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
                  currencyMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${currencyMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  {currencyMessage.text}
                </div>
              )}

              <Button 
                onClick={handleSaveCurrency} 
                isLoading={isSavingCurrency} 
                disabled={currencyLoading}
                className="px-8"
              >
                Mettre à jour la devise
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
