/**
 * ArtistSignupDemo - Developer demo for testing artist registration
 *
 * Provides three modes:
 * - Manual: Fill out everything manually
 * - Spotify: Pre-fill with Spotify artist data
 * - SoundCloud: Pre-fill with SoundCloud artist data
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Sparkles, RefreshCw, Play, Settings2 } from 'lucide-react';
import { supabase } from '@/shared';
import { SiSpotify, SiSoundcloud } from 'react-icons/si';
import { toast } from 'sonner';

import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { cn } from '@/shared';

import {
  ArtistMockDataService,
  type PopulationMode,
} from '@/services/mockData';
import type { ArtistRegistrationFormData } from '@/pages/artists/types/registration';
import { DEFAULT_FORM_DATA } from '@/pages/artists/types/registration';

// ========================================
// Types
// ========================================

interface ModeOption {
  value: PopulationMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ========================================
// Constants
// ========================================

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'manual',
    label: 'Manual Input',
    description: 'Fill out every field yourself',
    icon: Settings2,
    color: 'text-white',
  },
  {
    value: 'spotify',
    label: 'Spotify Artist',
    description: 'Pre-fill with Spotify data',
    icon: SiSpotify,
    color: 'text-[#1DB954]',
  },
  {
    value: 'soundcloud',
    label: 'SoundCloud Artist',
    description: 'Pre-fill with SoundCloud data',
    icon: SiSoundcloud,
    color: 'text-[#FF5500]',
  },
];

// ========================================
// Component
// ========================================

const ArtistSignupDemo = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  // State
  const [selectedMode, setSelectedMode] = useState<PopulationMode>('spotify');
  const [autoAgreeTerms, setAutoAgreeTerms] = useState(true);
  const [trackCount, setTrackCount] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<ArtistRegistrationFormData | null>(null);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  // Fetch cities on mount for name lookup
  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from('cities').select('id, name');
      if (data) setCities(data);
    };
    fetchCities();
  }, []);

  // Memoized city name lookup
  const cityName = useMemo(() => {
    if (!generatedData?.cityId) return 'Not set';
    const city = cities.find(c => c.id === generatedData.cityId);
    return city?.name || 'Unknown';
  }, [generatedData?.cityId, cities]);

  // Generate mock data
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const service = new ArtistMockDataService({
        mode: selectedMode,
        autoAgreeTerms,
        trackCount,
        includeDJSet: true,
      });

      const data = await service.generateFormData();
      setGeneratedData(data);
      toast.success('Mock data generated successfully!');
    } catch (error) {
      console.error('Failed to generate mock data:', error);
      toast.error('Failed to generate mock data');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMode, autoAgreeTerms, trackCount]);

  // Launch registration with pre-filled data
  const handleLaunchRegistration = useCallback(() => {
    if (!generatedData && selectedMode !== 'manual') {
      toast.error('Please generate data first');
      return;
    }

    // Store data in sessionStorage for the registration page to pick up
    const dataToStore = generatedData || DEFAULT_FORM_DATA;
    sessionStorage.setItem('artistRegistrationDemoData', JSON.stringify(dataToStore));

    // Navigate to artist registration
    navigate('/artists/register?demo=true');
  }, [generatedData, selectedMode, navigate]);

  // Render mode selection cards
  const renderModeCards = () => (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-[20px]'>
      {MODE_OPTIONS.map(mode => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.value;

        return (
          <button
            key={mode.value}
            onClick={() => setSelectedMode(mode.value)}
            className={cn(
              'p-[20px] rounded-none border-2 transition-all duration-300',
              'flex flex-col items-center gap-[10px] text-center',
              'hover:scale-[1.02] active:scale-[0.98]',
              isSelected
                ? 'border-fm-gold bg-fm-gold/10 shadow-[0_0_20px_rgba(223,186,125,0.3)]'
                : 'border-white/20 bg-black/40 hover:border-white/40'
            )}
          >
            <Icon className={cn('h-10 w-10', isSelected ? mode.color : 'text-white/60')} />
            <div>
              <p className='font-canela font-semibold text-lg'>{mode.label}</p>
              <p className='text-sm text-white/60'>{mode.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  // Render configuration options
  const renderConfigOptions = () => (
    <FmCommonCard className='p-[20px]'>
      <h3 className='text-lg font-canela font-semibold mb-[20px] flex items-center gap-[10px]'>
        <Settings2 className='h-5 w-5 text-fm-gold' />
        Configuration
      </h3>

      <div className='space-y-[20px]'>
        {/* Auto-agree terms */}
        <div className='flex items-center justify-between'>
          <div>
            <Label htmlFor='auto-agree' className='text-sm font-medium'>
              Auto-agree to Terms
            </Label>
            <p className='text-xs text-white/60'>
              Pre-check all terms and conditions for faster testing
            </p>
          </div>
          <Switch
            id='auto-agree'
            checked={autoAgreeTerms}
            onCheckedChange={setAutoAgreeTerms}
          />
        </div>

        {/* Track count */}
        <div className='flex items-center justify-between'>
          <div>
            <Label htmlFor='track-count' className='text-sm font-medium'>
              Number of Tracks
            </Label>
            <p className='text-xs text-white/60'>
              How many tracks/sets to pre-generate
            </p>
          </div>
          <Select
            value={trackCount.toString()}
            onValueChange={val => setTrackCount(parseInt(val))}
          >
            <SelectTrigger className='w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>1</SelectItem>
              <SelectItem value='2'>2</SelectItem>
              <SelectItem value='3'>3</SelectItem>
              <SelectItem value='4'>4</SelectItem>
              <SelectItem value='5'>5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FmCommonCard>
  );

  // Render preview of generated data
  const renderDataPreview = () => {
    if (!generatedData) return null;

    return (
      <FmCommonCard className='p-[20px]'>
        <h3 className='text-lg font-canela font-semibold mb-[20px] flex items-center gap-[10px]'>
          <Sparkles className='h-5 w-5 text-fm-gold' />
          Generated Data Preview
        </h3>

        <div className='space-y-[15px]'>
          {/* Basic Info */}
          <div className='grid grid-cols-2 gap-[10px]'>
            <div>
              <Label className='text-xs text-white/60'>Stage Name</Label>
              <p className='font-medium truncate'>{generatedData.stageName}</p>
            </div>
            <div>
              <Label className='text-xs text-white/60'>City</Label>
              <p className='font-medium'>{cityName}</p>
            </div>
          </div>

          {/* Bio Preview */}
          <div>
            <Label className='text-xs text-white/60'>Bio</Label>
            <p className='text-sm text-white/80 line-clamp-2'>{generatedData.bio}</p>
          </div>

          {/* Genres */}
          <div>
            <Label className='text-xs text-white/60'>Genres ({generatedData.genres.length})</Label>
            <div className='flex flex-wrap gap-[5px] mt-[5px]'>
              {generatedData.genres.map(genre => (
                <span
                  key={genre.id}
                  className='text-xs px-[8px] py-[2px] bg-fm-gold/20 text-fm-gold rounded-none border border-fm-gold/30'
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className='grid grid-cols-2 gap-[10px]'>
            <div>
              <Label className='text-xs text-white/60'>Instagram</Label>
              <p className='text-sm truncate'>@{generatedData.instagramHandle}</p>
            </div>
            <div>
              <Label className='text-xs text-white/60'>
                {selectedMode === 'spotify' ? 'Spotify' : 'SoundCloud'}
              </Label>
              <p className='text-sm truncate'>
                {selectedMode === 'spotify' ? generatedData.spotifyUrl : generatedData.soundcloudUrl}
              </p>
            </div>
          </div>

          {/* Tracks */}
          <div>
            <Label className='text-xs text-white/60'>Tracks ({generatedData.tracks.length})</Label>
            <div className='mt-[5px] space-y-[5px]'>
              {generatedData.tracks.map(track => (
                <div
                  key={track.id}
                  className='flex items-center gap-[10px] text-sm p-[8px] bg-white/5 rounded-none'
                >
                  {track.platform === 'spotify' ? (
                    <SiSpotify className='h-4 w-4 text-[#1DB954]' />
                  ) : (
                    <SiSoundcloud className='h-4 w-4 text-[#FF5500]' />
                  )}
                  <span className='flex-1 truncate'>{track.name}</span>
                  <span className='text-xs text-white/40'>
                    {track.recordingType === 'dj_set' ? 'DJ Set' : 'Track'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FmCommonCard>
    );
  };

  return (
    <DemoLayout
      title={t('demo.artistSignup.title', 'Artist Signup Demo')}
      description={t('demo.artistSignup.description', 'Test the artist registration flow with auto-populated data')}
      icon={Music}
      showBackButton
      onBack={() => navigate('/developer')}
      backButtonLabel='Developer Home'
    >
      <div className='space-y-[40px]'>
        {/* Mode Selection */}
        <section>
          <h2 className='text-xl font-canela font-semibold mb-[20px]'>
            Select Population Mode
          </h2>
          {renderModeCards()}
        </section>

        {/* Configuration */}
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-[20px]'>
          <div>
            {renderConfigOptions()}
          </div>

          <div>
            {generatedData ? (
              renderDataPreview()
            ) : (
              <FmCommonCard className='p-[20px] h-full flex items-center justify-center'>
                <div className='text-center text-white/40'>
                  <Sparkles className='h-12 w-12 mx-auto mb-[10px] opacity-50' />
                  <p>Click "Generate Data" to preview mock data</p>
                </div>
              </FmCommonCard>
            )}
          </div>
        </section>

        {/* Actions */}
        <section className='flex flex-col sm:flex-row gap-[15px] justify-center'>
          {selectedMode !== 'manual' && (
            <FmCommonButton
              onClick={handleGenerate}
              disabled={isGenerating}
              variant='secondary'
              className='min-w-[200px]'
            >
              <RefreshCw className={cn('h-4 w-4 mr-[8px]', isGenerating && 'animate-spin')} />
              {isGenerating ? 'Generating...' : 'Generate Data'}
            </FmCommonButton>
          )}

          <FmCommonButton
            onClick={handleLaunchRegistration}
            disabled={selectedMode !== 'manual' && !generatedData}
            variant='default'
            className='min-w-[200px]'
          >
            <Play className='h-4 w-4 mr-[8px]' />
            Launch Registration
          </FmCommonButton>
        </section>

        {/* Instructions */}
        <section className='text-center text-sm text-white/60'>
          <p>
            {selectedMode === 'manual'
              ? 'In manual mode, you\'ll fill out the entire form yourself. Click "Launch Registration" to begin.'
              : 'Generate mock data first, then launch the registration form with pre-filled values. Each generation produces unique data.'}
          </p>
        </section>
      </div>
    </DemoLayout>
  );
};

export default ArtistSignupDemo;
