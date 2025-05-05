import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">About Neon Shopping</h1> {/* Updated App Name */}
      <Card className="bg-card border-primary/30 shadow-neon">
        <CardHeader>
          <CardTitle className="text-secondary">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p>
            Welcome to Neon Shopping, your cyberpunk companion for managing finances with flair. {/* Updated App Name */}
            We believe tracking expenses and shopping lists shouldn't be boring.
          </p>
          <p>
            Our goal is to provide a sleek, intuitive, and visually engaging experience
            that makes financial management feel less like a chore and more like navigating
            the neon-lit streets of the future.
          </p>
           <p>
            Built with modern web technologies, Neon Shopping aims to be fast, responsive, {/* Updated App Name */}
            and accessible across devices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
