/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Gauge,
  Globe,
  LayoutDashboard,
  Play,
  Repeat,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react';
import { MotionSettingsConfig } from '../../types';
import {
  DEFAULT_MOTION_CONFIG,
  MOTION_CATEGORY_LABELS,
  MOTION_PRESETS,
  MotionPresetCategory,
  buildMotionPropsForPreset,
  clampMotionSpeed,
  computePresetDuration,
  getMotionPresetById,
} from '../../utils/dashboardMotion';

interface AdminAnimationsSectionProps {
  value?: MotionSettingsConfig | null;
  pageTitle?: string;
  canEdit?: boolean;
  onChange: (nextConfig: MotionSettingsConfig) => void;
  onSaveAndApply: (nextConfig: MotionSettingsConfig) => Promise<void> | void;
  onResetDefault?: () => Promise<void> | void;
}

const SPEED_QUICK_STEPS: Array<{ val: number; label: string }> = [
  { val: 0.4, label: '0.4x بطيء' },
  { val: 0.75, label: '0.75x هادئ' },
  { val: 1.0, label: '1.0x قياسي' },
  { val: 1.5, label: '1.5x سريع' },
  { val: 2.2, label: '2.2x فائق' },
];

type PreviewTabId = 'overview' | 'orders' | 'items';

export const AdminAnimationsSection: React.FC<AdminAnimationsSectionProps> = ({
  value,
  pageTitle,
  canEdit = true,
  onChange,
  onSaveAndApply,
  onResetDefault,
}) => {
  const currentConfig: MotionSettingsConfig = useMemo(
    () => ({
      presetId: getMotionPresetById(value?.presetId).id,
      speedMultiplier: clampMotionSpeed(value?.speedMultiplier),
      applyToAdmin: value?.applyToAdmin !== false,
      applyToDashboard: value?.applyToDashboard !== false,
      applyToSite: value?.applyToSite !== false,
    }),
    [value]
  );

  const selectedPreset = useMemo(
    () => getMotionPresetById(currentConfig.presetId),
    [currentConfig.presetId]
  );

  const [categoryFilter, setCategoryFilter] = useState<MotionPresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playKey, setPlayKey] = useState(1);
  const [autoLoop, setAutoLoop] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTabId>('overview');
  const [saving, setSaving] = useState(false);

  const triggerReplay = useCallback(() => {
    setPlayKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!autoLoop) return;
    const effectiveMs = Math.max(950, Math.round(computePresetDuration(selectedPreset, currentConfig.speedMultiplier) * 1000) + 1150);
    const id = window.setInterval(() => {
      setPlayKey((k) => k + 1);
    }, effectiveMs);
    return () => window.clearInterval(id);
  }, [autoLoop, selectedPreset, currentConfig.speedMultiplier]);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MOTION_PRESETS.filter((preset) => {
      if (categoryFilter !== 'all' && preset.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        preset.officialName.toLowerCase().includes(q) ||
        preset.arabicLabel.toLowerCase().includes(q) ||
        preset.id.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

  const handleSelectPreset = (presetId: string) => {
    const next: MotionSettingsConfig = {
      ...currentConfig,
      presetId,
    };
    onChange(next);
    setPlayKey((k) => k + 1);
  };

  const handleSpeedChange = (nextSpeed: number) => {
    const clamped = clampMotionSpeed(nextSpeed);
    const next: MotionSettingsConfig = {
      ...currentConfig,
      speedMultiplier: clamped,
    };
    onChange(next);
    setPlayKey((k) => k + 1);
  };

  const handleToggleScope = (field: 'applyToAdmin' | 'applyToDashboard' | 'applyToSite') => {
    const next: MotionSettingsConfig = {
      ...currentConfig,
      [field]: !(currentConfig[field] !== false),
    };
    onChange(next);
  };

  const handleApplyAllPanels = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const next: MotionSettingsConfig = {
        ...currentConfig,
        applyToAdmin: true,
        applyToDashboard: true,
        applyToSite: true,
      };
      onChange(next);
      await onSaveAndApply(next);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrent = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      await onSaveAndApply(currentConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const def = { ...DEFAULT_MOTION_CONFIG };
      onChange(def);
      setPlayKey((k) => k + 1);
      if (onResetDefault) {
        await onResetDefault();
      } else {
        await onSaveAndApply(def);
      }
    } finally {
      setSaving(false);
    }
  };

  const effectiveDurationSec = computePresetDuration(selectedPreset, currentConfig.speedMultiplier);
  const effectiveDurationMs = Math.round(effectiveDurationSec * 1000);

  const previewTabMotion = buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
    shape: 'page',
    durationScale: 1.0,
    reduced: false,
  });

  const previewHeroProps = buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
    shape: 'hero',
    reduced: false,
  });

  const previewPillProps = (idx: number) =>
    buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
      shape: 'pill',
      idx,
      delay: Math.min(0.03 + idx * 0.045, 0.2),
      reduced: false,
    });

  const previewCardProps = (idx: number) =>
    buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
      shape: 'card',
      idx,
      delay: Math.min(0.06 + idx * 0.075, 0.34),
      withHoverTap: true,
      reduced: false,
    });

  const previewRowProps = (idx: number) =>
    buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
      shape: 'row',
      idx,
      delay: Math.min(0.14 + idx * 0.07, 0.4),
      reduced: false,
    });

  const previewButtonProps = buildMotionPropsForPreset(selectedPreset, currentConfig.speedMultiplier, {
    shape: 'button',
    delay: 0.12,
    withHoverTap: true,
    reduced: false,
  });

  const allCategories: Array<MotionPresetCategory | 'all'> = [
    'all',
    'slide',
    'fade',
    'zoom',
    'blur',
    'spring',
    'tilt_3d',
    'special',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{pageTitle || 'الأنيميشن والحركات'}</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            اختر من بين {MOTION_PRESETS.length} حركة رسمية تتكيّف تلقائياً مع كل شكل وعنصر (بطاقات، صفوف، أزرار، شارات) وتُطبّق فوراً على الموقع والإدارة ولوحات التجار.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn s"
            disabled={!canEdit || saving}
            onClick={() => void handleReset()}
            style={{ gap: '6px' }}
          >
            <RotateCcw size={14} />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            className="btn p"
            disabled={!canEdit || saving}
            onClick={() => void handleSaveCurrent()}
            style={{ gap: '6px' }}
          >
            <Save size={14} />
            <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وتطبيق'}</span>
          </button>
        </div>
      </div>

      {/* Top Interactive Workspace: Live Preview Stage + Speed & Scope Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* LIVE PREVIEW STAGE */}
        <div className="mp-framed-wrap" style={{ margin: 0 }}>
          <div
            className="mp-framed-title"
            style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Sparkles size={15} style={{ color: 'var(--brand-ink, var(--brand))' }} />
              <span>المثال الحي المباشر</span>
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className={`btn s${autoLoop ? ' p' : ''}`}
                onClick={() => setAutoLoop((v) => !v)}
                style={{
                  minHeight: '32px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  gap: '5px',
                }}
              >
                <Repeat size={13} />
                <span>{autoLoop ? 'إيقاف التكرار' : 'تكرار تلقائي'}</span>
              </button>

              <button
                type="button"
                className="btn p"
                onClick={triggerReplay}
                style={{
                  minHeight: '32px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  gap: '5px',
                }}
              >
                <Play size={13} />
                <span>إعادة التشغيل</span>
              </button>
            </div>
          </div>

          <div
            className="mp-framed-box"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '300px',
            }}
          >
            {/* Active Preset Official Metadata Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div>
                <div
                  dir="ltr"
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {selectedPreset.officialName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  <span>{selectedPreset.arabicLabel}</span>
                  <span style={{ marginInline: '6px' }}>·</span>
                  <span>{MOTION_CATEGORY_LABELS[selectedPreset.category]}</span>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'end',
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--brand-ink, var(--brand))' }}>
                  {effectiveDurationMs} ms · {currentConfig.speedMultiplier.toFixed(2)}x
                </div>
                <div dir="ltr" style={{ fontSize: '11px', opacity: 0.85 }}>
                  {selectedPreset.curveLabel}
                </div>
              </div>
            </div>

            {/* Simulated Dashboard Top Tab Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px',
                borderRadius: '10px',
                background: 'var(--bg)',
                border: '1px solid var(--line)',
              }}
            >
              {(
                [
                  { id: 'overview', label: 'نظرة عامة', Icon: LayoutDashboard },
                  { id: 'orders', label: 'الطلبات الحية', Icon: ShoppingBag },
                  { id: 'items', label: 'الأصناف', Icon: Utensils },
                ] as const
              ).map(({ id, label, Icon }) => {
                const isActive = previewTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPreviewTab(id);
                      setPlayKey((k) => k + 1);
                    }}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      minHeight: '34px',
                      padding: '5px 8px',
                      borderRadius: '7px',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: isActive ? 'var(--surface)' : 'transparent',
                      color: isActive ? 'var(--ink)' : 'var(--muted)',
                      boxShadow: isActive ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulated Dashboard Canvas */}
            <div
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                padding: '14px',
                overflow: 'hidden',
                perspective: '1000px',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedPreset.id}-${previewTab}-${playKey}`}
                  {...previewTabMotion}
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  {/* Simulated Shape-Varied Hero Strip + Action Button + Micro-Pills */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <motion.div
                      {...previewHeroProps}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: 'var(--ink)',
                      }}
                    >
                      <span>حركة متناغمة حسب الشكل والحجم</span>
                    </motion.div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      {(['بطاقة', 'صف', 'زر'].map((lbl, pIdx) => (
                        <motion.span
                          key={lbl}
                          {...previewPillProps(pIdx)}
                          style={{
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            color: 'var(--muted)',
                          }}
                        >
                          {lbl}
                        </motion.span>
                      )))}
                      <motion.button
                        type="button"
                        onClick={triggerReplay}
                        {...previewButtonProps}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: 'var(--brand)',
                          color: 'var(--on-brand, #fff)',
                          border: 0,
                          cursor: 'pointer',
                        }}
                      >
                        اختبار
                      </motion.button>
                    </div>
                  </div>

                  {/* 3 Mini KPI Stat Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {(previewTab === 'overview'
                      ? [
                          { label: 'طلبات اليوم', val: '128' },
                          { label: 'الزيارات', val: '1,420' },
                          { label: 'المبيعات', val: '940K' },
                        ]
                      : previewTab === 'orders'
                      ? [
                          { label: 'قيد التحضير', val: '14' },
                          { label: 'توصيل', val: '36' },
                          { label: 'مكتملة', val: '82' },
                        ]
                      : [
                          { label: 'الأصناف', val: '64' },
                          { label: 'الأقسام', val: '9' },
                          { label: 'المتوفرة', val: '61' },
                        ]
                    ).map((stat, idx) => (
                      <motion.div
                        key={`${stat.label}-${idx}`}
                        {...previewCardProps(idx)}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          textAlign: 'start',
                        }}
                      >
                        <div
                          className="tabular-nums"
                          style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}
                        >
                          {stat.val}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* 2 Mini List Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(previewTab === 'overview'
                      ? [
                          { title: 'طلب توصيل #2048 · حي المنصور', price: '28,500 د.ع' },
                          { title: 'طلب طاولة #12 · كريسبي برجر', price: '16,000 د.ع' },
                        ]
                      : previewTab === 'orders'
                      ? [
                          { title: 'فاتورة #2051 · استلام مباشر', price: '19,000 د.ع' },
                          { title: 'فاتورة #2050 · قيد التوصيل', price: '42,000 د.ع' },
                        ]
                      : [
                          { title: 'برجر لحم أنغوس مضاعف', price: '11,000 د.ع' },
                          { title: 'قهوة سبانش لاتيه مثلجة', price: '5,500 د.ع' },
                        ]
                    ).map((row, idx) => (
                      <motion.div
                        key={`${row.title}-${idx}`}
                        {...previewRowProps(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '9px',
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{row.title}</span>
                        <span
                          className="tabular-nums"
                          style={{
                            fontWeight: 800,
                            color: 'var(--brand-ink, var(--brand))',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.price}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* SPEED CONTROL & GLOBAL SCOPE SETTINGS */}
        <div className="mp-framed-wrap" style={{ margin: 0 }}>
          <div className="mp-framed-title" style={{ justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <Gauge size={15} style={{ color: 'var(--brand-ink, var(--brand))' }} />
              <span>التحكم بالسرعة ونطاق اللوحات</span>
            </span>
          </div>

          <div
            className="mp-framed-box"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}
          >
            {/* Speed Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>
                  سرعة الحركة
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-ink, var(--brand))' }}
                >
                  {currentConfig.speedMultiplier.toFixed(2)}x · {effectiveDurationMs} ms
                </span>
              </div>

              <input
                type="range"
                min={0.35}
                max={3.0}
                step={0.05}
                disabled={!canEdit}
                value={currentConfig.speedMultiplier}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                aria-label="سرعة الأنيميشن"
                style={{ width: '100%', accentColor: 'var(--brand)' }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: 'var(--muted)',
                }}
              >
                <span>أبطأ (0.35x)</span>
                <span>قياسي (1.0x)</span>
                <span>أسرع (3.0x)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))', gap: '6px' }}>
                {SPEED_QUICK_STEPS.map((sp) => {
                  const isMatch = Math.abs(currentConfig.speedMultiplier - sp.val) < 0.03;
                  return (
                    <button
                      key={sp.val}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleSpeedChange(sp.val)}
                      className={`mp-seg-btn${isMatch ? ' is-active' : ''}`}
                      style={{
                        justifyContent: 'center',
                        minHeight: '36px',
                        fontSize: '11.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Scope Toggles */}
            <div
              style={{
                paddingTop: '14px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>
                اللوحات المطبّق عليها الأنيميشن
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '8px' }}>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleScope('applyToAdmin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '11px',
                    border: currentConfig.applyToAdmin !== false ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: currentConfig.applyToAdmin !== false ? 'var(--soft)' : 'var(--bg)',
                    color: 'var(--ink)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    textAlign: 'start',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                    <Shield size={15} style={{ color: 'var(--brand-ink, var(--brand))' }} />
                    <span>لوحة تحكم الإدارة</span>
                  </span>
                  {currentConfig.applyToAdmin !== false && (
                    <Check size={15} style={{ color: 'var(--brand-ink, var(--brand))', flexShrink: 0 }} />
                  )}
                </button>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleScope('applyToDashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '11px',
                    border: currentConfig.applyToDashboard !== false ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: currentConfig.applyToDashboard !== false ? 'var(--soft)' : 'var(--bg)',
                    color: 'var(--ink)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    textAlign: 'start',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                    <Store size={15} style={{ color: 'var(--brand-ink, var(--brand))' }} />
                    <span>لوحات المتاجر والتجار</span>
                  </span>
                  {currentConfig.applyToDashboard !== false && (
                    <Check size={15} style={{ color: 'var(--brand-ink, var(--brand))', flexShrink: 0 }} />
                  )}
                </button>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleToggleScope('applyToSite')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '11px',
                    border: currentConfig.applyToSite !== false ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: currentConfig.applyToSite !== false ? 'var(--soft)' : 'var(--bg)',
                    color: 'var(--ink)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    textAlign: 'start',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                    <Globe size={15} style={{ color: 'var(--brand-ink, var(--brand))' }} />
                    <span>الموقع العام والمنيوهات</span>
                  </span>
                  {currentConfig.applyToSite !== false && (
                    <Check size={15} style={{ color: 'var(--brand-ink, var(--brand))', flexShrink: 0 }} />
                  )}
                </button>
              </div>

              <button
                type="button"
                className="btn p"
                disabled={!canEdit || saving}
                onClick={() => void handleApplyAllPanels()}
                style={{ width: '100%', justifyContent: 'center', gap: '7px', marginTop: '2px' }}
              >
                <Check size={15} />
                <span>تفعيل وتطبيق على الموقع واللوحات كاملتها</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 40 OFFICIAL ANIMATIONS CATALOG */}
      <div className="mp-framed-wrap">
        <div
          className="mp-framed-title"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}
        >
          <span>مكتبة الحركات الرسمية ({MOTION_PRESETS.length} أنيميشن)</span>

          <div style={{ position: 'relative', minWidth: '230px', flex: '0 1 280px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                top: '50%',
                insetInlineStart: '11px',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم الرسمي أو العربي..."
              aria-label="بحث في خيارات الأنيميشن"
              style={{
                width: '100%',
                minHeight: '36px',
                paddingInlineStart: '32px',
                paddingInlineEnd: '10px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '12.5px',
              }}
            />
          </div>
        </div>

        <div className="mp-framed-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Category Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            {allCategories.map((cat) => {
              const count =
                cat === 'all'
                  ? MOTION_PRESETS.length
                  : MOTION_PRESETS.filter((p) => p.category === cat).length;
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`mp-seg-btn${isActive ? ' is-active' : ''}`}
                  style={{
                    minHeight: '34px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{MOTION_CATEGORY_LABELS[cat]}</span>
                  <span className="tabular-nums" style={{ opacity: 0.72, marginInlineStart: '4px' }}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtered Presets Grid */}
          {filteredPresets.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--muted)',
                borderRadius: '12px',
                border: '1px dashed var(--line)',
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: '13.5px' }}>
                لا توجد حركات مطابقة لعبارة البحث الحالية.
              </p>
              <button
                type="button"
                className="btn s"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                عرض جميع الحركات ({MOTION_PRESETS.length})
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '10px',
              }}
            >
              {filteredPresets.map((preset) => {
                const presetNumber = MOTION_PRESETS.findIndex((p) => p.id === preset.id) + 1;
                const isSelected = preset.id === selectedPreset.id;
                const presetMs = Math.round(
                  computePresetDuration(preset, currentConfig.speedMultiplier) * 1000
                );

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleSelectPreset(preset.id)}
                    style={{
                      textAlign: 'start',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                      background: isSelected ? 'var(--soft)' : 'var(--bg)',
                      color: 'var(--ink)',
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        width: '100%',
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: isSelected ? 'var(--brand-ink, var(--brand))' : 'var(--muted)',
                        }}
                      >
                        {String(presetNumber).padStart(2, '0')}
                      </span>

                      {isSelected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            color: 'var(--brand-ink, var(--brand))',
                          }}
                        >
                          <Check size={13} />
                          <span>مفعّل</span>
                        </span>
                      ) : (
                        <span
                          className="tabular-nums"
                          style={{ fontSize: '11px', color: 'var(--muted)' }}
                        >
                          {presetMs} ms
                        </span>
                      )}
                    </div>

                    <div
                      dir="ltr"
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: 'var(--ink)',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {preset.officialName}
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        lineHeight: 1.45,
                      }}
                    >
                      {preset.arabicLabel} · {MOTION_CATEGORY_LABELS[preset.category].split('·')[0].trim()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
