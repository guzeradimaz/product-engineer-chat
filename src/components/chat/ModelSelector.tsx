"use client";

import { LLMModel, LLM_MODELS } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Props {
  value: LLMModel;
  onChange: (model: LLMModel) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  const current = LLM_MODELS.find((m) => m.value === value) ?? LLM_MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#1e1e1e] border border-[#333] rounded-md transition-colors">
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#1a1a1a] border-[#333] text-white">
        {LLM_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.value}
            onClick={() => onChange(model.value)}
            className={`cursor-pointer hover:bg-[#2a2a2a] flex flex-col items-start gap-0.5 py-2 ${
              model.value === value ? "bg-[#2a2a2a]" : ""
            }`}
          >
            <span className="text-sm font-medium">{model.label}</span>
            <span className="text-xs text-zinc-500">{model.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
