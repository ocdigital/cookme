import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/api';

export const TrocarSenhaPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [formData, setFormData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmacao_senha: '',
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!formData.senha_atual) novosErros.senha_atual = 'Informe a senha temporária';
    if (formData.nova_senha.length < 8) novosErros.nova_senha = 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(formData.nova_senha)) novosErros.nova_senha = 'Use ao menos uma letra maiúscula';
    if (!/[0-9]/.test(formData.nova_senha)) novosErros.nova_senha = 'Use ao menos um número';
    if (formData.nova_senha !== formData.confirmacao_senha) novosErros.confirmacao_senha = 'As senhas não coincidem';
    if (formData.nova_senha === formData.senha_atual) novosErros.nova_senha = 'A nova senha deve ser diferente da temporária';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setLoading(true);
    try {
      await authService.changePassword(formData.senha_atual, formData.nova_senha, formData.confirmacao_senha);
      toast.success('Senha alterada!', 'Acesso liberado. Bem-vindo ao painel.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao alterar senha.';
      toast.error('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const forca = (() => {
    const s = formData.nova_senha;
    if (!s) return 0;
    let pts = 0;
    if (s.length >= 8) pts++;
    if (s.length >= 12) pts++;
    if (/[A-Z]/.test(s)) pts++;
    if (/[0-9]/.test(s)) pts++;
    if (/[^A-Za-z0-9]/.test(s)) pts++;
    return pts;
  })();

  const forcaLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'][forca] ?? '';
  const forcaCor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-500'][forca] ?? '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-orange-400 to-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        className="w-full max-w-md z-10"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
      >
        {/* Logo */}
        <motion.div className="text-center mb-5" variants={itemVariants}>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
            <ChefHat size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">CookMe Admin</h1>
        </motion.div>

        {/* Aviso */}
        <motion.div
          className="bg-amber-400/20 border border-amber-300/40 rounded-2xl px-4 py-3 flex gap-3 items-start mb-4"
          variants={itemVariants}
        >
          <AlertTriangle size={18} className="text-amber-200 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm">Troca de senha obrigatória</p>
            <p className="text-white/80 text-xs mt-0.5">
              Olá, <strong>{user?.nome || 'Admin'}</strong>. Por segurança, defina uma senha pessoal antes de continuar.
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/20"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Criar nova senha</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Senha temporária */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha temporária
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showSenhaAtual ? 'text' : 'password'}
                  name="senha_atual"
                  placeholder="Digite a senha temporária"
                  value={formData.senha_atual}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${erros.senha_atual ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                />
                <button type="button" onClick={() => setShowSenhaAtual(!showSenhaAtual)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSenhaAtual ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {erros.senha_atual && <p className="text-red-500 text-xs mt-1">{erros.senha_atual}</p>}
            </div>

            {/* Nova senha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showNovaSenha ? 'text' : 'password'}
                  name="nova_senha"
                  placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                  value={formData.nova_senha}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${erros.nova_senha ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                />
                <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNovaSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {erros.nova_senha && <p className="text-red-500 text-xs mt-1">{erros.nova_senha}</p>}

              {/* Barra de força */}
              {formData.nova_senha && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= forca ? forcaCor : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Força: <span className="font-semibold">{forcaLabel}</span></p>
                </div>
              )}
            </div>

            {/* Confirmação */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showConfirmacao ? 'text' : 'password'}
                  name="confirmacao_senha"
                  placeholder="Repita a nova senha"
                  value={formData.confirmacao_senha}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all ${erros.confirmacao_senha ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                />
                <button type="button" onClick={() => setShowConfirmacao(!showConfirmacao)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmacao ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {erros.confirmacao_senha && <p className="text-red-500 text-xs mt-1">{erros.confirmacao_senha}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Confirmar nova senha
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar e sair
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
