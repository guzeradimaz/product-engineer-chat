"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <p className="text-zinc-400">Something went wrong.</p>
            <Button
              variant="ghost"
              onClick={() => this.setState({ hasError: false })}
              className="text-[#2563eb]"
            >
              Try again
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
