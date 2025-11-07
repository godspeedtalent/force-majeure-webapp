import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsAndConditionsModal = ({
  isOpen,
  onClose,
}: TermsAndConditionsModalProps) => {
  return (
    <FmCommonModal
      open={isOpen}
      onClose={onClose}
      title='Terms and Conditions'
      size='lg'
    >
      <ScrollArea className='h-[60vh] pr-4'>
        <div className='space-y-6 text-sm text-foreground'>
          <section>
            <h3 className='font-canela text-base mb-2'>
              1. Acceptance of Terms
            </h3>
            <p className='text-muted-foreground'>
              By purchasing tickets through Force Majeure, you agree to be bound
              by these Terms and Conditions. Please read them carefully before
              completing your purchase. If you do not agree to these terms, you
              should not purchase tickets.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              2. Ticket Purchase and Pricing
            </h3>
            <p className='text-muted-foreground mb-2'>
              All ticket sales are final. Ticket prices are subject to service
              fees, processing fees, and applicable taxes. The total price
              displayed at checkout includes all mandatory fees and charges.
            </p>
            <p className='text-muted-foreground'>
              We reserve the right to cancel orders and refuse service to anyone
              at any time for any reason, including suspected fraudulent
              activity.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>3. Ticket Delivery</h3>
            <p className='text-muted-foreground'>
              Tickets will be delivered electronically to the email address
              provided at checkout. It is your responsibility to ensure the
              email address is accurate. Please check your spam folder if you do
              not receive your tickets within 24 hours of purchase.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              4. Refunds and Cancellations
            </h3>
            <p className='text-muted-foreground mb-2'>
              All ticket sales are final and non-refundable except in the
              following circumstances:
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>The event is cancelled and not rescheduled</li>
              <li>
                The event is rescheduled and you cannot attend the new date
              </li>
              <li>
                You purchased Ticket Protection and have a qualifying reason
              </li>
            </ul>
            <p className='text-muted-foreground mt-2'>
              Refund requests must be submitted within the timeframes specified
              in our refund policy. Processing fees are non-refundable.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>5. Event Changes</h3>
            <p className='text-muted-foreground'>
              Event date, time, location, and lineup are subject to change
              without notice. We will notify ticket holders of any significant
              changes via email. Minor changes to the event (such as supporting
              acts) do not qualify for refunds.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              6. Entry Requirements
            </h3>
            <p className='text-muted-foreground mb-2'>
              You must comply with all venue rules and regulations. Entry
              requirements may include:
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>Valid government-issued photo ID</li>
              <li>Age restrictions (18+ or 21+ events)</li>
              <li>Security screening and bag checks</li>
              <li>Health and safety requirements</li>
            </ul>
            <p className='text-muted-foreground mt-2'>
              The venue and event organizers reserve the right to refuse entry
              or remove anyone who does not comply with entry requirements or
              behaves inappropriately.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              7. Ticket Validity and Transfer
            </h3>
            <p className='text-muted-foreground'>
              Tickets are valid only for the specific event, date, and time
              indicated. Tickets obtained from unauthorized sources may be
              invalid. Resale of tickets for profit is prohibited unless through
              our official resale platform. We reserve the right to cancel
              tickets obtained through unauthorized channels without refund.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              8. Limitation of Liability
            </h3>
            <p className='text-muted-foreground'>
              Force Majeure, event organizers, and venues are not liable for any
              injury, loss, or damage to persons or property occurring at the
              event. Attendance is at your own risk. We are not responsible for
              any costs incurred as a result of event cancellation,
              postponement, or changes, including but not limited to travel,
              accommodation, or other related expenses.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>9. Force Majeure</h3>
            <p className='text-muted-foreground'>
              We are not liable for failure to perform our obligations due to
              circumstances beyond our reasonable control, including but not
              limited to acts of God, natural disasters, war, terrorism, riots,
              civil unrest, strikes, government restrictions, or public health
              emergencies.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              10. Recording and Photography
            </h3>
            <p className='text-muted-foreground'>
              Professional recording equipment and cameras may be prohibited at
              events. By attending, you consent to being filmed, photographed,
              or recorded, and grant us the right to use such recordings for
              promotional purposes without compensation.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              11. Privacy and Data Protection
            </h3>
            <p className='text-muted-foreground'>
              Your personal information will be processed in accordance with our
              Privacy Policy. By purchasing tickets, you consent to receiving
              transactional emails related to your order and event updates. You
              may opt out of marketing communications at any time.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              12. Prohibited Items and Behavior
            </h3>
            <p className='text-muted-foreground mb-2'>
              The following items and behaviors are prohibited at all events:
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>Weapons of any kind</li>
              <li>Illegal substances</li>
              <li>Outside food and beverages (unless medically necessary)</li>
              <li>Disruptive, aggressive, or threatening behavior</li>
              <li>Discrimination or harassment of any kind</li>
            </ul>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              13. Dispute Resolution
            </h3>
            <p className='text-muted-foreground'>
              Any disputes arising from these Terms and Conditions or your
              ticket purchase will be resolved through binding arbitration in
              accordance with the laws of the jurisdiction where Force Majeure
              operates. You waive your right to participate in class action
              lawsuits.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>14. Changes to Terms</h3>
            <p className='text-muted-foreground'>
              We reserve the right to modify these Terms and Conditions at any
              time. Changes will be effective immediately upon posting to our
              website. Your continued use of our services constitutes acceptance
              of any changes.
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              15. Contact Information
            </h3>
            <p className='text-muted-foreground'>
              For questions about these Terms and Conditions or your ticket
              purchase, please contact us at support@forcemajeure.com.
            </p>
          </section>

          <p className='text-xs text-muted-foreground mt-8 pt-4 border-t border-border'>
            Last updated: November 5, 2025
          </p>
        </div>
      </ScrollArea>
    </FmCommonModal>
  );
};
