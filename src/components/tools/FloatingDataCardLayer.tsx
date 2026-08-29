/**
 * Floating Data Card Layer (Phase G)
 * 
 * Overlay container that renders active Floating HUD cards.
 * Subscribes to ToolEventBus and GestureEventBus.
 */

import React, { useState, useEffect } from 'react';
import { FloatingCardPayload } from '../../services/tools/types';
import { 
  ToolEventBus, 
  EVENT_MOUNT_FLOATING_CARD, 
  EVENT_DISMISS_FLOATING_CARD, 
  EVENT_CLEAR_ALL_CARDS 
} from '../../services/tools/toolEventBus';
import { FloatingDataCard } from './FloatingDataCard';

export const FloatingDataCardLayer: React.FC = () => {
  const [cards, setCards] = useState<FloatingCardPayload[]>([]);

  useEffect(() => {
    const bus = ToolEventBus.getInstance();
    setCards(bus.getActiveCards());

    const unsubMount = bus.on(EVENT_MOUNT_FLOATING_CARD, (card) => {
      setCards((prev) => {
        const filtered = prev.filter((c) => c.id !== card.id);
        return [...filtered, card];
      });
    });

    const unsubDismiss = bus.on(EVENT_DISMISS_FLOATING_CARD, ({ cardId }) => {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    });

    const unsubClear = bus.on(EVENT_CLEAR_ALL_CARDS, () => {
      setCards([]);
    });

    return () => {
      unsubMount();
      unsubDismiss();
      unsubClear();
    };
  }, []);

  if (cards.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="relative w-full h-full pointer-events-auto">
        {cards.map((card, idx) => (
          <FloatingDataCard 
            key={card.id} 
            card={card} 
            index={idx}
            onDismiss={(id) => setCards((prev) => prev.filter((c) => c.id !== id))} 
          />
        ))}
      </div>
    </div>
  );
};
