import { useState, useCallback } from 'react';
import type { KanbanColumn, KanbanCard, ContactWithProvenance } from '../types';

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'to-reach', title: 'To Reach', cardIds: [] },
  { id: 'in-progress', title: 'In Progress', cardIds: [] },
  { id: 'sent', title: 'Sent', cardIds: [] },
  { id: 'replied', title: 'Replied', cardIds: [] },
];

let cardCounter = 0;

export function useKanban() {
  const [columns, setColumns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);
  const [cards, setCards] = useState<Record<string, KanbanCard>>({});

  const addCards = useCallback((contacts: ContactWithProvenance[]) => {
    const now = Date.now();
    const newCards: Record<string, KanbanCard> = {};

    for (const contact of contacts) {
      if (Object.values(cards).some((c) => c.contact.id === contact.id)) continue;
      cardCounter++;
      const cardId = `card-${cardCounter}-${now}`;
      newCards[cardId] = {
        id: cardId,
        contact,
        columnId: 'to-reach',
        lastActionAt: now,
      };
    }

    const cardIds = Object.keys(newCards);
    if (cardIds.length === 0) return;

    setCards((prev) => ({ ...prev, ...newCards }));
    setColumns((prev) =>
      prev.map((col) =>
        col.id === 'to-reach' ? { ...col, cardIds: [...cardIds, ...col.cardIds] } : col,
      ),
    );
  }, [cards]);

  const moveCard = useCallback((cardId: string, targetColumnId: string) => {
    const card = cards[cardId];
    if (!card) return;

    setCards((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], columnId: targetColumnId, lastActionAt: Date.now() },
    }));
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cardIds: col.id === targetColumnId
          ? [cardId, ...col.cardIds]
          : col.cardIds.filter((id) => id !== cardId),
      })),
    );
  }, [cards]);

  const addColumn = useCallback((title: string) => {
    const id = `col-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setColumns((prev) => [...prev, { id, title, cardIds: [] }]);
  }, []);

  const renameColumn = useCallback((columnId: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, title } : col)),
    );
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    if (!col || col.cardIds.length > 0) return;

    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setCards((prev) => {
      const next = { ...prev };
      for (const cardId of col.cardIds) {
        delete next[cardId];
      }
      return next;
    });
  }, [columns]);

  const setCardDraft = useCallback((cardId: string, draft: string) => {
    setCards((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], draft },
    }));
  }, []);

  const getCardsForColumn = useCallback((columnId: string): KanbanCard[] => {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return [];
    return col.cardIds.map((id) => cards[id]).filter(Boolean);
  }, [columns, cards]);

  return {
    columns,
    cards,
    addCards,
    moveCard,
    addColumn,
    renameColumn,
    removeColumn,
    setCardDraft,
    getCardsForColumn,
  };
}
