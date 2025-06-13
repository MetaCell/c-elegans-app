import type React from "react";

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface DatasetEntryProps {
  title: string;
  children: React.ReactNode;
}

export interface TabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}
