import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AcousticConfig,
  AcousticPresetId,
  TrainingMode,
  OxfordLevel,
  VocabDataset,
  VocabEntry,
  StressScenario,
  UserStats,
  HistoryItem
} from './types';
import { ACOUSTIC_PRESETS } from './audio/presets';
import { audioEngine } from './audio/AudioEngine';
import { Header } from './components/Header';
import { LevelSelector } from './components/LevelSelector';
import { PresetSelector } from './components/PresetSelector';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { TrainingCard } from './components/TrainingCard';
import { StatsDrawer } from './components/StatsDrawer';
import { Shuffle, Keyboard } from 'lucide-react';

function getAutoPresetForScenario(item: StressScenario): AcousticPresetId | null {
  const text = (item.scenario + ' ' + item.contextDescription).toLowerCase();
  
  if (/\b(flight|airport|gate|concourse|subway|platform|train|transit|baggage claim|station)\b/.test(text)) {
    return 'train_pa';
  }
  if (/\b(voicemail|phone|call|customer service)\b/.test(text)) {
    if (/\b(cell|mobile|poor signal|bad reception)\b/.test(text)) return 'cellphone';
    return 'landline';
  }
  if (/\b(intercom|announcement|pa system|counter|drive-thru)\b/.test(text) && !text.includes('train') && !text.includes('airport')) {
    return 'intercom_staccato';
  }
  if (/\b(security|police|dispatch|walkie|radio)\b/.test(text)) {
    return 'walkie_talkie';
  }
  return null;
}

const STATS_STORAGE_KEY = 'acoustic_ear_user_stats_v5';
const LEVEL_STORAGE_KEY = 'acoustic_ear_oxford_level_v1';

const INITIAL_STATS: UserStats = {
  totalAttempted: 0,
  totalCorrect: 0,
  streak: 0,
  bestStreak: 0,
  modeStats: {
    minimal_pair: { attempted: 0, correct: 0 },
    dictation: { attempted: 0, correct: 0 },
    comprehension_stress: { attempted: 0, correct: 0 }
  },
  phonemeAccuracy: {},
  recentHistory: []
};

// Numeric word-to-digit and digit-to-word map for flexible dictation
const NUMBER_SYNONYMS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
  '11': 'eleven',
  '12': 'twelve',
  '13': 'thirteen',
  '14': 'fourteen',
  '15': 'fifteen',
  '16': 'sixteen',
  '17': 'seventeen',
  '18': 'eighteen',
  '19': 'nineteen',
  '20': 'twenty',
  '30': 'thirty',
  '40': 'forty',
  '50': 'fifty',
  '60': 'sixty',
  '70': 'seventy',
  '80': 'eighty',
  '90': 'ninety',
  '100': 'hundred',
  '1000': 'thousand'
};

export default function App() {
  const [dataset, setDataset] = useState<VocabDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Training state
  const [currentMode, setCurrentMode] = useState<TrainingMode>('minimal_pair');
  const [acousticConfig, setAcousticConfig] = useState<AcousticConfig>(ACOUSTIC_PRESETS.landline);
  const [selectedLevel, setSelectedLevel] = useState<OxfordLevel>(() => {
    try {
      const saved = localStorage.getItem(LEVEL_STORAGE_KEY) as OxfordLevel;
      if (saved && ['all', 'A1', 'A2', 'B1', 'B2', 'C1'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'all';
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [calmMode, setCalmMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('acoustic_ear_calm_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCalmMode = () => {
    setCalmMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('acoustic_ear_calm_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Save selected level to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEVEL_STORAGE_KEY, selectedLevel);
    } catch {
      // ignore
    }
  }, [selectedLevel]);

  // Active audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isClean, setIsClean] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);

  // In-situ feedback state
  const [feedback, setFeedback] = useState<{
    answered: boolean;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  } | null>(null);

  // User stats & diagnostic drawer
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STATS;
  });
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Load dataset on initial mount
  useEffect(() => {
    async function loadDataset() {
      try {
        setIsLoading(true);
        const res = await fetch('/data/vocabulary.json');
        if (!res.ok) {
          throw new Error('Could not load listening exercises corpus.');
        }
        const data: VocabDataset = await res.json();
        setDataset(data);
      } catch (err: any) {
        console.error('Failed to load dataset:', err);
        setError('Unable to load audio exercises. Please check your connection and reload.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDataset();
  }, []);

  // Filter available items per mode & selected Oxford level
  const minimalPairItems = useMemo(() => {
    if (!dataset) return [];
    return dataset.words.filter((w) => {
      const isPair = w.category === 'minimal_pair' && w.pairWord;
      if (!isPair) return false;
      if (selectedLevel === 'all') return true;
      return w.level === selectedLevel;
    });
  }, [dataset, selectedLevel]);

  const dictationItems = useMemo(() => {
    if (!dataset) return [];
    return dataset.words.filter((w) => {
      if (selectedLevel === 'all') return true;
      return w.level === selectedLevel;
    });
  }, [dataset, selectedLevel]);

  const stressItems = useMemo(() => {
    if (!dataset) return [];
    return dataset.scenarios.filter((s) => {
      if (selectedLevel === 'all') return true;
      return s.level === selectedLevel;
    });
  }, [dataset, selectedLevel]);

  // Counts per Oxford level for the active training mode
  const levelItemCounts = useMemo<Record<OxfordLevel, number>>(() => {
    const counts: Record<OxfordLevel, number> = { all: 0, A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    if (!dataset) return counts;

    if (currentMode === 'minimal_pair') {
      const allPairs = dataset.words.filter((w) => w.category === 'minimal_pair' && w.pairWord);
      counts.all = allPairs.length;
      allPairs.forEach((w) => {
        if (w.level && counts[w.level] !== undefined) {
          counts[w.level]++;
        }
      });
    } else if (currentMode === 'dictation') {
      counts.all = dataset.words.length;
      dataset.words.forEach((w) => {
        if (w.level && counts[w.level] !== undefined) {
          counts[w.level]++;
        }
      });
    } else {
      counts.all = dataset.scenarios.length;
      dataset.scenarios.forEach((s) => {
        if (s.level && counts[s.level] !== undefined) {
          counts[s.level]++;
        }
      });
    }

    return counts;
  }, [dataset, currentMode]);

  // Active item depending on current training mode
  const activeItem = useMemo(() => {
    if (currentMode === 'minimal_pair') {
      if (minimalPairItems.length === 0) return null;
      return minimalPairItems[currentIndex % minimalPairItems.length];
    } else if (currentMode === 'dictation') {
      if (dictationItems.length === 0) return null;
      return dictationItems[currentIndex % dictationItems.length];
    } else {
      if (stressItems.length === 0) return null;
      return stressItems[currentIndex % stressItems.length];
    }
  }, [currentMode, currentIndex, minimalPairItems, dictationItems, stressItems]);

  // Total items count for current mode
  const totalModeItems = useMemo(() => {
    if (currentMode === 'minimal_pair') return minimalPairItems.length;
    if (currentMode === 'dictation') return dictationItems.length;
    return stressItems.length;
  }, [currentMode, minimalPairItems, dictationItems, stressItems]);

  // Options for minimal pairs & stress scenarios
  const currentOptions = useMemo(() => {
    if (!activeItem) return [];
    if (currentMode === 'minimal_pair') {
      const vocab = activeItem as VocabEntry;
      if (vocab.pairWord) {
        return currentIndex % 2 === 0
          ? [vocab.word, vocab.pairWord]
          : [vocab.pairWord, vocab.word];
      }
      return [vocab.word];
    } else if (currentMode === 'comprehension_stress') {
      const scenario = activeItem as StressScenario;
      return scenario.options;
    }
    return [];
  }, [activeItem, currentMode, currentIndex]);

  // Preload audio
  useEffect(() => {
    if (!activeItem) return;
    const urlsToPreload = [activeItem.audioUrl];

    if (currentMode === 'minimal_pair' && minimalPairItems.length > 0) {
      const next = minimalPairItems[(currentIndex + 1) % minimalPairItems.length];
      if (next) urlsToPreload.push(next.audioUrl);
    } else if (currentMode === 'dictation' && dictationItems.length > 0) {
      const next = dictationItems[(currentIndex + 1) % dictationItems.length];
      if (next) urlsToPreload.push(next.audioUrl);
    } else if (currentMode === 'comprehension_stress' && stressItems.length > 0) {
      const next = stressItems[(currentIndex + 1) % stressItems.length];
      if (next) urlsToPreload.push(next.audioUrl);
    }

    audioEngine.preload(urlsToPreload).catch(() => {});
  }, [activeItem, currentIndex, currentMode, minimalPairItems, dictationItems, stressItems]);

  // Play audio in degraded mode
  const playDegraded = useCallback(async () => {
    if (!activeItem) return;
    try {
      setIsClean(false);
      setIsPlaying(true);
      const fallbackWord = 'word' in activeItem ? activeItem.word : activeItem.targetWord;
      await audioEngine.play(activeItem.audioUrl, acousticConfig, {
        clean: false,
        playbackRate,
        fallbackWord,
        onEnded: () => setIsPlaying(false)
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    }
  }, [activeItem, acousticConfig, playbackRate]);

  // Play audio in clean mode (A/B Bypass)
  const playClean = useCallback(async () => {
    if (!activeItem) return;
    try {
      setIsClean(true);
      setIsPlaying(true);
      const fallbackWord = 'word' in activeItem ? activeItem.word : activeItem.targetWord;
      await audioEngine.play(activeItem.audioUrl, acousticConfig, {
        clean: true,
        playbackRate,
        fallbackWord,
        onEnded: () => setIsPlaying(false)
      });
    } catch (err) {
      console.error('Clean audio playback error:', err);
      setIsPlaying(false);
    }
  }, [activeItem, acousticConfig, playbackRate]);

  // Reset state when item changes
  useEffect(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setFeedback(null);
    
    if (currentMode === 'comprehension_stress' && isAutoMode && activeItem) {
      const presetId = getAutoPresetForScenario(activeItem as StressScenario);
      if (presetId) {
        setAcousticConfig(ACOUSTIC_PRESETS[presetId]);
      }
    }
  }, [activeItem, currentMode, isAutoMode]);

  // Submit and verify answer
  const handleSubmitAnswer = (rawAnswer: string) => {
    if (!activeItem || feedback?.answered) return;

    let isCorrect = false;
    let expected = '';

    if (currentMode === 'minimal_pair') {
      const vocab = activeItem as VocabEntry;
      expected = vocab.word.toLowerCase();
      isCorrect = rawAnswer.trim().toLowerCase() === expected;
    } else if (currentMode === 'dictation') {
      const vocab = activeItem as VocabEntry;
      expected = vocab.word.toLowerCase();
      const cleaned = rawAnswer.trim().toLowerCase();

      if (cleaned === expected) {
        isCorrect = true;
      } else if (NUMBER_SYNONYMS[cleaned] === expected) {
        isCorrect = true;
      } else {
        for (const [digit, word] of Object.entries(NUMBER_SYNONYMS)) {
          if (word === expected && cleaned === digit) {
            isCorrect = true;
            break;
          }
        }
      }
    } else if (currentMode === 'comprehension_stress') {
      const scenario = activeItem as StressScenario;
      expected = scenario.correctOption.toLowerCase();
      isCorrect = rawAnswer.trim().toLowerCase() === expected;
    }

    audioEngine.stop();
    setIsPlaying(false);

    // Record stats
    setStats((prev) => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const modeStat = prev.modeStats[currentMode];

      const newPhonemeAcc = { ...prev.phonemeAccuracy };
      const phonemeKey =
        'targetPhoneme' in activeItem && activeItem.targetPhoneme
          ? activeItem.targetPhoneme
          : undefined;

      if (phonemeKey) {
        const existing = newPhonemeAcc[phonemeKey] || { correct: 0, total: 0 };
        newPhonemeAcc[phonemeKey] = {
          correct: existing.correct + (isCorrect ? 1 : 0),
          total: existing.total + 1
        };
      }

      const historyItem: HistoryItem = {
        id: `drill-${Date.now()}`,
        word: 'word' in activeItem ? activeItem.word : (activeItem as StressScenario).targetWord,
        userAnswer: rawAnswer,
        correctAnswer: expected,
        correct: isCorrect,
        mode: currentMode,
        preset: acousticConfig.name,
        timestamp: Date.now(),
        phoneme: phonemeKey,
        level: activeItem.level
      };

      const itemLevel = activeItem.level;
      const newLevelAcc = { ...(prev.levelAccuracy || {}) };
      if (itemLevel && itemLevel !== 'all') {
        const existing = newLevelAcc[itemLevel] || { correct: 0, total: 0 };
        newLevelAcc[itemLevel] = {
          correct: existing.correct + (isCorrect ? 1 : 0),
          total: existing.total + 1
        };
      }

      return {
        totalAttempted: prev.totalAttempted + 1,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        streak: newStreak,
        bestStreak: newBestStreak,
        modeStats: {
          ...prev.modeStats,
          [currentMode]: {
            attempted: modeStat.attempted + 1,
            correct: modeStat.correct + (isCorrect ? 1 : 0)
          }
        },
        phonemeAccuracy: newPhonemeAcc,
        levelAccuracy: newLevelAcc,
        recentHistory: [historyItem, ...prev.recentHistory.slice(0, 49)]
      };
    });

    setFeedback({
      answered: true,
      isCorrect,
      userAnswer: rawAnswer,
      correctAnswer: expected
    });
  };

  // Switch Oxford Psychometrics level
  const handleSelectLevel = (level: OxfordLevel) => {
    audioEngine.stop();
    setIsPlaying(false);
    setSelectedLevel(level);
    setCurrentIndex(0);
    setFeedback(null);
  };

  // Next challenge
  const handleNext = () => {
    setFeedback(null);
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleShuffle = () => {
    setFeedback(null);
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentIndex((prev) => prev + Math.floor(Math.random() * 7) + 1);
  };

  const handleSelectPreset = (presetId: AcousticPresetId) => {
    audioEngine.stop();
    setIsPlaying(false);
    setAcousticConfig(ACOUSTIC_PRESETS[presetId]);
    setIsAutoMode(false); // disable auto mode if manually selected
  };

  const handleClearStats = () => {
    localStorage.removeItem(STATS_STORAGE_KEY);
    setStats(INITIAL_STATS);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Top Navigation & App Bar */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          audioEngine.stop();
          setIsPlaying(false);
          setFeedback(null);
          setCurrentMode(mode);
          setCurrentIndex(0);
          if (mode === 'comprehension_stress') setIsAutoMode(true);
        }}
        stats={stats}
        onOpenStats={() => setIsStatsOpen(true)}
        calmMode={calmMode}
        onToggleCalmMode={handleToggleCalmMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-8 h-1 bg-[#007aff] rounded-full" />
            <p className="text-sm font-medium text-[#1d1d1f]">
              Loading listening exercises
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl text-[#ff3b30] text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Level Selector */}
            <LevelSelector
              currentLevel={selectedLevel}
              onSelectLevel={handleSelectLevel}
              itemCounts={levelItemCounts}
            />

            {totalModeItems === 0 && (
              <div className="p-8 bg-white border border-black/[0.06] rounded-2xl text-center space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-[#1d1d1f] font-semibold text-sm">
                  No exercises available for Level {selectedLevel} in this category
                </p>
                <button
                  id="reset-level-btn"
                  onClick={() => handleSelectLevel('all')}
                  className="min-h-[44px] px-6 py-2 bg-[#007aff] text-white font-semibold text-xs rounded-full hover:bg-[#007aff]/90 apple-pressable transition-all cursor-pointer shadow-[0_1px_3px_rgba(0,122,255,0.25)]"
                >
                  Show All Levels
                </button>
              </div>
            )}

            {activeItem && totalModeItems > 0 && (
              <>
                {/* Live Waveform Visualizer (Hidden in Calm Mode to reduce visual clutter) */}
                {!calmMode && (
                  <section aria-label="Audio Visualizer">
                    <WaveformVisualizer
                      config={acousticConfig}
                      isPlaying={isPlaying}
                      isClean={isClean}
                    />
                  </section>
                )}

                {/* Core Interactive Practice Card */}
                <section aria-label="Active Exercise">
                  <TrainingCard
                    mode={currentMode}
                    currentItem={activeItem}
                    options={currentOptions}
                    config={acousticConfig}
                    isPlaying={isPlaying}
                    isClean={isClean}
                    playbackRate={playbackRate}
                    onSetPlaybackRate={setPlaybackRate}
                    onPlayDegraded={playDegraded}
                    onPlayClean={playClean}
                    onSubmitAnswer={handleSubmitAnswer}
                    feedback={feedback}
                    onNext={handleNext}
                  />
                </section>

                {/* Exercise Navigator & Counter */}
                <div className="flex items-center justify-between text-xs text-[#8e8e93] px-1">
                  <button
                    id="shuffle-btn"
                    onClick={handleShuffle}
                    className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-[#1d1d1f] font-medium rounded-full transition-all cursor-pointer apple-pressable shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <Shuffle className="w-4 h-4 text-[#007aff]" />
                    <span>Shuffle</span>
                  </button>

                  <div className="flex items-center gap-2 font-medium">
                    <span>
                      Question <strong className="text-[#1d1d1f] font-semibold">{(currentIndex % (totalModeItems || 1)) + 1}</strong> of {totalModeItems}
                    </span>
                    {selectedLevel !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/[0.05] text-[#1d1d1f] font-bold rounded-full text-[11px] border border-black/[0.06]">
                        <span className="text-[9px] text-[#8e8e93] font-medium uppercase">Level</span>
                        <span>{selectedLevel}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Audio Environment Selector */}
                <section aria-label="Audio Environments">
                  <PresetSelector
                    currentConfig={acousticConfig}
                    onSelectPreset={handleSelectPreset}
                    onUpdateConfig={setAcousticConfig}
                    isAutoMode={isAutoMode}
                    onToggleAutoMode={setIsAutoMode}
                    showAutoToggle={currentMode === 'comprehension_stress'}
                  />
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer with Helpful Keyboard Shortcut Hints */}
      <footer className="w-full border-t border-black/[0.06] bg-white/80 backdrop-blur-md py-4 px-4 text-center text-xs text-[#8e8e93] mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#8e8e93]">
            <Keyboard className="w-4 h-4 text-[#8e8e93]" />
            <span>
              Shortcuts: <kbd className="px-1.5 py-0.5 bg-black/[0.04] border border-black/[0.08] rounded-md text-[#1d1d1f] font-mono text-[11px]">Space</kbd> Play / <kbd className="px-1.5 py-0.5 bg-black/[0.04] border border-black/[0.08] rounded-md text-[#1d1d1f] font-mono text-[11px]">C</kbd> Clear Audio / <kbd className="px-1.5 py-0.5 bg-black/[0.04] border border-black/[0.08] rounded-md text-[#1d1d1f] font-mono text-[11px]">1 or 2</kbd> Select / <kbd className="px-1.5 py-0.5 bg-black/[0.04] border border-black/[0.08] rounded-md text-[#1d1d1f] font-mono text-[11px]">Enter</kbd> Next
            </span>
          </div>
          <span className="text-[#8e8e93]">
            Listening Practice
          </span>
        </div>
      </footer>

      {/* Progress & Diagnostics Slide-Out Drawer */}
      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onClearStats={handleClearStats}
      />
    </div>
  );
}
