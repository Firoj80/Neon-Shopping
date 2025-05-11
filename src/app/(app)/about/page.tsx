import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">About Neon Shopping</h1>
      <Card className="bg-card border-primary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary">Your Cyberpunk Companion for Smarter Spending</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p className="text-neonText">
            Step into a world where budgeting meets style. Neon Shopping isn’t just another shopping list app — it’s your futuristic assistant for managing everyday purchases with flair. Designed with a bold neon-cyberpunk aesthetic, this app transforms the mundane task of expense tracking into an engaging, visually immersive experience.
          </p>
          <p className="text-neonText">
            We believe managing your finances shouldn't feel like a chore. That's why Neon Shopping combines sleek design with intuitive functionality, giving you the tools to take control of your spending in a way that feels more like exploring a neon-lit cityscape than filling out a spreadsheet.
          </p>
          <p className="text-neonText">
            Whether you’re organizing your grocery list, keeping tabs on daily expenses, or staying within budget, Neon Shopping makes the process simple, fast, and enjoyable. Built with modern web technologies, the app runs smoothly on your device and is optimized for mobile-first usage — perfect for managing your lists on the go.
          </p>
          <p className="text-neonText font-semibold pt-2">Important Note:</p>
          <p className="text-neonText">
            To prioritize speed and privacy, Neon Shopping stores your data locally on your device using LocalStorage. This means your shopping history, budget, and preferences are securely saved within your App/browser — but they won't sync across multiple devices or browsers. For the best experience, continue using the app on the same device you started with.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
