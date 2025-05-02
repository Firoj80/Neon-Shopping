import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Zap } from 'lucide-react'; // Example icons

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Contact Us</h1>
      <Card className="bg-card border-secondary/30 shadow-neon">
        <CardHeader>
          <CardTitle className="text-secondary">Get in Touch</CardTitle>
          <CardDescription className="text-muted-foreground">
            Have questions, feedback, or found a glitch in the matrix? Let us know!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            {/* Consider updating the email address if it was NeonWallet specific */}
            <a href="mailto:support@neonshoppinglist.app" className="text-neonText hover:text-primary transition-colors">
              support@neonshoppinglist.app
            </a>
          </div>
           <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-secondary" />
            <span className="text-neonText">Feature Requests & Feedback</span>
           </div>
             <p className="text-xs text-muted-foreground pl-8">
                We're always looking to improve. Share your ideas on how to make Neon Shopping List even better! Use the email above for now. {/* Updated App Name */}
             </p>
        </CardContent>
      </Card>
    </div>
  );
}
