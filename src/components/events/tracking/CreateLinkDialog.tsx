import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/shadcn/form';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useTrackingLinks } from './hooks/useTrackingLinks';
import { TrackingLink } from '@/types/tracking';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { getTrackingLinkUrl } from '@/shared/utils/trackingLinkUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/common/shadcn/collapsible';
import { ChevronDown, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';

// Schema is created inside component to access translations
const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('tracking.validation.nameRequired')),
  code: z.string().min(3, t('tracking.validation.codeMinLength')).regex(/^[a-z0-9-]+$/, t('tracking.validation.codePattern')),
  utm_source: z.string().min(1, t('tracking.validation.sourceRequired')),
  utm_medium: z.string().min(1, t('tracking.validation.mediumRequired')),
  utm_campaign: z.string().min(1, t('tracking.validation.campaignRequired')),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  custom_destination_url: z.string().url().optional().or(z.literal('')),
  expires_at: z.date().optional(),
  max_clicks: z.number().int().positive().optional(),
});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

const SOURCE_SUGGESTIONS = ['instagram', 'facebook', 'twitter', 'email', 'google', 'tiktok', 'linkedin'];
const MEDIUM_SUGGESTIONS = ['social', 'email', 'cpc', 'banner', 'affiliate', 'referral'];

interface CreateLinkDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLink?: TrackingLink | null;
}

export function CreateLinkDialog({ eventId, open, onOpenChange, editingLink }: CreateLinkDialogProps) {
  const { t } = useTranslation('common');
  const { createLink, updateLink } = useTrackingLinks(eventId);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const formSchema = createFormSchema(t);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      custom_destination_url: '',
    },
  });

  // Auto-generate code from name
  const watchName = form.watch('name');
  useEffect(() => {
    if (!editingLink && watchName) {
      const autoCode = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20);
      form.setValue('code', autoCode);
    }
  }, [watchName, editingLink, form]);

  // Populate form when editing
  useEffect(() => {
    if (editingLink) {
      form.reset({
        name: editingLink.name,
        code: editingLink.code,
        utm_source: editingLink.utm_source,
        utm_medium: editingLink.utm_medium,
        utm_campaign: editingLink.utm_campaign,
        utm_content: editingLink.utm_content || '',
        utm_term: editingLink.utm_term || '',
        custom_destination_url: editingLink.custom_destination_url || '',
        expires_at: editingLink.expires_at ? new Date(editingLink.expires_at) : undefined,
        max_clicks: editingLink.max_clicks || undefined,
      });
    } else {
      form.reset();
    }
  }, [editingLink, form]);

  const onSubmit = async (data: FormData) => {
    if (editingLink) {
      await updateLink.mutateAsync({ id: editingLink.id, data });
    } else {
      await createLink.mutateAsync(data);
    }
    onOpenChange(false);
    form.reset();
  };

  const previewUrl = form.watch('code')
    ? getTrackingLinkUrl(form.watch('code'))
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLink ? t('tracking.editLink') : t('tracking.createLink')}</DialogTitle>
          <DialogDescription>
            {t('tracking.createLinkDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tracking.linkName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('tracking.placeholders.linkName')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tracking.shortCode')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('tracking.placeholders.shortCode')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewUrl && (
              <div className="p-3 bg-muted rounded-none">
                <p className="text-xs text-muted-foreground mb-1">{t('tracking.previewUrl')}:</p>
                <code className="text-xs break-all">{previewUrl}</code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="utm_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      {t('tracking.utmSource')} *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('tracking.utmDescriptions.source')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tracking.placeholders.selectSource')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_SUGGESTIONS.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">{t('tracking.custom')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value === 'custom' && (
                      <Input
                        placeholder={t('tracking.placeholders.customSource')}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utm_medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      {t('tracking.utmMedium')} *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('tracking.utmDescriptions.medium')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tracking.placeholders.selectMedium')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDIUM_SUGGESTIONS.map((medium) => (
                          <SelectItem key={medium} value={medium}>
                            {medium}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">{t('tracking.custom')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value === 'custom' && (
                      <Input
                        placeholder={t('tracking.placeholders.customMedium')}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="utm_campaign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    {t('tracking.utmCampaign')} *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{t('tracking.utmDescriptions.campaign')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('tracking.placeholders.campaign')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="utm_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      {t('tracking.utmContent')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('tracking.utmDescriptions.content')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('tracking.placeholders.content')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utm_term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      {t('tracking.utmTerm')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{t('tracking.utmDescriptions.term')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('tracking.placeholders.term')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                {t('tracking.advancedOptions')}
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="custom_destination_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tracking.customDestinationUrl')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('tracking.placeholders.customUrl')} {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {t('tracking.customUrlHelp')}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expires_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tracking.expirationDate')}</FormLabel>
                        <FormControl>
                          <FmCommonDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('tracking.neverExpires')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_clicks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tracking.maxClicks')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('tracking.unlimited')}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2 pt-4">
              <FmCommonButton
                type="button"
                variant="default"
                onClick={() => onOpenChange(false)}
              >
                {t('buttons.cancel')}
              </FmCommonButton>
              <FmCommonButton
                type="submit"
                variant="gold"
                loading={createLink.isPending || updateLink.isPending}
              >
                {editingLink ? t('tracking.updateLink') : t('tracking.createLinkButton')}
              </FmCommonButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
