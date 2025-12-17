import { TopographicBackgroundDebug } from '@/components/common/misc/TopographicBackgroundDebug';
import { Layout } from '@/components/layout/Layout';

export default function TopographyDebug() {
  return (
    <Layout>
      <div className='container mx-auto py-8'>
        <h1 className='text-4xl font-bold mb-4 text-fm-gold'>
          Topography Mirroring Debug
        </h1>
        <p className='text-muted-foreground mb-8'>
          Testing different transform configurations to find the correct mirroring pattern.
          <br />
          <strong>Red line</strong> = left/center border | <strong>Blue line</strong> = center/right border
          <br />
          <strong>Goal:</strong> Find which config creates seamless transitions at both borders
          <br />
          Center tile is highlighted with gold border for reference
          <br />
          <br />
          <strong>Configs tested:</strong>
          <br />
          1. No transforms (baseline)
          <br />
          2. Left flip only (original approach)
          <br />
          3. Right flip only
          <br />
          4. Both flip (current production)
          <br />
          5. Center + Left flip (alternative)
          <br />
          6. Center + Right flip (alternative)
        </p>

        <div className='relative h-screen bg-background'>
          <TopographicBackgroundDebug opacity={0.8} showLabels={true} />
        </div>
      </div>
    </Layout>
  );
}
