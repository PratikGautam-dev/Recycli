import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';
import CombinedDetectClassify from '@/components/CombinedDetectClassify';
import { useToast } from '@/hooks/use-toast';
// import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { toast } = useToast();
  // const { user, loading, signOut } = useAuth();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/auth");
  //   }
  // }, [user, loading, navigate]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="py-8 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-ai rounded-xl flex items-center justify-center shadow-ai">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-ai bg-clip-text text-transparent">
                Recycli
              </h1>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <p className="text-sm text-muted-foreground">AI-powered recycling assistant</p>
              </div>
            </div>
          </div>
          {/*
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          */}
        </div>
      </div>
      <div className="text-center py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image of any object and let our AI identify what it is. 
            Perfect for sorting recyclables, identifying unknown items, or just satisfying your curiosity.
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <CombinedDetectClassify />
      </div>
      {/* Footer Note */}
      <div className="text-center py-8 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">
          🤖 Powered by Replicate CLIP model for zero-shot classification.
        </p>
      </div>
    </div>
  );
};

export default Index;
