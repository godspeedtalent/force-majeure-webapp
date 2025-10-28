# FmCommon Form Components - Usage Examples

## Quick Start Example

### Simple Contact Form
```tsx
import { z } from 'zod';
import { 
  FmCommonForm, 
  FmCommonFormField, 
  FmCommonFormActions 
} from '@/components/common/fm';
import { stringRequired, emailField } from '@/shared/utils';

const schema = z.object({
  name: stringRequired('Name', 100),
  email: emailField,
  message: stringRequired('Message', 1000),
});

export function ContactForm() {
  const handleSubmit = async (data: z.infer<typeof schema>) => {
    await sendMessage(data);
    toast.success('Message sent!');
  };

  return (
    <FmCommonForm schema={schema} defaultValues={{ name: '', email: '', message: '' }} onSubmit={handleSubmit}>
      {(form) => (
        <>
          <FmCommonFormField form={form} name="name" label="Your Name" required />
          <FmCommonFormField form={form} name="email" label="Email" type="email" required />
          <FmCommonFormField form={form} name="message" label="Message" textarea rows={6} required />
          <FmCommonFormActions submitText="Send Message" isSubmitting={form.formState.isSubmitting} />
        </>
      )}
    </FmCommonForm>
  );
}
```

---

## Complex Multi-Section Form

### Event Creation Form with Sections
```tsx
import { z } from 'zod';
import { Calendar, MapPin, Music, DollarSign } from 'lucide-react';
import {
  FmCommonForm,
  FmCommonFormField,
  FmCommonFormSelect,
  FmCommonFormSection,
  FmCommonFormActions,
  FmCommonStackLayout,
} from '@/components/common/fm';
import { stringRequired, urlOptional, futureDateField, priceField } from '@/shared/utils';

const eventSchema = z.object({
  // Basic info
  title: stringRequired('Event title', 200),
  venue: stringRequired('Venue', 200),
  date: futureDateField,
  time: z.string().min(1, 'Time is required'),
  
  // Details
  description: z.string().max(2000).optional(),
  genre: z.string().min(1, 'Genre is required'),
  
  // Ticketing
  ticketUrl: urlOptional,
  ticketPrice: priceField,
});

export function EventCreateForm() {
  return (
    <FmCommonForm
      schema={eventSchema}
      defaultValues={{
        title: '',
        venue: '',
        date: new Date(),
        time: '',
        description: '',
        genre: '',
        ticketUrl: '',
        ticketPrice: 0,
      }}
      onSubmit={async (data) => {
        await createEvent(data);
        toast.success('Event created!');
        navigate('/events');
      }}
    >
      {(form) => (
        <FmCommonStackLayout spacing="lg">
          {/* Basic Information */}
          <FmCommonFormSection
            title="Basic Information"
            description="Core event details"
            icon={Calendar}
            layout="grid-2"
            required
          >
            <FmCommonFormField form={form} name="title" label="Event Title" placeholder="Ninajirachi Live" required />
            <FmCommonFormField form={form} name="venue" label="Venue" placeholder="The Parish" required />
            <FmCommonFormField form={form} name="date" label="Event Date" type="date" required />
            <FmCommonFormField form={form} name="time" label="Start Time" type="time" required />
          </FmCommonFormSection>

          {/* Additional Details */}
          <FmCommonFormSection
            title="Event Details"
            description="Describe the event and music style"
            icon={Music}
            layout="stack"
          >
            <FmCommonFormSelect
              form={form}
              name="genre"
              label="Primary Genre"
              placeholder="Select genre"
              options={[
                { value: 'electronic', label: 'Electronic' },
                { value: 'hyperpop', label: 'Hyperpop' },
                { value: 'hiphop', label: 'Hip Hop' },
                { value: 'indie', label: 'Indie' },
              ]}
              required
            />
            
            <FmCommonFormField
              form={form}
              name="description"
              label="Description"
              placeholder="Describe the event..."
              textarea
              rows={6}
              description="Optional event description (max 2000 characters)"
            />
          </FmCommonFormSection>

          {/* Ticketing */}
          <FmCommonFormSection
            title="Ticketing Information"
            description="Ticket purchase details"
            icon={DollarSign}
            layout="grid-2"
          >
            <FmCommonFormField
              form={form}
              name="ticketUrl"
              label="Ticket Purchase URL"
              type="url"
              placeholder="https://eventim.us/..."
              description="External link to purchase tickets"
            />
            
            <FmCommonFormField
              form={form}
              name="ticketPrice"
              label="Ticket Price (in cents)"
              type="number"
              placeholder="2500"
              description="Enter price in cents (e.g., 2500 = $25.00)"
              required
            />
          </FmCommonFormSection>

          {/* Form Actions */}
          <FmCommonFormActions
            submitText="Create Event"
            cancelText="Cancel"
            showCancel
            onCancel={() => navigate('/events')}
            showReset
            onReset={() => form.reset()}
            isSubmitting={form.formState.isSubmitting}
            align="between"
          />
        </FmCommonStackLayout>
      )}
    </FmCommonForm>
  );
}
```

---

## Custom Input Rendering

### Date Picker Integration
```tsx
import { Calendar } from '@/components/ui/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { Button } from '@/components/ui/shadcn/button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

<FmCommonFormField
  form={form}
  name="birthDate"
  label="Birth Date"
  renderInput={(field) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !field.value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value}
          onSelect={field.onChange}
          disabled={(date) => date > new Date()}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  )}
/>
```

---

## Advanced Validation

### Password with Confirmation
```tsx
import { passwordField, passwordConfirmation } from '@/shared/utils';

const registerSchema = passwordConfirmation(
  z.object({
    email: emailField,
    password: passwordField,
  })
);

<FmCommonForm schema={registerSchema} defaultValues={{...}} onSubmit={...}>
  {(form) => (
    <>
      <FmCommonFormField form={form} name="email" label="Email" type="email" required />
      <FmCommonFormField form={form} name="password" label="Password" type="password" required />
      <FmCommonFormField
        form={form}
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        description="Must match password above"
        required
      />
      <FmCommonFormActions submitText="Register" isSubmitting={form.formState.isSubmitting} />
    </>
  )}
</FmCommonForm>
```

### Custom Validation Rules
```tsx
const schema = z.object({
  username: z.string()
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
    
  age: z.number()
    .int('Must be a whole number')
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Please enter a valid age'),
    
  website: z.string()
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('https://'), 'Must use HTTPS'),
    
  terms: z.boolean()
    .refine((val) => val === true, 'You must accept the terms'),
});
```

---

## Form State Access

### Using Form Methods
```tsx
<FmCommonForm schema={schema} defaultValues={{...}} onSubmit={...}>
  {(form) => {
    // Access form state
    const isDirty = form.formState.isDirty;
    const errors = form.formState.errors;
    const isValid = form.formState.isValid;
    
    // Watch specific fields
    const email = form.watch('email');
    
    return (
      <>
        <FmCommonFormField form={form} name="email" label="Email" type="email" />
        
        {/* Conditional rendering based on form state */}
        {email && (
          <p className="text-sm text-muted-foreground">
            Email will be sent to: {email}
          </p>
        )}
        
        <FmCommonFormActions
          submitText="Save"
          isSubmitting={form.formState.isSubmitting}
          disabled={!isDirty || !isValid}
        />
      </>
    );
  }}
</FmCommonForm>
```

---

## Security Examples

### Sanitized User Input
```tsx
import { sanitizeInput, prepareFormData } from '@/shared/utils';

const handleSubmit = async (data: z.infer<typeof schema>) => {
  // Sanitize any potentially dangerous fields
  const sanitized = {
    ...data,
    bio: sanitizeInput(data.bio),
  };
  
  // Prepare data (remove empty strings, trim values)
  const payload = prepareFormData(sanitized);
  
  await updateProfile(payload);
};
```

### Safe URL Encoding
```tsx
import { encodeForUrl } from '@/shared/utils';

const handleSubmit = async (data: z.infer<typeof schema>) => {
  // Safely encode data for external URLs
  const whatsappMessage = encodeForUrl(`New message from ${data.name}: ${data.message}`);
  const whatsappUrl = `https://wa.me/1234567890?text=${whatsappMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
```

---

## File Upload Example

```tsx
import { createFileValidation } from '@/shared/utils';

const imageSchema = z.object({
  name: stringRequired('Image name', 100),
  file: createFileValidation(5, ['image/jpeg', 'image/png', 'image/webp']),
  description: stringOptional(500),
});

<FmCommonForm schema={imageSchema} defaultValues={{...}} onSubmit={...}>
  {(form) => (
    <>
      <FmCommonFormField form={form} name="name" label="Image Name" required />
      
      <FmCommonFormField
        form={form}
        name="file"
        label="Upload Image"
        renderInput={(field) => (
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) field.onChange(file);
            }}
          />
        )}
      />
      
      <FmCommonFormField
        form={form}
        name="description"
        label="Description"
        textarea
        rows={3}
      />
      
      <FmCommonFormActions submitText="Upload" isSubmitting={form.formState.isSubmitting} />
    </>
  )}
</FmCommonForm>
```

---

## Best Practices

### 1. Always Use Type-Safe Schemas
```tsx
// ❌ Bad - No validation
const data = { name: userInput };

// ✅ Good - Validated with zod
const schema = z.object({ name: stringRequired('Name', 100) });
const validatedData = schema.parse(data);
```

### 2. Provide Clear Error Messages
```tsx
// ❌ Bad - Generic error
z.string().min(1)

// ✅ Good - Specific error
stringRequired('Event title', 200)
```

### 3. Use Descriptions for Complex Fields
```tsx
<FmCommonFormField
  form={form}
  name="ticketPrice"
  label="Ticket Price"
  type="number"
  description="Enter price in cents (e.g., 2500 = $25.00)"
  required
/>
```

### 4. Handle Async Submission Properly
```tsx
const handleSubmit = async (data: z.infer<typeof schema>) => {
  try {
    await saveData(data);
    toast.success('Saved successfully!');
    navigate('/success');
  } catch (error) {
    toast.error('Failed to save');
    console.error(error);
  }
};
```

### 5. Reset Form After Submission
```tsx
<FmCommonFormActions
  submitText="Create"
  showReset
  onReset={() => form.reset()}
  isSubmitting={form.formState.isSubmitting}
/>
```

---

## Common Patterns

### Conditional Fields
```tsx
{(form) => {
  const hasTicketing = form.watch('hasTicketing');
  
  return (
    <>
      <FmCommonFormField
        form={form}
        name="hasTicketing"
        label="Enable Ticketing"
        renderInput={(field) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
      
      {hasTicketing && (
        <FmCommonFormField
          form={form}
          name="ticketUrl"
          label="Ticket URL"
          type="url"
          required
        />
      )}
    </>
  );
}}
```

### Dynamic Field Arrays
```tsx
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'artists',
});

{fields.map((field, index) => (
  <div key={field.id} className="flex gap-2">
    <FmCommonFormField
      form={form}
      name={`artists.${index}.name`}
      label={`Artist ${index + 1}`}
    />
    <Button type="button" onClick={() => remove(index)}>Remove</Button>
  </div>
))}

<Button type="button" onClick={() => append({ name: '' })}>Add Artist</Button>
```

---

## Migration Guide

### Step 1: Create Schema
```tsx
const schema = z.object({
  name: stringRequired('Name', 100),
  email: emailField,
});
```

### Step 2: Replace Form Tag
```tsx
// Before
<form onSubmit={handleSubmit}>...</form>

// After
<FmCommonForm schema={schema} defaultValues={{...}} onSubmit={handleSubmit}>
  {(form) => (...)}
</FmCommonForm>
```

### Step 3: Replace Inputs
```tsx
// Before
<Input value={name} onChange={(e) => setName(e.target.value)} />

// After
<FmCommonFormField form={form} name="name" label="Name" />
```

### Step 4: Replace Submit Button
```tsx
// Before
<Button type="submit" disabled={isLoading}>Submit</Button>

// After
<FmCommonFormActions submitText="Submit" isSubmitting={form.formState.isSubmitting} />
```

Done! Your form now has automatic validation, error handling, and consistent UX.
