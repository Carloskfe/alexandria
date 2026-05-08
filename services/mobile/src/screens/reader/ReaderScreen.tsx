import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiClient } from '../../api/client';
import { saveFragment } from '../../offline/fragment-storage';
import { saveProgress } from '../../offline/progress-storage';
import type { LibraryStackParamList } from '../../navigation/types';

type Route = RouteProp<LibraryStackParamList, 'Reader'>;
type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Reader'>;

interface SyncPhrase {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  type?: 'text' | 'heading' | 'paragraph-break';
}

interface ApiFragment {
  id: string;
  startPhraseIndex: number;
  endPhraseIndex: number;
}

const PROGRESS_DEBOUNCE = 3000;

export function ReaderScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { bookId, bookTitle } = route.params;

  const [phrases, setPhrases] = useState<SyncPhrase[]>([]);
  const [rawParagraphs, setRawParagraphs] = useState<string[]>([]);
  const [savedIndex, setSavedIndex] = useState(0);
  const [selectedPhrase, setSelectedPhrase] = useState<SyncPhrase | null>(null);
  const [savingFragment, setSavingFragment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const listRef = useRef<FlatList>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedPhraseIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    navigation.setOptions({ title: bookTitle });

    Promise.all([
      apiClient.get<{ textFileUrl?: string }>(`/books/${bookId}`),
      apiClient.get<{ phrases?: SyncPhrase[] }>(`/books/${bookId}/sync-map`).catch(() => null),
      apiClient.get<{ phraseIndex?: number }>(`/books/${bookId}/progress`).catch(() => null),
      apiClient.get<ApiFragment[]>(`/books/${bookId}/fragments`).catch(() => []),
    ]).then(([book, syncMap, progress, frags]) => {
      setSavedIndex(progress?.phraseIndex ?? 0);
      savedPhraseIds.current = new Set((frags ?? []).map((f) => f.startPhraseIndex));

      if (syncMap?.phrases?.length) {
        setPhrases(syncMap.phrases);
      } else if (book?.textFileUrl) {
        fetch(book.textFileUrl)
          .then((r) => r.text())
          .then((t) => setRawParagraphs(t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)))
          .catch(() => setError('No se pudo cargar el texto.'));
      } else {
        setError('Texto no disponible.');
      }
    }).catch(() => setError('No se pudo cargar el libro.')).finally(() => setLoading(false));
  }, [bookId, bookTitle, navigation]);

  useEffect(() => {
    if (savedIndex > 0 && phrases.length > 0) {
      const idx = Math.min(savedIndex, phrases.length - 1);
      setTimeout(() => listRef.current?.scrollToIndex({ index: idx, animated: true }), 600);
    }
  }, [savedIndex, phrases]);

  const trackProgress = useCallback((phraseIndex: number) => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      saveProgress({ bookId, chapterIndex: 0, phraseIndex, updatedAt: Date.now(), synced: false }).catch(() => {});
      apiClient.post(`/books/${bookId}/progress`, { phraseIndex }).catch(() => {});
    }, PROGRESS_DEBOUNCE);
  }, [bookId]);

  const handleSaveFragment = useCallback(async () => {
    if (!selectedPhrase) return;
    setSavingFragment(true);
    const text = selectedPhrase.text;
    const idx = selectedPhrase.index;
    try {
      const res = await apiClient.post<{ id: string }>(`/books/${bookId}/fragments`, {
        text, startPhraseIndex: idx, endPhraseIndex: idx,
      });
      savedPhraseIds.current.add(idx);
      await saveFragment({ localId: res.id, serverId: res.id, bookId, text, chapterIndex: 0, createdAt: Date.now(), synced: true });
    } catch {
      const localId = `local_${Date.now()}`;
      savedPhraseIds.current.add(idx);
      await saveFragment({ localId, bookId, text, chapterIndex: 0, createdAt: Date.now(), synced: false }).catch(() => {});
    } finally {
      setSavingFragment(false);
      setSelectedPhrase(null);
    }
  }, [bookId, selectedPhrase]);

  const renderPhrase = useCallback(({ item }: { item: SyncPhrase }) => {
    if (item.type === 'paragraph-break') return <View style={styles.gap} />;
    const isHeading = item.type === 'heading';
    const isSaved = savedPhraseIds.current.has(item.index);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => trackProgress(item.index)}
        onLongPress={() => { if (!isHeading) setSelectedPhrase(item); }}
        delayLongPress={400}
      >
        <Text style={[styles.phrase, isHeading && styles.heading, isSaved && styles.saved]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  }, [trackProgress]);

  const renderParagraph = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={() => setSelectedPhrase({ index, text: item, startTime: 0, endTime: 0, type: 'text' })}
      delayLongPress={400}
    >
      <Text style={[styles.phrase, styles.gap]}>{item}</Text>
    </TouchableOpacity>
  ), []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {phrases.length > 0 ? (
        <FlatList
          ref={listRef}
          data={phrases}
          keyExtractor={(item) => String(item.index)}
          renderItem={renderPhrase}
          contentContainerStyle={styles.content}
          onScrollToIndexFailed={() => {}}
        />
      ) : (
        <FlatList
          data={rawParagraphs}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderParagraph}
          contentContainerStyle={styles.content}
        />
      )}

      <Modal
        visible={selectedPhrase !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPhrase(null)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setSelectedPhrase(null)} activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetExcerpt} numberOfLines={3}>{selectedPhrase?.text}</Text>
            <TouchableOpacity
              style={[styles.saveBtn, savingFragment && styles.saveBtnOff]}
              onPress={handleSaveFragment}
              disabled={savingFragment}
            >
              {savingFragment
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Guardar fragmento</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedPhrase(null)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingBottom: 60 },
  phrase: { fontSize: 17, lineHeight: 28, color: '#1F2937', marginBottom: 2 },
  heading: { fontSize: 20, fontWeight: '700', color: '#0D1B2A', marginTop: 20, marginBottom: 4 },
  saved: { backgroundColor: '#EDE9FE' },
  gap: { marginBottom: 16 },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#4F46E5', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetExcerpt: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 20, fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#6B7280', fontSize: 15 },
});
