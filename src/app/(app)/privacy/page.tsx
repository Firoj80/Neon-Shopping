import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Privacy Policy</h1>
      <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary">Your Data, Your Control</CardTitle>
           <CardDescription className="text-muted-foreground">
            Last Updated: [Insert Date] {/* TODO: Update this date */}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p className="text-neonText">
            At Neon Shopping, we prioritize your privacy. This application is designed to operate primarily offline, storing your data directly on your device using your browser's local storage. {/* Updated App Name */}
          </p>
          <h3 className="font-semibold text-neonText/90 pt-2">Data Storage</h3> {/* Use neonText */}
          <p className="text-neonText">
            All shopping list items, budget information, and settings you enter are stored locally on your device within your web browser's storage. This data is not transmitted to our servers or any third party, unless future features explicitly require it (e.g., cloud sync, which would require your opt-in consent).
          </p>
           <h3 className="font-semibold text-neonText/90 pt-2">Data We Don't Collect</h3> {/* Use neonText */}
           <p className="text-neonText">
             We do not collect personal identification information, location data (beyond potential browser-based currency detection which is typically anonymized), or usage analytics without your explicit consent.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">Third-Party Services</h3> {/* Use neonText */}
           <p className="text-neonText">
            This app does not currently integrate with third-party services that collect personal data beyond standard browser functionality.
           </p>
           <h3 className="font-semibold text-neonText/90 pt-2">Data Security</h3> {/* Use neonText */}
           <p className="text-neonText">
             While we don't store your data remotely, the security of data stored locally depends on the security of your device and browser. We recommend using standard security practices for your device.
           </p>
            <h3 className="font-semibold text-neonText/90 pt-2">Changes to This Policy</h3> {/* Use neonText */}
           <p className="text-neonText">
             We may update this policy occasionally. We will notify you of significant changes by posting the new policy within the app or on our website.
           </p>
           <h3 className="font-semibold text-neonText/90 pt-2">Contact Us</h3> {/* Use neonText */}
           <p className="text-neonText">
             If you have questions about this Privacy Policy, please contact us via the information provided on the Contact Us page.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
