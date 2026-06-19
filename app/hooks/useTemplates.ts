import { useState, useEffect, useCallback } from 'react';

export interface TransactionTemplate {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount?: string;
  description?: string;
  createdAt: number;
}

const STORAGE_KEY = 'transaction_templates';

export function useTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
    setLoading(false);
  }, []);

  const saveTemplates = useCallback((newTemplates: TransactionTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  }, []);

  const addTemplate = useCallback((
    name: string,
    type: 'INCOME' | 'EXPENSE',
    category: string,
    amount?: string,
    description?: string
  ) => {
    const newTemplate: TransactionTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      category,
      amount,
      description,
      createdAt: Date.now(),
    };
    saveTemplates([...templates, newTemplate]);
    return newTemplate;
  }, [templates, saveTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<TransactionTemplate>) => {
    const newTemplates = templates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
  }, [templates, saveTemplates]);

  const getTemplatesByType = useCallback((type: 'INCOME' | 'EXPENSE') => {
    return templates.filter(t => t.type === type);
  }, [templates]);

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType,
  };
}
