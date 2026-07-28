import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { APP_NAME, COMPANY_NAME } from '@/lib/brand';
import AppFooter from '@/components/AppFooter';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/login" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
            <ChevronLeft className="h-5 w-5 text-slate-500 group-hover:text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-foreground">Terms and Conditions</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-sm max-w-none space-y-8 text-slate-700">
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using {APP_NAME} (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on {APP_NAME} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Disclaimer of Warranties</h2>
              <p>
                The materials on {APP_NAME} are provided on an 'as is' basis. {COMPANY_NAME} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Limitations of Liability</h2>
              <p>
                In no event shall {COMPANY_NAME} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {APP_NAME}.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on {APP_NAME} could include technical, typographical, or photographic errors. {COMPANY_NAME} does not warrant that any of the materials on the Service are accurate, complete, or current. {COMPANY_NAME} may make changes to the materials contained on the Service at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Materials and Links</h2>
              <p>
                {COMPANY_NAME} has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by {COMPANY_NAME} of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Modifications</h2>
              <p>
                {COMPANY_NAME} may revise these Terms and Conditions of the Service at any time without notice. By using the Service, you are agreeing to be bound by the then current version of these Terms and Conditions of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Governing Law</h2>
              <p>
                These Terms and Conditions and Privacy Policy are governed by and construed in accordance with the laws of the Republic of the Philippines, and you irrevocably submit to the exclusive jurisdiction of the courts located in the Philippines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Payment Processing</h2>
              <p>
                By using {APP_NAME}, you agree to comply with all applicable laws and regulations regarding payment processing. {COMPANY_NAME} is regulated and operates in accordance with Philippine banking and payment regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Security and Data Protection</h2>
              <p>
                {COMPANY_NAME} employs industry-standard security measures including 256-bit TLS encryption to protect user data. All payment information is processed in compliance with PCI DSS standards and data protection regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account information and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us through our official support channels.
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
