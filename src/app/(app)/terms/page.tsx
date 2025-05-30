import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Terms of Service</h1>
       <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary">Usage Agreement</CardTitle>
           <CardDescription className="text-muted-foreground">
            Last Updated: [Insert Date] {/* TODO: Update this date */}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p className="text-neonText">
            Welcome to Neon Shopping! By using this application ("App"), you agree to these Terms of Service ("Terms"). Please read them carefully. {/* Updated App Name */}
          </p>
          <h3 className="font-semibold text-neonText/90 pt-2">1. Use of the App</h3> {/* Use neonText */}
          <p className="text-neonText">
            Neon Shopping is provided for personal, non-commercial use to help you track shopping lists and expenses. You agree not to use the App for any illegal or unauthorized purpose. {/* Updated App Name */}
          </p>
           <h3 className="font-semibold text-neonText/90 pt-2">2. Data Storage and Responsibility</h3> {/* Use neonText */}
           <p className="text-neonText">
             As outlined in our Privacy Policy, your data is stored locally on your device. You are solely responsible for the accuracy, management, and backup of the data you enter into the App. We are not liable for any loss or corruption of data stored locally.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">3. Advertisements</h3> {/* Use neonText */}
           <p className="text-neonText">
            The App may display third-party advertisements via Google AdMob. Your interaction with these ads is subject to the terms and privacy policies of Google AdMob.
           </p>
           <h3 className="font-semibold text-neonText/90 pt-2">4. Intellectual Property</h3> {/* Use neonText */}
           <p className="text-neonText">
             The App and its original content, features, and functionality are owned by [Your Company/Your Name] and are protected by international copyright, trademark, and other intellectual property laws.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">5. Disclaimers</h3> {/* Use neonText */}
           <p className="text-neonText">
            The App is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not guarantee that the App will always be available, error-free, or meet your specific requirements. Financial data displayed is based on your input; we are not responsible for financial decisions made based on the App's data.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">6. Limitation of Liability</h3> {/* Use neonText */}
           <p className="text-neonText">
             To the fullest extent permitted by law, [Your Company/Your Name] shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">7. Changes to Terms</h3> {/* Use neonText */}
           <p className="text-neonText">
             We reserve the right to modify these Terms at any time. We will provide notice of significant changes. Your continued use of the App after changes constitutes your acceptance of the new Terms.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">8. Governing Law</h3> {/* Use neonText */}
           <p className="text-neonText">
            These Terms shall be governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
           </p>
           <h3 className="font-semibold text-neonText/90 pt-2">Contact Us</h3> {/* Use neonText */}
           <p className="text-neonText">
             If you have questions about these Terms, please contact us via the information provided on the Contact Us page.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
