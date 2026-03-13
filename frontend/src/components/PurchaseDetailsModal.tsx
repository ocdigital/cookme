import React from 'react';
import { Calendar, MapPin, Package } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import type { Compra } from '../services/comprasService';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Compra | null;
}

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  purchase,
}) => {
  if (!purchase) return null;

  const totalValue = purchase.preco_total || 0;
  const purchaseDate = new Date(purchase.criado_em).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Compra em ${purchase.local_compra}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Local</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {purchase.local_compra || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Data</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {purchaseDate}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Itens ({purchase.itens?.length || 0})
            </h3>
          </div>

          {purchase.itens && purchase.itens.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {purchase.itens.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.produto?.nome || 'Produto desconhecido'}
                    </p>
                    <span className="text-xs font-semibold text-primary">
                      R$ {item.preco_total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      {item.quantidade} {item.unidade || 'un'} × R${' '}
                      {item.preco_unitario?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item nesta compra</p>
          )}
        </div>

        {/* Total */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-900 dark:text-white">Valor Total</p>
            <p className="text-lg font-bold text-primary">R$ {totalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Fechar
        </button>
      </div>
    </AnimatedModal>
  );
};
