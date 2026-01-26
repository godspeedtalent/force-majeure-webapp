import type {
  ReviewMetricConfig,
  ReviewMetricId,
  QualitativeScore,
} from '../types';

export const QUALITATIVE_RATING_OPTIONS: Array<{
  value: QualitativeScore;
  label: string;
}> = [
  { value: 0, label: 'Strongly disliked' },
  { value: 1, label: 'Disliked' },
  { value: 2, label: 'Neutral' },
  { value: 3, label: 'Liked' },
  { value: 4, label: 'Strongly liked' },
];

type TooltipMap = Record<QualitativeScore, string>;

const TRACK_SELECTION_TOOLTIPS: TooltipMap = {
  0: 'Track choices feel random, dated, or algorithmic, with no discernible point of view.',
  1: 'Some decent tracks, but overall selection feels generic or interchangeable with many other sets.',
  2: 'Competent selections, but the set does not establish a clear or memorable musical identity.',
  3: 'Track choices feel intentional and cohesive, with a noticeable aesthetic or mood.',
  4: 'The selection clearly reflects a strong, confident taste and a distinct musical identity.',
};

const FLOW_TOOLTIPS: TooltipMap = {
  0: 'The set feels chaotic or exhausting, with no sense of pacing or narrative.',
  1: 'Energy shifts feel awkward or inconsistent, making the set hard to stay engaged with.',
  2: 'The flow is serviceable, but the set lacks a compelling sense of journey.',
  3: 'Energy develops naturally, with smooth progression and well-timed shifts.',
  4: 'The set tells a clear story, balancing tension and release with confident control.',
};

const TECHNICAL_TOOLTIPS: TooltipMap = {
  0: 'Frequent technical errors or clashing elements make the set difficult to listen to.',
  1: 'Noticeable technical issues occasionally disrupt the flow of the set.',
  2: 'Technically acceptable, with no major errors but nothing particularly refined.',
  3: 'Clean, well-timed mixing that supports the music and maintains immersion.',
  4: 'Technically confident and polished, with seamless transitions throughout.',
};

export const REVIEW_METRIC_CONFIGS: ReviewMetricConfig[] = [
  {
    id: 'trackSelection',
    title: 'Track Selection & Musical Identity',
    descriptor:
      "How intentional, distinctive, and cohesive the music choices feel as a reflection of the DJ's taste and identity.",
    tooltips: TRACK_SELECTION_TOOLTIPS,
  },
  {
    id: 'flowEnergy',
    title: 'Flow & Energy Management',
    descriptor:
      'How well the DJ shapes momentum, tension, and progression across the full arc of the set.',
    tooltips: FLOW_TOOLTIPS,
  },
  {
    id: 'technicalExecution',
    title: 'Technical Execution (Mixing & Control)',
    descriptor:
      'How cleanly and effectively the DJ executes transitions, phrasing, and overall control of the mix.',
    tooltips: TECHNICAL_TOOLTIPS,
  },
];

export const METRIC_ORDER: ReviewMetricId[] = REVIEW_METRIC_CONFIGS.map(
  metric => metric.id
);

export const MAX_METRIC_SCORE: QualitativeScore = 4;
