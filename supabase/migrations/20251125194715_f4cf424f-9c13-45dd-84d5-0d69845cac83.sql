-- Create report configurations table
CREATE TABLE public.report_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  schedule_type TEXT, -- 'daily', 'weekly', 'monthly', 'weekly_day', 'monthly_day'
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  schedule_day_of_week INTEGER, -- 0-6 for weekly_day
  schedule_day_of_month INTEGER, -- 1-31 for monthly_day
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report recipients table
CREATE TABLE public.report_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_config_id UUID NOT NULL REFERENCES public.report_configurations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report history table
CREATE TABLE public.report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_config_id UUID NOT NULL REFERENCES public.report_configurations(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_configurations
CREATE POLICY "Admins can manage report configurations"
ON public.report_configurations
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
);

CREATE POLICY "Org admins can manage their org's report configurations"
ON public.report_configurations
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND 
  has_permission(auth.uid(), 'manage_events') AND
  (EXISTS (
    SELECT 1 FROM events e
    JOIN profiles p ON p.organization_id = e.organization_id
    WHERE e.id = report_configurations.event_id AND p.user_id = auth.uid()
  ))
);

-- RLS Policies for report_recipients
CREATE POLICY "Admins can manage report recipients"
ON public.report_recipients
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
);

CREATE POLICY "Org admins can manage their org's report recipients"
ON public.report_recipients
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND 
  has_permission(auth.uid(), 'manage_events') AND
  (EXISTS (
    SELECT 1 FROM report_configurations rc
    JOIN events e ON e.id = rc.event_id
    JOIN profiles p ON p.organization_id = e.organization_id
    WHERE rc.id = report_recipients.report_config_id AND p.user_id = auth.uid()
  ))
);

-- RLS Policies for report_history
CREATE POLICY "Admins can view report history"
ON public.report_history
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid()))
);

CREATE POLICY "Org admins can view their org's report history"
ON public.report_history
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  has_permission(auth.uid(), 'manage_events') AND
  (EXISTS (
    SELECT 1 FROM report_configurations rc
    JOIN events e ON e.id = rc.event_id
    JOIN profiles p ON p.organization_id = e.organization_id
    WHERE rc.id = report_history.report_config_id AND p.user_id = auth.uid()
  ))
);

-- Create indexes for performance
CREATE INDEX idx_report_configurations_event_id ON public.report_configurations(event_id);
CREATE INDEX idx_report_recipients_report_config_id ON public.report_recipients(report_config_id);
CREATE INDEX idx_report_history_report_config_id ON public.report_history(report_config_id);
CREATE INDEX idx_report_history_sent_at ON public.report_history(sent_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_report_configurations_updated_at
BEFORE UPDATE ON public.report_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();