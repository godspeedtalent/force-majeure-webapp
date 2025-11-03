import { Separator } from '@/components/common/shadcn/separator';

/**
 * OAuthDivider - Visual divider for OAuth vs email/password authentication
 *
 * Displays a horizontal line with "OR" text in the center
 */

export const OAuthDivider = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Or</span>
      </div>
    </div>
  );
};
