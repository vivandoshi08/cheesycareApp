import { supabase } from './supabase';
import { Document, DocumentKeyword } from './types';

export async function getDocuments(): Promise<(Document & { keywords?: string[] })[]> {
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .order('title');

  if (docsError) return [];

  const { data: keywordsData, error: keywordsError } = await supabase
    .from('document_keywords')
    .select('*');

  if (keywordsError) return documents;

  return documents.map(doc => {
    const docKeywords = keywordsData
      .filter(kw => kw.document_id === doc.id)
      .map(kw => kw.keyword);

    return {
      ...doc,
      keywords: docKeywords.length > 0 ? docKeywords : undefined
    };
  });
}

export async function getDocumentById(id: string): Promise<(Document & { keywords?: string[] }) | null> {
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (docError) return null;

  const { data: keywords } = await supabase
    .from('document_keywords')
    .select('*')
    .eq('document_id', id);

  return {
    ...document,
    keywords: keywords && keywords.length > 0 ? keywords.map(k => k.keyword) : undefined
  };
}

export async function createDocument(
  title: string,
  category: 'SW' | 'AnW',
  summary: string,
  link: string,
  keywords?: string[]
): Promise<Document | null> {
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      title,
      category,
      summary,
      link
    })
    .select()
    .single();

  if (docError) return null;

  if (keywords && keywords.length > 0) {
    const keywordObjects = keywords.map(keyword => ({
      document_id: document.id,
      keyword
    }));

    await supabase.from('document_keywords').insert(keywordObjects);
  }

  return {
    ...document,
    keywords
  };
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>,
  keywords?: string[]
): Promise<Document | null> {
  const { data: document, error: docError } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (docError) return null;

  if (keywords !== undefined) {
    await supabase.from('document_keywords').delete().eq('document_id', id);

    if (keywords && keywords.length > 0) {
      const keywordObjects = keywords.map(keyword => ({
        document_id: id,
        keyword
      }));

      await supabase.from('document_keywords').insert(keywordObjects);
    }
  }

  return {
    ...document,
    keywords
  };
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  return !error;
}
