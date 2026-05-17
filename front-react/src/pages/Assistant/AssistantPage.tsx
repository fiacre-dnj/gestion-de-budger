import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/UI/Button';
import { aiApi, type AiChatAction } from '../../services/api';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AiChatAction[];
}

const SUGGESTIONS = [
  'Résume ma situation financière ce mois-ci',
  'J\'ai dépensé 35€ en courses aujourd\'hui',
  'Ajoute 100€ à mon objectif épargne',
  'Donne-moi des conseils pour économiser',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [providerInfo, setProviderInfo] = useState<{
    configured: boolean;
    provider: string | null;
    hint?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition(handleVoiceResult);

  useEffect(() => {
    aiApi
      .getProvider()
      .then((res) => setProviderInfo(res.data))
      .catch(() => {
        setProviderInfo({
          configured: false,
          provider: null,
          hint: 'Impossible de joindre l\'API',
        });
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: trimmed },
    ]);
    setIsLoading(true);

    try {
      const { data } = await aiApi.chat(trimmed, conversationId);
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          actions: data.actions?.length ? data.actions : undefined,
        },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        'Erreur lors de la communication avec l\'assistant. Vérifiez la configuration IA du serveur.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <Layout title="Assistant Stash">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
        {providerInfo && !providerInfo.configured && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex gap-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Assistant non configuré</p>
              <p className="mt-1 opacity-90">
                Ajoutez une clé API gratuite Groq dans{' '}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                  back-nest/.env
                </code>{' '}
                : <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">AI_PROVIDER=groq</code>{' '}
                et <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">AI_API_KEY=...</code>{' '}
                (
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  console.groq.com
                </a>
                ).
              </p>
              {providerInfo.hint && <p className="mt-1 text-xs">{providerInfo.hint}</p>}
            </div>
          </div>
        )}

        {providerInfo?.configured && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            Propulsé par {providerInfo.provider} — changez via{' '}
            <code className="text-gray-600 dark:text-gray-300">AI_PROVIDER</code> dans .env
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Votre conseiller financier
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                Parlez ou écrivez naturellement : enregistrer une dépense, contribuer à
                l'épargne, analyser votre budget ou obtenir des conseils personnalisés.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    disabled={isLoading || !providerInfo?.configured}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Bot className="w-4 h-4 mb-1 text-primary-500" />
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {msg.actions.map((a, i) => (
                      <p
                        key={i}
                        className={`text-xs flex items-center gap-1.5 ${
                          a.success
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500'
                        }`}
                      >
                        <span>{a.success ? '✓' : '✗'}</span>
                        <span>{a.summary || a.tool}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Réflexion en cours...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                isListening ? 'Écoute en cours...' : 'Écrivez ou dictez votre message...'
              }
              rows={2}
              disabled={isLoading || !providerInfo?.configured}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:opacity-50"
            />
            {isSupported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={isLoading || !providerInfo?.configured}
                title={isListening ? 'Arrêter' : 'Dicter'}
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 animate-pulse'
                    : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || !providerInfo?.configured}
            className="h-[52px] px-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
